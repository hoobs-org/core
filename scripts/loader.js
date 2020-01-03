const _ = require("lodash");

const OS = require("os");
const Ora = require("ora");
const File = require("fs-extra");
const Copy = require("recursive-copy");
const Remove = require("rimraf");

const { dirname, join, basename } = require("path");
const { spawn } = require("child_process");
const { hashElement } = require("folder-hash");

class Throbber {
    constructor(debug) {
        this.debug = debug;
        this.throbber = null;
    }

    sleep(time) {
        return new Promise((resolve) => {
            setTimeout(resolve, time);
        })
    }

    async throb(message) {
        if (!this.debug) {
            message = message || "";

            this.throbber = Ora(message).start();
            this.throbber.color = "yellow";

            await this.sleep(100);
        }
    }

    async update(message, time) {
        if (message && message !== "") {
            if (this.debug) {
                console.log(message);
            } else {
                const data = message.split(":");

                message = data[0];
                data.shift();

                if (data.length > 0) {
                    message += `: ${data.map(v => v.trim().slice(-80)).join(": ")}`;
                }

                this.throbber.text = message;
                this.throbber.color = "yellow";

                await this.sleep(time);
            }
        }
    };

    async stop(message) {
        if (!this.debug) {
            await this.update(message, 10);

            this.throbber.stop();
        }
    };
}

module.exports = (debug, password, cpmod) => {
    const throbber = new Throbber(debug);

    const home = OS.userInfo().homedir;
    const root = join(home, ".hoobs");
    const applicaiton = join(dirname(File.realpathSync(__filename)), "../");
    const installed = tryParseFile(join(applicaiton, "package.json"));

    if (!installed) {
        throw new Error("HOOBS Installation is Corrupt. Please Re-Install HOOBS.");
    }

    if (!File.existsSync(root)) {
        File.mkdirSync(root);
    }

    const executing = tryParseFile(join(root, "package.json"));

    console.log("");

    checkEnviornment(home, password, throbber).then(async () => {
        if (!executing || installed.version !== executing.version || !(await checksum(root, applicaiton))) {
            let success = true;
            let stop = false;

            if (File.existsSync("/var/hoobs/.migration")) {
                await migrate(root, throbber);

                if (await preparePackage(root, executing, installed, throbber)) {
                    await setupUserMode(root, applicaiton, cpmod, throbber);

                    await throbber.throb("Clear Migration");

                    await execSudo(password, [
                        "rm",
                        "-fR",
                        "/var/hoobs/.migration"
                    ]);

                    await throbber.update(`Clear Migration: Migration cleared`, 100);
                    await throbber.stop("Clear Migration");
                } else {
                    success = false;

                    if (!File.existsSync(join(root, "lib")) || !File.existsSync(join(root, "dist"))) {
                        stop = true;

                        console.log("---------------------------------------------------------");
                        console.log("Unable to install plugins from the previous version.");
                        console.log("---------------------------------------------------------");
                        console.log("");
                    } else {
                        console.log("---------------------------------------------------------");
                        console.log("Unable to install plugins from the previous version.");
                        console.log("---------------------------------------------------------");
                        console.log("Loading previous version");
                        console.log("---------------------------------------------------------");
                    }
                }
            } else {
                if (await preparePackage(root, executing, installed, throbber)) {
                    await setupUserMode(root, applicaiton, cpmod, throbber);
                } else {
                    success = false;

                    if (!File.existsSync(join(root, "lib")) || !File.existsSync(join(root, "dist"))) {
                        stop = true;

                        console.log("---------------------------------------------------------");
                        console.log("There are configured plugins that are not installed.");
                        console.log("Please edit your config.json file and remove the missing");
                        console.log("plugin configurations, and remove the plugin from the");
                        console.log("plugins array.");
                        console.log("---------------------------------------------------------");
                        console.log("");
                    } else {
                        console.log("---------------------------------------------------------");
                        console.log("There are configured plugins that are not installed.");
                        console.log("Please edit your config.json file and remove the missing");
                        console.log("plugin configurations, and remove the plugin from the");
                        console.log("plugins array.");
                        console.log("---------------------------------------------------------");
                        console.log("Loading previous version");
                        console.log("---------------------------------------------------------");
                    }
                }
            }

            if (success) {
                await throbber.throb("Application");

                if (File.existsSync(join(root, "dist"))) {
                    Remove.sync(join(root, "dist"));
                }

                if (File.existsSync(join(root, "lib"))) {
                    Remove.sync(join(root, "lib"));
                }

                Copy(join(applicaiton, "dist"), join(root, "dist"), {
                    overwrite: true,
                    dot: true,
                    junk: false
                }).on(Copy.events.COPY_FILE_START, async (data) => {
                    await throbber.update(`Application: ${basename(data.src)}`, 0);
                }).finally(() => {
                    Copy(join(applicaiton, "lib"), join(root, "lib"), {
                        overwrite: true,
                        dot: true,
                        junk: false
                    }).on(Copy.events.COPY_FILE_START, async (data) => {
                        await throbber.update(`Application: ${basename(data.src)}`, 0);
                    }).finally(async () => {
                        if (File.existsSync("/etc/systemd/system/multi-user.target.wants/nginx.service")) {
                            await throbber.update("Application: Restarting NGINX", 0);

                            await execSudo(password, [
                                "systemctl",
                                "restart",
                                "nginx.service"
                            ]);
                        }

                        await throbber.stop("Application");

                        if (!(await checksum(root, applicaiton))) {
                            throw new Error("Unable to start user mode");
                        }

                        require(join(root, "lib/cli"))();
                    });
                });
            } else if (!stop) {
                require(join(root, "lib/cli"))();
            }
        } else {
            require(join(root, "lib/cli"))();
        }
    });
};

