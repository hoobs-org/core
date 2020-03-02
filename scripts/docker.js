const _ = require("lodash");

const Ora = require("ora");
const File = require("fs-extra");
const Copy = require("recursive-copy");
const Remove = require("rimraf");

const { dirname, join, basename } = require("path");
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

module.exports = (debug) => {
    (async () => {
        const throbber = new Throbber(debug);

        const applicaiton = join(dirname(File.realpathSync(__filename)), "../");
        const installed = tryParseFile(join(applicaiton, "package.json"));

        if (!installed) {
            throw new Error("HOOBS Installation is Corrupt. Please Re-Install HOOBS.");
        }

        if (!File.existsSync("/hoobs")) {
            File.mkdirSync("/hoobs");
        }

        const executing = tryParseFile("/hoobs/package.json");

        console.log("");

        if (!executing || installed.version !== executing.version || !(await checksum(applicaiton))) {
            let success = true;
            let stop = false;

            if (await preparePackage(executing, installed, throbber)) {
                await setupUserMode(applicaiton, throbber);
            } else {
                success = false;

                if (!File.existsSync("/hoobs/lib") || !File.existsSync("/hoobs/dist")) {
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

            if (success) {
                await throbber.throb("Application");

                if (File.existsSync("/hoobsdist")) {
                    Remove.sync("/hoobs/dist");
                }

                if (File.existsSync("/hoobs/lib")) {
                    Remove.sync("/hoobs/lib");
                }

                Copy(join(applicaiton, "dist"), "/hoobs/dist", {
                    overwrite: true,
                    dot: true,
                    junk: false
                }).on(Copy.events.COPY_FILE_START, async (data) => {
                    await throbber.update(`Application: ${basename(data.src)}`, 0);
                }).finally(() => {
                    Copy(join(applicaiton, "lib"), "/hoobs/lib", {
                        overwrite: true,
                        dot: true,
                        junk: false
                    }).on(Copy.events.COPY_FILE_START, async (data) => {
                        await throbber.update(`Application: ${basename(data.src)}`, 0);
                    }).finally(async () => {
                        await throbber.stop("Application");

                        if (!(await checksum(applicaiton))) {
                            throw new Error("Unable to start user mode");
                        }

                        require("/hoobs/lib/cli")(true);
                    });
                });
            } else if (!stop) {
                require("/hoobs/lib/cli")(true);
            }
        } else {
            require("/hoobs/lib/cli")(true);
        }
    })();
};

const tryParseFile = function(filename, replacement) {
    replacement = replacement || null;

    try {
        return JSON.parse(File.readFileSync(filename));
    } catch {
        return replacement;
    }
};

const preparePackage = async function (executing, installed, throbber) {
    await throbber.throb("Plugins");

    let success = true;

    if (executing && executing.dependencies) {
        await throbber.update("Plugins: Reading existing plugins", 250);

        const current = tryParseFile("/hoobs/etc/config.json", null);

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

            File.unlinkSync("/hoobs/etc/config.json");
            File.appendFileSync("/hoobs/etc/config.json", JSON.stringify(current, null, 4));
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

        if (File.existsSync("/hoobs/package.json")) {
            File.unlinkSync("/hoobs/package.json");
        }

        File.appendFileSync("/hoobs/package.json", JSON.stringify(installed, null, 4));
    }

    await throbber.stop("Plugins");

    return success;
};

const setupUserMode = function (applicaiton, throbber) {
    return new Promise(async (resolve) => {
        await throbber.throb("Modules");

        if (File.existsSync("/hoobs/dist")) {
            Remove.sync("/hoobs/dist");
        }

        if (File.existsSync("/hoobs/lib")) {
            Remove.sync("/hoobs/lib");
        }

        Copy(join(applicaiton, "node_modules"), "/hoobs/node_modules", {
            overwrite: true,
            dot: true,
            junk: false
        }).on(Copy.events.COPY_FILE_START, async (data) => {
            await throbber.update(`Modules: ${basename(data.src)}`, 0);
        }).finally(async () => {
            if (File.existsSync("/hoobs/package-lock.json")) {
                File.unlinkSync("/hoobs/package-lock.json");
            }

            if (File.existsSync("/hoobs/default.json")) {
                File.unlinkSync("/hoobs/default.json");
            }

            await throbber.update("Modules: default.json", 100);

            File.copySync(join(applicaiton, "default.json"), "/hoobs/default.json");

            await throbber.stop("Modules");

            resolve();
        });
    });
};

const checksum = async function(applicaiton) {
    if (!File.existsSync("/hoobs/dist")) {
        return false;
    }

    if (!File.existsSync("/hoobs/lib")) {
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
            local: await hashElement("/hoobs/dist", options),
            source: await hashElement(join(applicaiton, "dist"), options)
        },
        lib: {
            local: await hashElement("/hoobs/lib", options),
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
