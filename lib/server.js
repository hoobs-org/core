const _ = require("lodash");

const OS = require("os");
const File = require("fs-extra");
const Remove = require("rimraf");
const Unzip = require("unzipper");
const Archiver = require("archiver");
const Request = require("axios");

const HBS = require("./instance");

const { dirname, join, basename } = require("path");
const { spawn, fork } = require("child_process");

module.exports = class Server {
    constructor(options) {
        this.version = require(join(Server.paths.homebridge, "/lib/version"));

        this.arguments = [
            "-U",
            join(Server.paths.config, HBS.name || "")
        ].concat(options || []);

        this.proc = null;
        this.events = {};
        this.running = false;
        this.time = new Date();
    }

    static get paths() {
        let modules;

        if ((HBS.config || {}).package_manager === "yarn") {
            modules = "/usr/local/share/.config/yarn/global/node_modules";

            if (!File.existsSync(`${modules}/@hoobs/hoobs`)) {
                modules = "/usr/share/.config/yarn/global/node_modules";
            }
        } else {
            modules = "/usr/local/lib/node_modules";

            if (!File.existsSync(`${modules}/@hoobs/hoobs`)) {
                modules = "/usr/lib/node_modules";
            }
        }

        return {
            application: dirname(File.realpathSync(join(__filename, "../"))),
            config: join(dirname(File.realpathSync(join(__filename, "../"))), "/etc"),
            dist: join(dirname(File.realpathSync(join(__filename, "../"))), "/dist"),
            modules: {
                local: join(dirname(File.realpathSync(join(__filename, "../"))), "/node_modules"),
                global: modules
            },
            homebridge: join(dirname(File.realpathSync(join(__filename, "../"))), "/node_modules/@hoobs/homebridge")
        };
    }

    static hostname() {
        const hostname = (OS.hostname() || "").split(".")[0].toLowerCase();

        return hostnames = [
            "localhost",
            hostname,
            `${hostname}.lan`,
            `${hostname}.local`
        ];
    }

    static interfaces() {
        const addresses = [];
        const ifaces = OS.networkInterfaces();
        const keys = Object.keys(ifaces);

        for (let i = 0; i < keys.length; i++) {
            const iface = ifaces[keys[i]];

            for (let j = 0; j < iface.length; j++) {
                if (!iface[j].internal) {
                    addresses.push(iface[j].address);
                }
            }
        }

        return addresses;
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

        if (!HBS.JSON.validateFile(join(Server.paths.config, HBS.name || "", "config.json"))) {
            init = true;

            File.copyFileSync(join(Server.paths.application, "default.json"), join(Server.paths.config, HBS.name || "", "config.json"));
        }

        const current = _.extend({
            server: {},
            client: {},
            bridge: {},
            description: "",
            ports: {},
            plugins: [],
            accessories: [],
            platforms: []
        }, HBS.JSON.load(join(Server.paths.config, HBS.name || "", "config.json"), {}));

        if (init) {
            if (HBS.name && HBS.name !== "") {
                const configured = HBS.JSON.load("/var/hoobs/.instance/config.json", []);

                current.server.port = configured.port || 52827;
                current.server.client = configured.client || "hoobs.local";
                current.server.origin = "*";
                current.server.credentials = {
                    username: configured.username.toLowerCase(),
                    password: configured.password
                };
                current.bridge.name = `HOOBS [${HBS.name}]`;
                current.bridge.port = configured.bridge || 52826;

                delete current.client;

                let prompts = 0;

                const proc = spawn("sudo", [
                    "-S",
                    "-k",
                    "-p",
                    "#sudo-hoobs#",
                    "rm",
                    "-fR",
                    "/var/hoobs/.instance"
                ]);

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
                        }
                    }
                });
            }

            if (!current.bridge.username || current.bridge.username === "") {
                current.bridge.username = Server.generateUsername();
            }
        }

        if (!current.server.port) {
            current.server.port = 8080;
        }

        if (!current.server.origin) {
            current.server.origin = "*";
        }

        if (current.package_manager && current.package_manager === "yarn") {
            current.package_manager = File.existsSync("/usr/local/bin/yarn") || File.existsSync("/usr/bin/yarn") ? "yarn" : "npm"
        } else {
            current.package_manager = "npm";
        }

        if (HBS.name && HBS.name !== "" && current.server.client) {
            const token = (await Request.post(`${current.server.client}/api/auth`, {
                username: current.server.credentials.username,
                password: current.server.credentials.password
            })).data.token;

            Request.defaults.headers.put["Authorization"] = token;

            await Request.put(`${current.server.client}/api/config/register`, {
                instance: `http://${Server.interfaces()[0]}:${current.server.port}`
            });

            if (File.existsSync(join(Server.paths.config, HBS.name || "", "access.json"))) {
                File.unlinkSync(join(Server.paths.config, HBS.name || "", "access.json"));
            }

            Request.defaults.headers.get["Authorization"] = token;

            const access = (await Request.get(`${current.server.client}/api/auth/sync`)).data;

            File.appendFileSync(join(Server.paths.config, HBS.name || "", "access.json"), HBS.JSON.toString(access));
        }

        Server.saveConfig(current);

        return current;
    }

    static saveConfig(config) {
        const current = HBS.JSON.load(join(Server.paths.config, HBS.name || "", "config.json"), {});

        config.accessories = config.accessories || [];
        config.platforms = config.platforms || [];

        Server.filterConfig(config.accessories);
        Server.filterConfig(config.platforms);

        if (!HBS.JSON.equals(config, current)) {
            File.unlinkSync(join(Server.paths.config, HBS.name || "", "config.json"));
            File.appendFileSync(join(Server.paths.config, HBS.name || "", "config.json"), HBS.JSON.toString(config));
        }
    }

    static filterConfig(value) {
        if (value) {
            const keys = Object.keys(value);

            for (let i = 0; i < keys.length; i++) {
                if (value[keys[i]] === null || value[keys[i]] === "") {
                    delete value[keys[i]];
                } else if (Object.prototype.toString.call(value[keys[i]]) === "[object Object]" && Object.entries(value[keys[i]]).length === 0) {
                    delete value[keys[i]];
                } else if (Object.prototype.toString.call(value[keys[i]]) === "[object Object]") {
                    Server.filterConfig(value[keys[i]]);
                } else if (Array.isArray(value[keys[i]]) && value[keys[i]].length === 0) {
                    delete value[keys[i]];
                } else if (Array.isArray(value[keys[i]])) {
                    Server.filterConfig(value[keys[i]]);
                }
            }
        }
    }

    static update() {
        return new Promise((resolve) => {
            let prompts = 0;
            let proc;

            if (HBS.config.package_manager === "yarn") {
                proc = spawn("sudo", [
                    "-S",
                    "-k",
                    "-p",
                    "#sudo-hoobs#",
                    "yarn",
                    "global",
                    "upgrade",
                    "@hoobs/hoobs"
                ]);
            } else {
                proc = spawn("sudo", [
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
            }

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

            case "update":
                this.events.update = callback;
                break;
        }
    }

    start() {
        return new Promise((resolve) => {
            if (!this.running) {
                HBS.cache.remove("hap/accessories");
                HBS.log.debug(`${join(Server.paths.homebridge, "/bin/homebridge")} ${(this.arguments || []).join(" ")}`);

                this.proc = fork(join(Server.paths.homebridge, "/bin/homebridge"), this.arguments, {
                    cwd: Server.paths.application,
                    silent: true
                });

                this.proc.on("message", (response) => {
                    switch (response.event) {
                        case "running":
                            this.running = true;
                            this.time = new Date();

                            HBS.log.debug(`Homebridge started: ${this.time}`);
                            HBS.log.push.info("Homebridge", "Homebridge service started");

                            if (this.events.start) {
                                this.events.start();
                            }

                            resolve();
                            break;
                        
                        case "error_log":
                            HBS.log.error(`[Homebridge] ${response.data}`);
                            break;

                        case "info_log":
                            HBS.log.info(`[Homebridge] ${response.data}`);
                            break;

                        case "debug_log":
                            HBS.log.debug(`[Homebridge] ${response.data}`);
                            break;

                        case "setup_uri":
                            HBS.log.debug(`Setup URI: ${response.data}`);

                            if (HBS.config.server.home_setup_id !== response.data) {
                                HBS.config.server.home_setup_id = response.data;

                                Server.saveConfig(HBS.config);
                            }

                            break;

                        case "accessory_change":
                            HBS.log.debug("Accessory refresh triggered");

                            if (this.events.update) {
                                this.events.update();
                            }

                            break;

                        default:
                            HBS.log.debug(`[Homebridge] ${response.event}`);

                            if (response.data) {
                                HBS.log.debug(JSON.stringify(response.data, null, 4));
                            }

                            break;
                    }
                });

                this.proc.stdout.on("data", async (data) => {
                    const lines = `${data}`.split(/\r?\n/);

                    for (let i = 0; i < lines.length; i++) {
                        const line = lines[i].trim();

                        if (line !== "") {
                            HBS.log.info(`[Homebridge] ${line}`);
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

                    HBS.log.push.error("Homebridge", "Homebridge service stopped");

                    if (this.events.stop) {
                        this.events.stop();
                    }

                    this.proc.kill("SIGINT");

                    resolve();
                });
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