const tryParseFile = function(filename, replacement) {
    replacement = replacement || null;

    try {
        return JSON.parse(File.readFileSync(filename));
    } catch {
        return replacement;
    }
};

const preparePackage = async function (root, executing, installed, throbber) {
    await throbber.throb("Plugins");

    let plugins = [];
    let success = true;

    if (File.existsSync("/var/hoobs/.migration/plugins.json")) {
        await throbber.update("Plugins: Migrating existing plugins", 250);

        plugins = tryParseFile("/var/hoobs/.migration/plugins.json", []);
    }

    if (File.existsSync("/var/hoobs/.migration/dependencies.json")) {
        installed.dependencies = tryParseFile("/var/hoobs/.migration/dependencies.json", installed.dependencies);
    } else if (executing && executing.dependencies) {
        await throbber.update("Plugins: Reading existing plugins", 250);

        const current = tryParseFile(join(root, "etc", "config.json"), null);

        const deps = (current || {}).plugins || [];
        const keys = Object.keys(executing.dependencies);
        const orphaned = [];

        for (let i = 0; i < deps.length; i++) {
            await throbber.update(`Plugins: ${deps[i]}`, 500);

            let dep = null;
            let name = deps[i];

            if (executing.dependencies[name]) {
                dep = name;
            } else {
                dep = (keys.filter(d => d.startsWith("@") && d.endsWith(`/${name}`)) || [null])[0];
            }

            if (dep && executing.dependencies[dep]) {
                installed.dependencies[dep] = executing.dependencies[dep];
            } else if (current && (current.accessories || []).findIndex(a => (a.plugin_map || {}).plugin_name === name) === -1 && (current.platforms || []).findIndex(p => (p.plugin_map || {}).plugin_name === name) === -1) {
                orphaned.push(name);
            } else {
                await throbber.stop("Plugins");

                console.log(`Plugin "${name}" is missing`);

                await throbber.throb("Plugins");

                success = false;
            }
        }

        if (success && orphaned.length > 0) {
            for (let i = 0; i < orphaned.length; i++) {
                const index = (current.plugins || []).indexOf(orphaned[i]);

                if (index > -1) {
                    current.plugins.splice(index, 1);
                }
            }

            File.unlinkSync(join(root, "etc", "config.json"));
            File.appendFileSync(join(root, "etc", "config.json"), JSON.stringify(current, null, 4));
        }
    }

    if (success) {
        if (installed.devDependencies) {
            delete installed.devDependencies;
        }

        if (installed.scripts) {
            delete installed.scripts;
        }

        if (installed.bin) {
            delete installed.bin;
        }

        await throbber.update("Plugins: Writing package file", 250);

        if (File.existsSync(join(root, "package.json"))) {
            File.unlinkSync(join(root, "package.json"));
        }

        File.appendFileSync(join(root, "package.json"), JSON.stringify(installed, null, 4));

        for (let i = 0; i < plugins.length; i++) {
            await throbber.update(`Plugins: ${plugins[i].name}`, 0);
            
            if (!(await npmInstall(root, plugins[i].name, plugins[i].version, throbber))) {
                success = false;
            };
        }
    }

    await throbber.stop("Plugins");

    return success;
};

