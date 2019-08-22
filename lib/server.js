const _ = require("lodash");
const symlink = require("symlink-dir");

const Remove = require("rimraf");
const File = require("fs-extra");
const System = require("@hoobs/systeminfo");
const Migrate = require("./migrate");

const { dirname, join } = require("path");
const { spawn } = require("child_process");

module.exports = class Server {
    constructor(options) {
        this.version = require(join(Server.paths.homebridge, "/lib/version"));

        this.arguments = [
            "-U",
            join(Server.paths.config, global.INSTANCE || "")
        ].concat(options || []);

        this.process = null;
        this.events = {};
        this.running = false;
        this.time = new Date();
    }

    static paths = {
        application: dirname(File.realpathSync(join(__filename, "../"))),
        config: join(dirname(File.realpathSync(join(__filename, "../"))), "/etc"),
        dist: join(dirname(File.realpathSync(join(__filename, "../"))), "/dist"),
        modules: {
            local: join(dirname(File.realpathSync(join(__filename, "../"))), "/node_modules"),
            global: "/usr/local/lib/node_modules"
        },
        homebridge: join(dirname(File.realpathSync(join(__filename, "../"))), "/node_modules/@hoobs/homebridge")
    }

    static generateUsername() {
        let value = "";
        
        for (let i = 0; i < 6; i++) {
            if (value !== "") {
                value += ":";
            }
            
            const hex = `00${Math.floor(Math.random() * 255).toString(16).toUpperCase()}`;
    
            value += hex.substring(hex.length - 2, hex.length);
        }
    
        return value;
    }

    static async configure() {
        let init = false;

        File.ensureDirSync(Server.paths.config);

        if (global.INSTANCE && global.INSTANCE !== "") {
            File.ensureDirSync(join(Server.paths.config, global.INSTANCE || ""));
        }

        let current = {
            server: {},
            client: {},
            bridge: {},
            description: "",
            ports: {},
            plugins: [],
            interfaces: [],
            accessories: [],
            platforms: []
        };

        let hostname = (await System.osInfo()).hostname;

        if (!hostname.endsWith(".local") && !hostname.endsWith(".lan")) {
            hostname = `${hostname}.local`;
        }

        if (!File.existsSync(join(Server.paths.config, global.INSTANCE || "", "config.json"))) {
            init = true;

            File.copyFileSync(join(Server.paths.application, "default.json"), join(Server.paths.config, global.INSTANCE || "", "config.json"));

            if (!File.existsSync(join(Server.paths.config, "access.json"))) {
                Migrate.access(Server.paths.config);
            }

            current = _.extend(current, JSON.parse(File.readFileSync(join(Server.paths.config, global.INSTANCE || "", "config.json"))));
            current = _.extend(current, Migrate.configure(Server.paths.config));

            current.client.config = `http://${hostname}:51827`;
            current.client.socket = `http://${hostname}:51828`;

            current.client.api = [
                `http://${hostname}:51827`
            ];

            const plugins = await Migrate.plugins(Server.paths.modules.global, Server.paths.application);

            if (!current.plugins || current.plugins.length === 0) {
                current.plugins = plugins;
            }

            await Migrate.cleanup(Server.paths.modules.global);
        } else {
            current = _.extend(current, JSON.parse(File.readFileSync(join(Server.paths.config, global.INSTANCE || "", "config.json"))));
        }

        if (init || !current.bridge.username || current.bridge.username === "") {
            if (global.INSTANCE && global.INSTANCE !== "") {
                current.server.port = 52827;
                current.server.socket = `http://${hostname}:51828`;
                current.bridge.name = `HOOBS [${global.INSTANCE}]`;
                current.bridge.port = 52826;

                delete current.server.client;
            }

            current.bridge.username = Server.generateUsername();
        }

        Server.saveConfig(current, true);

        const modules = File.readdirSync(Server.paths.modules.local).filter(file => File.lstatSync(join(Server.paths.modules.local, file)).isSymbolicLink());

        for (let i = 0; i < modules.length; i++) {
            File.unlinkSync(join(Server.paths.modules.local, modules[i]));
        }

        const plugins = [];

        for (let i = 0; i < current.interfaces.length; i++) {
            const directory = join(Server.paths.modules.local, current.interfaces[i]);

            if (File.existsSync(join(directory, "/package.json"))) {
                const item = JSON.parse(File.readFileSync(join(directory, "/package.json")));

                if (Array.isArray(item.keywords) && item.keywords.indexOf("homebridge-interface") >= 0 && item.name && item.name !== "") {
                    plugins.push({
                        module: current.interfaces[i],
                        name: item.name,
                        route: item.route,
                        plugin_icon: item.plugin_icon,
                        title: item.title || ""
                    });
                }
            } else if (global.PLUGINS) {
                let directory = global.PLUGINS;

                if (!global.PLUGINS.endsWith(current.interfaces[i])) {
                    directory = join(global.PLUGINS, current.interfaces[i]);
                }

                if (File.existsSync(join(directory, "/package.json"))) {
                    const item = JSON.parse(File.readFileSync(join(directory, "/package.json")));

                    if (Array.isArray(item.keywords) && item.keywords.indexOf("homebridge-interface") >= 0 && item.name && item.name !== "") {
                        symlink(directory, join(Server.paths.modules.local, current.interfaces[i]));

                        plugins.push({
                            module: current.interfaces[i],
                            name: item.name,
                            route: item.route,
                            plugin_icon: item.plugin_icon,
                            title: item.title || ""
                        });
                    }
                }
            }
        }

        if (File.existsSync(join(Server.paths.config, global.INSTANCE || "", "plugins.json"))) {
            File.unlinkSync(join(Server.paths.config, global.INSTANCE || "", "plugins.json"));
        }

        File.appendFileSync(join(Server.paths.config, global.INSTANCE || "", "plugins.json"), JSON.stringify(plugins, null, 4));

        return current;
    }

    static saveConfig(config, skipBackup) {
        const current = JSON.parse(File.readFileSync(join(Server.paths.config, global.INSTANCE || "", "config.json")));

        if (JSON.stringify(config) !== JSON.stringify(current)) {
            if (skipBackup) {
                File.unlinkSync(join(Server.paths.config, global.INSTANCE || "", "config.json"));
            } else {
                File.renameSync(join(Server.paths.config, global.INSTANCE || "", "config.json"), join(Server.paths.config, global.INSTANCE || "", `/config-${new Date().getTime()}.json`));
            }

            File.appendFileSync(join(Server.paths.config, global.INSTANCE || "", "config.json"), JSON.stringify(config, null, 4));
        }
    }

    on(event, callback) {
        switch (event) {
            case "stdout":
                this.stdout = callback;
                break;

            case "stderr":
                this.stderr = callback;
                break;

            case "close":
                this.close = callback;
                break;

            case "start":
                this.events.start = callback;
                break;

            case "stop":
                this.events.stop = callback;
                break;
        }
    }

    start() {
        return new Promise((resolve) => {
            if (!this.running) {
                this.process = spawn(join(Server.paths.homebridge, "/bin/homebridge"), this.arguments, {
                    cwd: Server.paths.application
                });

                this.process.stdout.on("data", async (data) => {
                    const lines = `${data}`.split(/\r?\n/);

                    for (let i = 0; i < lines.length; i++) {
                        const line = lines[i].trim();

                        if (line !== "") {
                            global.log.info(`[Homebridge] ${line}`);

                            if (this.stdout) {
                                this.stdout(line);
                            }
        
                            if (line.startsWith("X-HM://")) {
                                config = await Server.configure();

                                if (config.server.home_setup_id !== line) {
                                    config.server.home_setup_id = line;
        
                                    Server.saveConfig(config, true);
                                }
                            }
        
                            if (line.endsWith(`Service is running on port ${config.bridge.port}.`)) {
                                this.time = new Date();
        
                                if (this.events.start) {
                                    this.events.start();
                                }
        
                                resolve();
                            }
                        }
                    }
                });

                this.process.stderr.on("data", (data) => {
                    const lines = `${data}`.split(/\r?\n/);

                    for (let i = 0; i < lines.length; i++) {
                        const line = lines[i].trim();

                        if (line !== "") {
                            global.log.error(`[Homebridge] ${line}`);

                            if (this.stderr) {
                                this.stderr(line);
                            }
                        }
                    }
                });

                this.process.on("exit", (data) => {
                    this.running = false;
                    this.time = new Date();

                    if (this.events.stop) {
                        this.events.stop();
                    }

                    this.process.kill("SIGINT");

                    resolve();
                });

                this.running = true;
            } else {
                resolve();
            }
        });
    }

    stop() {
        return new Promise((resolve) => {
            if (this.running) {
                this.process.on("exit", (data) => {
                    this.running = false;
                    this.time = new Date();

                    if (this.events.stop) {
                        this.events.stop();
                    }

                    resolve();
                });

                this.process.kill("SIGINT");
            } else {
                resolve();
            }
        });
    }

    restart() {
        return new Promise((resolve) => {
            this.stop().then(() => {
                this.start().then(() => {
                    resolve();
                });
            });
        });
    }

    clean() {
        return new Promise((resolve) => {
            this.stop().then(async () => {
                Remove.sync(join(Server.paths.config, global.INSTANCE || "", "persist"));
                Remove.sync(join(Server.paths.config, global.INSTANCE || "", "accessories"));

                config = await Server.configure();
            });
        });
    }

    static update() {
        return new Promise((resolve) => {
            let prompts = 0;

            const process = spawn("sudo", [
                "-S",
                "-k",
                "-p",
                "#sudo-hoobs#",
                join(Server.paths.modules.global, "npm/bin/npm-cli.js"),
                "install",
                "-g",
                "--unsafe-perm",
                "@hoobs/hoobs"
            ]);

            process.stdout.on("data", (data) => {
                console.log(`${data}`.trimEnd());
            });

            process.stderr.on("data", (data) => {
                const lines = `${data}`.split(/\r?\n/);

                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i].trim();

                    if (line === "#sudo-hoobs#") {
                        if (++prompts > 1) {
                            process.stdin.write("\n\n\n\n");
                        } else {
                            process.stdin.write(`${global.SUDO_PWD || ""}\n`);
                        }
                    } else {
                        console.log(line);
                    }
                }
            });

            process.on("close", () => {
                return resolve();
            });
        });
    }

    static reboot() {
        let prompts = 0;

        const process = spawn("sudo", [
            "-S",
            "-k",
            "-p",
            "#sudo-hoobs#",
            "shutdown",
            "-r",
            "now"
        ]);

        process.stdout.on("data", (data) => {
            console.log(`${data}`.trimEnd());
        });

        process.stderr.on("data", (data) => {
            const lines = `${data}`.split(/\r?\n/);

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();

                if (line === "#sudo-hoobs#") {
                    if (++prompts > 1) {
                        process.stdin.write("\n\n\n\n");
                    } else {
                        process.stdin.write(`${global.SUDO_PWD || ""}\n`);
                    }
                } else {
                    console.log(line);
                }
            }
        });
    }
}
