const _ = require("lodash");
const symlink = require("symlink-dir");

const Remove = require("rimraf");
const File = require("fs-extra");

const { dirname, join } = require("path");
const { spawn } = require("child_process");

module.exports = class Server {
    constructor(options) {
        this.version = require(join(Server.paths.homebridge, "/lib/version"));

        this.arguments = [
            "-U",
            Server.paths.config.path
        ].concat(options || []);

        this.process = null;
        this.events = {};
        this.running = false;
        this.time = new Date();
    }

    static paths = {
        application: dirname(File.realpathSync(join(__filename, "../"))),
        config: {
            path: join(dirname(File.realpathSync(join(__filename, "../"))), "/etc"),
            default: join(dirname(File.realpathSync(join(__filename, "../"))), "/etc/default.json"),
            main: join(dirname(File.realpathSync(join(__filename, "../"))), "/etc/config.json"),
            access: join(dirname(File.realpathSync(join(__filename, "../"))), "/etc/access.json"),
            layout: join(dirname(File.realpathSync(join(__filename, "../"))), "/etc/layout.json"),
            plugins: join(dirname(File.realpathSync(join(__filename, "../"))), "/etc/plugins.json")
        },
        persist: join(dirname(File.realpathSync(join(__filename, "../"))), "/persist"),
        dist: join(dirname(File.realpathSync(join(__filename, "../"))), "/dist"),
        modules: {
            local: join(dirname(File.realpathSync(join(__filename, "../"))), "/node_modules"),
            global: process.platform === "win32" ? join(process.env.APPDATA, "npm/node_modules") : "/usr/local/lib/node_modules"
        },
        plugins: join(dirname(File.realpathSync(join(__filename, "../"))), "/plugins"),
        homebridge: join(dirname(File.realpathSync(join(__filename, "../"))), "/node_modules/homebridge")
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

    static configure() {
        const init = false;

        if (!File.existsSync(Server.paths.config.main)) {
            init = true;

            File.copyFileSync(Server.paths.config.default, Server.paths.config.main);
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

        current = _.extend(current, JSON.parse(File.readFileSync(Server.paths.config.main)));

        if (init) {
            current.bridge.username = Server.generateUsername();
        }

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

        if (File.existsSync(Server.paths.config.plugins)) {
            File.unlinkSync(Server.paths.config.plugins);
        }

        File.appendFileSync(Server.paths.config.plugins, JSON.stringify(plugins, null, 4));

        return current;
    }

    static saveConfig(config, skipBackup) {
        const current = JSON.parse(File.readFileSync(Server.paths.config.main));

        if (JSON.stringify(config) !== JSON.stringify(current)) {
            if (skipBackup) {
                File.unlinkSync(Server.paths.config.main);
            } else {
                File.renameSync(Server.paths.config.main, join(Server.paths.config.path, `/config-${new Date().getTime()}.json`));
            }

            File.appendFileSync(Server.paths.config.main, JSON.stringify(config, null, 4));
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

                this.process.stdout.on("data", (data) => {
                    const lines = `${data}`.split("\n");

                    for (let i = 0; i < lines.length; i++) {
                        const line = lines[i].trim();

                        if (line !== "") {
                            global.log.info(line);

                            if (this.stdout) {
                                this.stdout(line);
                            }
        
                            if (line.startsWith("X-HM://")) {
                                config = Server.configure();
                
                                if (config.server.home_setup_id !== line) {
                                    config.server.home_setup_id = line;
        
                                    Server.saveConfig(config, true);
                                }
                            }
        
                            if (line.endsWith(`Homebridge is running on port ${config.bridge.port}.`)) {
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
                    const lines = `${data}`.split("\n");

                    for (let i = 0; i < lines.length; i++) {
                        const line = lines[i].trim();

                        if (line !== "") {
                            global.log.error(line);

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
            this.stop().then(() => {
                Remove.sync(Server.paths.persist);

                config = Server.configure();

                this.start().then(() => {
                    resolve();
                });
            });
        });
    }
}