const setupUserMode = function (root, applicaiton, cpmod, throbber) {
    return new Promise(async (resolve) => {
        if (File.existsSync("/var/hoobs/.migration/config.json")) {
            await throbber.throb("Configuring");

            let current = {
                bridge: {
                    name: "HOOBS",
                    port: 51826,
                    pin: "031-45-154"
                },
                description: "",
                ports: {},
                plugins: [],
                interfaces: [],
                accessories: [],
                platforms: []
            };

            await throbber.update("Configuring: Migrating existing configuration", 250);

            current = _.extend(current, tryParseFile(join(applicaiton, "default.json"), current));
            current = _.extend(current, tryParseFile("/var/hoobs/.migration/config.json", current));

            if (current.plugins.length === 0 && File.existsSync("/var/hoobs/.migration/plugins.json")) {
                await throbber.update("Configuring: Creating plugin white list", 250);

                const plugins = tryParseFile("/var/hoobs/.migration/plugins.json", []);

                for (let i = 0; i < plugins.length; i++) {
                    if (current.plugins.indexOf(plugins[i].name) === -1) {
                        current.plugins.push(plugins[i].name);
                    }
                }

                await throbber.update("Configuring: Mapping plugins", 250);

                const platforms = {};
                const accessories = {};

                for (let i = 0; i < (current.platforms || []).length; i++) {
                    if (!platforms[current.platforms[i].platform]) {
                        platforms[current.platforms[i].platform] = [];
                    }

                    platforms[current.platforms[i].platform].push(i);
                }

                for (let i = 0; i < (current.accessories || []).length; i++) {
                    if (!accessories[current.accessories[i].accessory]) {
                        accessories[current.accessories[i].accessory] = [];
                    }

                    accessories[current.accessories[i].accessory].push(i);
                }

                for (let i = 0; i < plugins.length; i++) {
                    for (let j = 0; j < (plugins[i].details || []).length; j++) {
                        switch (plugins[i].details[j].type) {
                            case "platform":
                                for (let k = 0; k < (platforms[plugins[i].details[j].alias] || []).length; k++) {
                                    current.platforms[platforms[plugins[i].details[j].alias][k]].plugin_map = {
                                        plugin_name: plugins[i].name
                                    }
                                }

                                break;

                            case "accessory":
                                for (let k = 0; k < (accessories[plugins[i].details[j].alias] || []).length; k++) {
                                    current.accessories[accessories[plugins[i].details[j].alias][k]].plugin_map = {
                                        plugin_name: plugins[i].name,
                                        index: 0
                                    }
                                }

                                break;
                        }
                    }
                }
            }

            await throbber.update("Configuring: Writing configuration", 250);

            if (File.existsSync(join(root, "etc", "config.json"))) {
                File.unlinkSync(join(root, "etc", "config.json"));
            }

            File.appendFileSync(join(root, "etc", "config.json"), JSON.stringify(current, null, 4));

            await throbber.stop("Configuring");
        }

        await throbber.throb("Modules");

        if (File.existsSync(join(root, "dist"))) {
            Remove.sync(join(root, "dist"));
        }

        if (File.existsSync(join(root, "lib"))) {
            Remove.sync(join(root, "lib"));
        }

        if (cpmod) {
            Copy(join(applicaiton, "node_modules"), join(root, "node_modules"), {
                overwrite: true,
                dot: true,
                junk: false
            }).on(Copy.events.COPY_FILE_START, async (data) => {
                await throbber.update(`Modules: ${basename(data.src)}`, 0);
            }).finally(async () => {
                if (File.existsSync(join(root, "package-lock.json"))) {
                    File.unlinkSync(join(root, "package-lock.json"));
                }

                if (File.existsSync(join(root, "default.json"))) {
                    File.unlinkSync(join(root, "default.json"));
                }

                await throbber.update("Modules: default.json", 100);

                File.copySync(join(applicaiton, "default.json"), join(root, "default.json"));

                await throbber.stop("Modules");

                resolve();
            });
        } else {
            await throbber.stop("Modules");

            resolve();
        }
    });
};

const checkEnviornment = function (home, password, throbber) {
    return new Promise(async (resolve) => {
        await throbber.throb("Enviornment");

        const queue = [];

        if (File.existsSync(join(home, ".npm"))) {
            await throbber.update(`Enviornment: Clearing NPM Cache`, 100);

            await execSudo(password, [
                "rm",
                "-fR",
                join(home, ".npm")
            ]);
        }

        if (File.existsSync(join(home, ".config"))) {
            try {
                File.accessSync(join(home, ".config"), File.constants.W_OK);

                await throbber.update(`Enviornment: NPM Configuration OK`, 100);
            } catch (err) {
                await throbber.update(`Enviornment: NPM Configuration is Root Locked`, 100);

                await execSudo(password, [
                    "rm",
                    "-fR",
                    join(home, ".config")
                ]);
            }
        }

        if (File.existsSync(join(home, ".node-gyp"))) {
            try {
                File.accessSync(join(home, ".node-gyp"), File.constants.W_OK);

                await throbber.update(`Enviornment: GYP Build Cache OK`, 100);
            } catch (err) {
                await throbber.update(`Enviornment: GYP Build Cache is Root Locked`, 100);

                await execSudo(password, [
                    "rm",
                    "-fR",
                    join(home, ".node-gyp")
                ]);
            }
        }

        if (queue.length === 0) {
            await throbber.stop("Enviornment");

            resolve();
        }
    });
};

