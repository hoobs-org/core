const _ = require("lodash");

const OS = require("os");
const File = require("fs-extra");
const Remove = require("rimraf");
const Unzip = require("unzipper");
const Archiver = require("archiver");

const HBS = require("./instance");
const Migrate = require("./migrate");

const { dirname, join, basename } = require("path");
const { spawn } = require("child_process");

module.exports = class Server {
    constructor(options) {
        this.version = require(join(Server.paths.homebridge, "/lib/version"));

        this.arguments = [
            "-S",
            (HBS.config.system || "hoobs").split("-")[0],
            "-U",
            join(Server.paths.config, HBS.name || "")
        ].concat(options || []);

        this.proc = null;
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

        if (HBS.name && HBS.name !== "") {
            File.ensureDirSync(join(Server.paths.config, HBS.name || ""));
        }

        let current = {
            server: {},
            client: {},
            bridge: {},
            description: "",
            ports: {},
            plugins: [],
            accessories: [],
            platforms: []
        };

        if (!File.existsSync(join(Server.paths.config, HBS.name || "", "config.json"))) {
            init = true;

            File.copyFileSync(join(Server.paths.application, "default.json"), join(Server.paths.config, HBS.name || "", "config.json"));

            if (!File.existsSync(join(Server.paths.config, "access.json"))) {
                Migrate.access(Server.paths.config);
            }

            if (!File.existsSync(join(Server.paths.config, "layout.json"))) {
                Migrate.layout(Server.paths.config);
            }

            let contents = {};

            try {
                contents = JSON.parse(File.readFileSync(join(Server.paths.config, HBS.name || "", "config.json")));
            } catch {
                contents = {};
            }

            current = _.extend(current, contents);
            current = _.extend(current, await Migrate.configure(Server.paths.config));

            const plugins = await Migrate.plugins(Server.paths.modules.global, Server.paths.application);

            if (!current.plugins || current.plugins.length === 0) {
                current.plugins = plugins;
            }

            await Migrate.unmanaged(Server.paths.config);
            await Migrate.cleanup(Server.paths.modules.global);
        } else {
            let contents = {};

            try {
                contents = JSON.parse(File.readFileSync(join(Server.paths.config, HBS.name || "", "config.json")));
            } catch {
                contents = {};
            }

            current = _.extend(current, contents);
        }

        if (init) {
            if (HBS.name && HBS.name !== "") {
                current.server.port = 52827;
                current.bridge.name = `HOOBS [${HBS.name}]`;
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

        Server.saveConfig(current);

        return current;
    }

    static saveConfig(config) {
        let current = {};

        try {
            current = JSON.parse(File.readFileSync(join(Server.paths.config, HBS.name || "", "config.json")));
        } catch {
            current = {};
        }

        if (JSON.stringify(config) !== JSON.stringify(current)) {
            File.unlinkSync(join(Server.paths.config, HBS.name || "", "config.json"));
            File.appendFileSync(join(Server.paths.config, HBS.name || "", "config.json"), JSON.stringify(config, null, 4));
        }
    }

    static update() {
        return new Promise((resolve) => {
            let prompts = 0;

            const proc = spawn("sudo", [
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

            proc.stdout.on("data", (data) => {
                console.log(`${data}`.trimEnd());
            });

            proc.stderr.on("data", (data) => {
                const lines = `${data}`.split(/\r?\n/);

                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i].trim();

                    if (line === "#sudo-hoobs#") {
                        if (++prompts > 1) {
                            proc.stdin.write("\n\n\n\n");
                        } else {
                            proc.stdin.write(`${HBS.sudo || ""}\n`);
                        }
                    } else {
                        console.log(line);
                    }
                }
            });

            proc.on("close", () => {
                return resolve();
            });
        });
    }

    static reboot() {
        let prompts = 0;

        const proc = spawn("sudo", [
            "-S",
            "-k",
            "-p",
            "#sudo-hoobs#",
            "shutdown",
            "-r",
            "now"
        ]);

        proc.stdout.on("data", (data) => {
            console.log(`${data}`.trimEnd());
        });

        proc.stderr.on("data", (data) => {
            const lines = `${data}`.split(/\r?\n/);

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();

                if (line === "#sudo-hoobs#") {
                    if (++prompts > 1) {
                        proc.stdin.write("\n\n\n\n");
                    } else {
                        proc.stdin.write(`${HBS.sudo || ""}\n`);
                    }
                } else {
                    console.log(line);
                }
            }
        });
    }

    static reset() {
        HBS.server.stop().then(() => {
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
        HBS.server.stop().then(() => {
            HBS.log.info("[Restore System] Removing Current Plugins.");

            Remove.sync(Server.paths.application);

            const home = OS.userInfo().homedir;
            const root = join(home, ".hoobs");

            if (!File.existsSync(root)) {
                File.mkdirSync(root);
            }

            const filename = `restore-${new Date().getTime()}.zip`;
            const stream = File.createWriteStream(join(root, filename));

            HBS.log.info("[Restore System] Reading Recovery File.");

            stream.write(Buffer.from(File.readFileSync(path, "utf8"), "base64"));
            stream.end();

            File.unlinkSync(path);

            HBS.log.info("[Restore System] Unpacking Recovery File.");

            File.createReadStream(join(root, filename)).pipe(Unzip.Extract({
                path: root
            })).on("finish", () => {
                HBS.log.info("[Restore System] Rebooting");

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
                this.proc = spawn(join(Server.paths.homebridge, "/bin/homebridge"), this.arguments, {
                    cwd: Server.paths.application
                });

                this.proc.stdout.on("data", async (data) => {
                    const lines = `${data}`.split(/\r?\n/);

                    for (let i = 0; i < lines.length; i++) {
                        const line = lines[i].trim();

                        if (line !== "") {
                            HBS.log.info(`[Homebridge] ${line}`);

                            if (this.stdout) {
                                this.stdout(line);
                            }

                            if (line.startsWith("X-HM://")) {
                                if (HBS.config.server.home_setup_id !== line) {
                                    HBS.config.server.home_setup_id = line;

                                    Server.saveConfig(HBS.config);
                                }
                            }

                            if (line.endsWith(`Service is running on port ${HBS.config.bridge.port}.`)) {
                                this.time = new Date();

                                if (this.events.start) {
                                    this.events.start();
                                }

                                resolve();
                            }
                        }
                    }
                });

                this.proc.stderr.on("data", (data) => {
                    const lines = `${data}`.split(/\r?\n/);

                    for (let i = 0; i < lines.length; i++) {
                        const line = lines[i].trim();

                        if (line !== "") {
                            HBS.log.error(`[Homebridge] ${line}`);

                            if (this.stderr) {
                                this.stderr(line);
                            }
                        }
                    }
                });

                this.proc.on("exit", (data) => {
                    this.running = false;
                    this.time = new Date();

                    if (this.events.stop) {
                        this.events.stop();
                    }

                    this.proc.kill("SIGINT");

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
                this.proc.on("exit", (data) => {
                    this.running = false;
                    this.time = new Date();

                    if (this.events.stop) {
                        this.events.stop();
                    }

                    resolve();
                });

                this.proc.kill("SIGINT");
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
                Remove.sync(join(Server.paths.config, HBS.name || "", "persist"));
                Remove.sync(join(Server.paths.config, HBS.name || "", "accessories"));

                HBS.config = await Server.configure();

                resolve();
            });
        });
    }
}
