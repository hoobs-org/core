const _ = require("lodash");

const OS = require("os");
const Remove = require("rimraf");
const File = require("fs-extra");
const Archiver = require("archiver");
const Unzip = require("unzipper");
const Migrate = require("./migrate");

const { dirname, join, basename } = require("path");
const { spawn } = require("child_process");

module.exports = class Server {
    constructor(options) {
        this.version = require(join(Server.paths.homebridge, "/lib/version"));

        this.arguments = [
            "-S",
            (config.system || "hoobs").split("-")[0],
            "-U",
            join(Server.paths.config, global.INSTANCE || "")
        ].concat(options || []);

        this.process = null;
        this.events = {};
        this.running = false;
        this.time = new Date();
    }

    static get paths() {
        return {
            application: dirname(File.realpathSync(join(__filename, "../"))),
            config: join(dirname(File.realpathSync(join(__filename, "../"))), "/etc"),
            dist: join(dirname(File.realpathSync(join(__filename, "../"))), "/dist"),
            modules: {
                local: join(dirname(File.realpathSync(join(__filename, "../"))), "/node_modules"),
                global: File.existsSync("/usr/local/lib/node_modules/@hoobs/hoobs") ? "/usr/local/lib/node_modules" : "/usr/lib/node_modules"
            },
            homebridge: join(dirname(File.realpathSync(join(__filename, "../"))), "/node_modules/@hoobs/homebridge")
        };
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

        if (!File.existsSync(join(Server.paths.config, global.INSTANCE || "", "config.json"))) {
            init = true;

            File.copyFileSync(join(Server.paths.application, "default.json"), join(Server.paths.config, global.INSTANCE || "", "config.json"));

            if (!File.existsSync(join(Server.paths.config, "access.json"))) {
                Migrate.access(Server.paths.config);
            }

            if (!File.existsSync(join(Server.paths.config, "layout.json"))) {
                Migrate.layout(Server.paths.config);
            }

            let contents = {};

            try {
                contents = JSON.parse(File.readFileSync(join(Server.paths.config, global.INSTANCE || "", "config.json")));
            } catch {
                contents = {};
            }

            current = _.extend(current, contents);
            current = _.extend(current, await Migrate.configure(Server.paths.config));

            const plugins = await Migrate.plugins(Server.paths.modules.global, Server.paths.application);

            if (!current.plugins || current.plugins.length === 0) {
                current.plugins = plugins;
            }

            await Migrate.cleanup(Server.paths.modules.global);
        } else {
            let contents = {};

            try {
                contents = JSON.parse(File.readFileSync(join(Server.paths.config, global.INSTANCE || "", "config.json")));
            } catch {
                contents = {};
            }

            current = _.extend(current, contents);
        }

        if (init) {
            if (global.INSTANCE && global.INSTANCE !== "") {
                current.server.port = 52827;
                current.bridge.name = `HOOBS [${global.INSTANCE}]`;
                current.bridge.port = 52826;

                delete current.server.client;
            }

            if (!current.bridge.username || current.bridge.username === "") {
                current.bridge.username = Server.generateUsername();
            }
        }

        if (current.package_manager && current.package_manager === "yarn") {
            current.package_manager = File.existsSync("/usr/local/bin/yarn") || File.existsSync("/usr/bin/yarn") ? "yarn" : "npm"
        } else {
            current.package_manager = "npm";
        }

        current = Server.configCheck(current);

        Server.saveConfig(current, true);

        return current;
    }

    static saveConfig(config, skipBackup) {
        let current = {};

        try {
            current = JSON.parse(File.readFileSync(join(Server.paths.config, global.INSTANCE || "", "config.json")));
        } catch {
            current = {};
        }

        if (JSON.stringify(config) !== JSON.stringify(current)) {
            if (skipBackup) {
                File.unlinkSync(join(Server.paths.config, global.INSTANCE || "", "config.json"));
            } else {
                File.renameSync(join(Server.paths.config, global.INSTANCE || "", "config.json"), join(Server.paths.config, global.INSTANCE || "", `/config-${new Date().getTime()}.json`));
            }

            File.appendFileSync(join(Server.paths.config, global.INSTANCE || "", "config.json"), JSON.stringify(config, null, 4));
        }
    }

    static configCheck(current) {
        if ((current.server.port && current.server.port === 51827) && current.client.port) {
            current.server.port = current.client.port;

            delete current.server.socket;

            delete current.client.domain;
            delete current.client.port;
            delete current.client.config;
            delete current.client.socket;
            delete current.client.api;
        }

        if (typeof current.server.autostart === "boolean"){
            current.server.autostart = current.server.autostart ? 0 : null;
        }

        return current;
    }

    static proxyCheck() {	
        if (File.existsSync("/etc/nginx/conf.d/hoobs.conf")) {	
            const proxy = File.readFileSync("/etc/nginx/conf.d/hoobs.conf").toString();	

            if (proxy.indexOf("http://127.0.0.1:51827") >= 0) {	
                const process = spawn("sudo", [	
                    "-S",	
                    "-k",	
                    "-p",	
                    "#sudo-hoobs#",	
                    join(Server.paths.modules.global, "@hoobs/hoobs/bin/hoobs-upgrade")	
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
                    Server.reboot();	
                });	
            }	
        }	
    }	

    static update() {	
        return new Promise((resolve) => {	
            let prompts = 0;	

            const process = spawn("sudo", [	
                "-S",	
                "-k",	
                "-p",	
                "#sudo-hoobs#",	
                "npm",	
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

    static reset() {
        global.server.stop().then(() => {
            Remove.sync(Server.paths.application);

            Server.reboot();
        });
    }

    static backup() {
        return new Promise((resolve, reject) => {
            const filename = `backup-${new Date().getTime()}`;

            const output = File.createWriteStream(join(Server.paths.dist, `${filename}.zip`));
            const archive = Archiver("zip");

            output.on("close", () => {
                const bits = Buffer.from(File.readFileSync(join(Server.paths.dist, `${filename}.zip`))).toString("base64");

                File.unlinkSync(join(Server.paths.dist, `${filename}.zip`));
                File.appendFileSync(join(Server.paths.dist, `${filename}.hbf`), bits);

                resolve(`/${filename}.hbf`);
            });
            
            archive.on("error", (error) => {
                reject(error);
            });

            archive.pipe(output);

            archive.file(join(Server.paths.application, "default.json"), {
                name: "default.json"
            });

            archive.directory(Server.paths.config, basename(Server.paths.config));
            archive.directory(Server.paths.modules.local, basename(Server.paths.modules.local));

            archive.file(join(Server.paths.application, "package.json"), {
                name: "package.json"
            });

            archive.finalize();
        });
    }

    static restore(path) {
        global.server.stop().then(() => {
            Remove.sync(Server.paths.application);

            const home = OS.userInfo().homedir;
            const root = join(home, ".hoobs");

            if (!File.existsSync(root)){
                File.mkdirSync(root);
            }

            const filename = `restore-${new Date().getTime()}.zip`;
            const stream = File.createWriteStream(join(root, filename));

            stream.write(Buffer.from(File.readFileSync(path, "utf8"), "base64"));
            stream.end();

            File.unlinkSync(path);

            File.createReadStream(join(root, filename)).pipe(Unzip.Extract({
                path: root
            })).on("finish", () => {
                Server.reboot();
            });
        });
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

                resolve();
            });
        });
    }
}