const migrate = async function (root, throbber) {
    await throbber.throb("Migrating");

    if (File.existsSync("/var/hoobs/.migration/access.json")) {
        await throbber.update("Migrating: access.json", 250);

        if (File.existsSync(join(root, "etc", "access.json"))) {
            File.unlinkSync(join(root, "etc", "access.json"));
        }

        File.copySync("/var/hoobs/.migration/access.json", join(root, "etc", "access.json"));
    }

    if (File.existsSync("/var/hoobs/.migration/layout.json")) {
        await throbber.update("Migrating: layout.json", 250);

        if (File.existsSync(join(root, "etc", "layout.json"))) {
            File.unlinkSync(join(root, "etc", "layout.json"));
        }

        File.copySync("/var/hoobs/.migration/layout.json", join(root, "etc", "layout.json"));
    }

    if (File.existsSync("/var/hoobs/.migration/accessories")) {
        await throbber.update("Migrating: accessories", 250);

        if (File.existsSync(join(root, "etc", "accessories"))) {
            Remove.sync(join(root, "etc", "accessories"));
        }

        File.copySync("/var/hoobs/.migration/accessories", join(root, "etc", "accessories"));
    }

    if (File.existsSync("/var/hoobs/.migration/persist")) {
        await throbber.update("Migrating: persist", 250);

        if (File.existsSync(join(root, "etc", "persist"))) {
            Remove.sync(join(root, "etc", "persist"));
        }

        File.copySync("/var/hoobs/.migration/persist", join(root, "etc", "persist"));
    }

    if (File.existsSync("/var/hoobs/.migration/unmanaged.json")) {
        const unmanaged = tryParseFile("/var/hoobs/.migration/unmanaged.json", []);

        for (let i = 0; i < unmanaged.length; i++) {
            await throbber.update(`Migrating: ${unmanaged[i]}`, 250);

            if (File.existsSync(join(root, "etc", unmanaged[i]))) {
                File.unlinkSync(join(root, "etc", unmanaged[i]));
            }

            File.copySync(join("/var/hoobs/.migration", unmanaged[i]), join(root, "etc", unmanaged[i]));
        }
    }

    await throbber.stop("Migrating");
};

const npmInstall = function (root, name, version, throbber) {
    return new Promise((resolve) => {
        const proc = spawn("npm", [
            "install",
            "--unsafe-perm",
            `${name}${version && version !== "" ? `@${version}` : ""}`
        ], {
            cwd: root
        });

        proc.stderr.on("data", async (data) => {
            data = `${data}`.split("\n");
            data = data.map(l => l.trim());
            data = data.join(" - ");

            await throbber.update(`Plugins: ${name} - ${data}`, 0);
        });

        proc.on("close", () => {
            if (File.existsSync(join(root, "node_modules", name))) {
                resolve(true);
            } else {
                resolve(false);
            }
        });
    });
};

const execSudo = function(password, options) {
    return new Promise(async (resolve) => {
        let prompts = 0;

        let args = [
            "-S",
            "-k",
            "-p",
            "#sudo-hoobs#"
        ];

        args = args.concat(options);

        const proc = spawn("sudo", args);

        proc.stderr.on("data", (data) => {
            const lines = `${data}`.split(/\r?\n/);

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();

                if (line === "#sudo-hoobs#") {
                    if (++prompts > 1) {
                        proc.stdin.write("\n\n\n\n");
                    } else {
                        proc.stdin.write(`${password || ""}\n`);
                    }
                }
            }
        });

        proc.on("close", async () => {
            resolve();
        });
    });
};

const checksum = async function(root, applicaiton) {
    if (!File.existsSync(join(root, "dist"))) {
        return false;
    }

    if (!File.existsSync(join(root, "lib"))) {
        return false;
    }

    const options = {
        files: {
            exclude: [
                ".DS_Store"
            ]
        }
    };

    const checksums = {
        dist: {
            local: await hashElement(join(root, "dist"), options),
            source: await hashElement(join(applicaiton, "dist"), options)
        },
        lib: {
            local: await hashElement(join(root, "lib"), options),
            source: await hashElement(join(applicaiton, "lib"), options)
        }
    }

    if (checksums.dist.local.hash.toString() !== checksums.dist.source.hash.toString()) {
        return false;
    }

    if (checksums.lib.local.hash.toString() !== checksums.lib.source.hash.toString()) {
        return false;
    }

    return true;
};
