/**************************************************************************************************
 * hoobs-core                                                                                     *
 * Copyright (C) 2020 HOOBS                                                                       *
 *                                                                                                *
 * This program is free software: you can redistribute it and/or modify                           *
 * it under the terms of the GNU General Public License as published by                           *
 * the Free Software Foundation, either version 3 of the License, or                              *
 * (at your option) any later version.                                                            *
 *                                                                                                *
 * This program is distributed in the hope that it will be useful,                                *
 * but WITHOUT ANY WARRANTY; without even the implied warranty of                                 *
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the                                  *
 * GNU General Public License for more details.                                                   *
 *                                                                                                *
 * You should have received a copy of the GNU General Public License                              *
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.                          *
 **************************************************************************************************/

const _ = require("lodash");

const OS = require("os");
const File = require("fs-extra");
const Unzip = require("unzipper");
const Archiver = require("archiver");
const Request = require("axios");

const HBS = require("./instance");
const Cache = require("./cache");

const { dirname, join, basename, extname } = require("path");
const { spawn, fork, execSync } = require("child_process");

module.exports = class Server {
    constructor(options) {
        this.version = HBS.application.version;

        this.arguments = [
            "bridge",
            "-u",
            join(Server.paths.config, HBS.name || ""),
            "-p",
            Server.paths.modules.local
        ].concat(options || []);

        if (HBS.docker) {
            this.arguments.push("-c");
        }

        if (HBS.name && HBS.name !== "") {
            this.arguments.push("-i");
            this.arguments.push(HBS.name);
        }

        this.proc = null;
        this.events = {};
        this.running = false;
        this.time = new Date();
    }

    static get paths() {
        let modules;

        if (HBS.docker) {
            modules = "/usr/src/hoobs/node_modules";
        } else if ((HBS.config || {}).package_manager === "yarn") {
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

        const home = HBS.docker ? "/hoobs" : join(OS.userInfo().homedir, ".hoobs");
        const root = join(dirname(File.realpathSync(__filename)), "../");

        return {
            root,
            application: home,
            config: join(home, "etc"),
            interface: join(root, "interface"),
            backups: join(home, "backups"),
            modules: {
                local: join(home, "node_modules"),
                global: modules
            },
            bridge: join(root, "bin"),
            hap: join(root, "node_modules", "hap-nodejs")
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
        File.ensureDirSync(Server.paths.modules.local);

        if (HBS.name && HBS.name !== "") {
            File.ensureDirSync(join(Server.paths.config, HBS.name || ""));
        }

        if (!HBS.JSON.validateFile(join(Server.paths.config, HBS.name || "", "config.json"))) {
            init = true;

            File.copyFileSync(join(Server.paths.root, "default.json"), join(Server.paths.config, HBS.name || "", "config.json"));
        }

        const current = _.extend({
            server: {},
            client: {},
            bridge: {
                name: "HOOBS",
                pin: "031-45-154",
                port: 51826
            },
            description: "",
            ports: {},
            plugins: [],
            accessories: [],
            platforms: []
        }, HBS.JSON.load(join(Server.paths.config, HBS.name || "", "config.json"), {}));

        if (init) {
            if (HBS.name && HBS.name !== "") {
                const configured = HBS.JSON.load(`/var/hoobs/.instance/${HBS.name.replace(/[^a-zA-Z0-9]/gi, "").toLowerCase()}/config.json`, []);

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
                    `/var/hoobs/.instance/${HBS.name.replace(/[^a-zA-Z0-9]/gi, "").toLowerCase()}`
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
            current.server.port = 80;
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
        if (config) {
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
            if (HBS.docker) {
                return resolve();
            }

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
                HBS.log.info(`${data}`.trimEnd());
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
                        HBS.log.info(line);
                    }
                }
            });

            proc.on("close", () => {
                return resolve();
            });
        });
    }

    static reboot() {
        if (!HBS.docker) {
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
                HBS.log.info(`${data}`.trimEnd());
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
                        HBS.log.info(line);
                    }
                }
            });
        }
    }

    static shutdown() {
        if (!HBS.docker) {
            let prompts = 0;

            const proc = spawn("sudo", [
                "-S",
                "-k",
                "-p",
                "#sudo-hoobs#",
                "shutdown",
                "-h",
                "now"
            ]);

            proc.stdout.on("data", (data) => {
                HBS.log.info(`${data}`.trimEnd());
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
                        HBS.log.info(line);
                    }
                }
            });
        }
    }

    static async reload() {
        File.ensureDirSync(Server.paths.application);
        File.ensureDirSync(Server.paths.backups);

        if (HBS.docker) {
            require("../scripts/docker")(true);
        } else {
            require("../scripts/loader")(true);
        }

        HBS.config = await Server.configure();

        switch ((HBS.config.system || "").toLowerCase()) {
            case "hoobs-box":
                HBS.config.system = "hoobs-box";
                break;

            default:
                HBS.config.system = "hoobs";
                break;
        }

        HBS.user = -1;
        HBS.admin = false;
        HBS.cache = new Cache();
        HBS.users = HBS.JSON.load(join(Server.paths.config, HBS.name || "", "access.json"), []);
        HBS.application = HBS.JSON.load(join(Server.paths.application, "/package.json"));

        if (!File.existsSync(join(Server.paths.config, HBS.name || "", "layout.json"))) {
            File.appendFileSync(join(Server.paths.config, HBS.name || "", "layout.json"), HBS.JSON.toString({}));
        }

        HBS.layout = HBS.JSON.load(join(Server.paths.config, HBS.name || "", "layout.json"), {});

        if (Object.keys(HBS.layout).indexOf("rooms") >= 0 && Object.keys(HBS.layout).indexOf("hidden") >= 0) {
            const current = HBS.JSON.clone(HBS.layout);

            HBS.layout = {};

            for (let i = 0; i < HBS.users.length; i++) {
                HBS.layout[HBS.users[i].username] = HBS.JSON.clone(current);
            }

            File.unlinkSync(join(Server.paths.config, HBS.name || "", "layout.json"));
            File.appendFileSync(join(Server.paths.config, HBS.name || "", "layout.json"), HBS.JSON.toString(HBS.layout));
        }
    }

    static reset() {
        HBS.server.stop().then(async () => {
            const config = HBS.JSON.load(join(Server.paths.config, HBS.name || "", "config.json"), {});
            const port = (config.server || {}).port || 80;

            if (File.existsSync(join(Server.paths.config))) {
                File.removeSync(join(Server.paths.config));
            }

            if (File.existsSync(join(Server.paths.modules.local))) {
                File.removeSync(join(Server.paths.modules.local));
            }

            if (File.existsSync(join(Server.paths.application, "package-lock.json"))) {
                File.unlinkSync(join(Server.paths.application, "package-lock.json"));
            }

            if (File.existsSync(join(Server.paths.application, "yarn.lock"))) {
                File.unlinkSync(join(Server.paths.application, "yarn.lock"));
            }

            if (File.existsSync(join(Server.paths.backups))) {
                File.removeSync(join(Server.paths.backups));
            }

            if (File.existsSync(join(Server.paths.application, "dist"))) {
                File.removeSync(join(Server.paths.application, "dist"));
            }

            if (File.existsSync(join(Server.paths.application, "lib"))) {
                File.removeSync(join(Server.paths.application, "lib"));
            }

            const factory = HBS.JSON.load(join(Server.paths.root, "default.json"), {});

            factory.server.port = port;
            factory.bridge.username = Server.generateUsername();

            File.ensureDirSync(Server.paths.config);
            File.appendFileSync(join(Server.paths.config, "config.json"), HBS.JSON.toString(factory));

            await Server.reload();

            HBS.server.restart().then(() => {
                HBS.log.command("unlock");
                HBS.log.command("refresh");
            });
        });
    }

    static backup() {
        File.ensureDirSync(Server.paths.backups);

        if (File.existsSync(join(Server.paths.modules.local, "hap-nodejs"))) {
            try {
                File.unlinkSync(join(Server.paths.modules.local, "hap-nodejs"));
            } catch (_error) {
                File.removeSync(join(Server.paths.modules.local, "hap-nodejs"));
            }
        }

        const filename = `backup-${new Date().getTime()}`;
        const output = File.createWriteStream(join(Server.paths.backups, `${filename}.zip`));
        const archive = Archiver("zip");

        output.on("close", () => {
            File.ensureSymlinkSync(Server.paths.hap, join(Server.paths.modules.local, "hap-nodejs"));
            File.renameSync(join(Server.paths.backups, `${filename}.zip`), join(Server.paths.backups, `${filename}.hbfx`));

            HBS.log.push.info("System Backup", "Backup Complete");

            HBS.log.command("download", {
                filename: `/backups/${filename}.hbfx`
            });

            HBS.log.command("unlock");
        });

        archive.on("error", (_error) => {
            HBS.log.push.error("System Backup", error.message || "Unable to create backup");
            HBS.log.command("unlock");
        });

        archive.pipe(output);

        archive.directory(Server.paths.config, basename(Server.paths.config));
        archive.directory(Server.paths.modules.local, basename(Server.paths.modules.local));

        archive.file(join(Server.paths.application, "package.json"), {
            name: "package.json"
        });

        archive.finalize();
    }

    static checkRestore(file) {
        const filename = `restore-${new Date().getTime()}.zip`;

        File.ensureDirSync(Server.paths.application);
        File.ensureDirSync(Server.paths.backups);

        HBS.log.info("[Restore System] Validating Recovery File.");

        if (extname(file.name) === ".hbfx" && File.existsSync(file.path)) {
            File.moveSync(file.path, join(Server.paths.backups, filename));

            return join(Server.paths.backups, filename);
        }

        if (extname(file.name) === ".hbf" && File.existsSync(file.path)) {
            try {
                const stream = File.createWriteStream(join(Server.paths.backups, filename));

                stream.write(Buffer.from(File.readFileSync(file.path, "utf8"), "base64"));
                stream.end();

                File.unlinkSync(file.path);

                return join(Server.paths.backups, filename);
            } catch (_error) {
                return null;
            }
        }

        return null;
    }

    static restore(file) {
        HBS.log.info("[Restore System] Restore started.");

        const filename = Server.checkRestore(file);

        if (filename) {
            HBS.server.stop().then(() => {
                HBS.log.info("[Restore System] Removing Current Plugins.");

                if (File.existsSync(join(Server.paths.config))) {
                    File.removeSync(join(Server.paths.config));
                }

                if (File.existsSync(join(Server.paths.modules.local))) {
                    File.removeSync(join(Server.paths.modules.local));
                }

                if (File.existsSync(join(Server.paths.application, "package-lock.json"))) {
                    File.unlinkSync(join(Server.paths.application, "package-lock.json"));
                }

                if (File.existsSync(join(Server.paths.application, "yarn.lock"))) {
                    File.unlinkSync(join(Server.paths.application, "yarn.lock"));
                }

                HBS.log.info(`[Restore System] Restore file "${filename}".`);
                HBS.log.info("[Restore System] Unpacking Recovery File.");

                File.createReadStream(filename).pipe(Unzip.Extract({
                    path: Server.paths.application
                })).on("finish", async () => {
                    if (File.existsSync(join(Server.paths.modules.local, ".bin"))) {
                        File.removeSync(join(Server.paths.modules.local, ".bin"));
                    }

                    execSync("npm install --unsafe-perm --prefer-offline --no-audit --progress=true", {
                        cwd: Server.paths.application,
                        stdio: ["inherit", "inherit", "inherit"]
                    });

                    await Server.reload();

                    HBS.server.restart().then(() => {
                        HBS.log.command("unlock");
                        HBS.log.command("refresh");
                    });
                });
            });
        } else {
            HBS.log.info("[Restore System] Restore failed");
            HBS.log.push.error("System Restore", "Restore failed");
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

            case "update":
                this.events.update = callback;
                break;
        }
    }

    start() {
        return new Promise((resolve) => {
            if (!this.running) {
                File.ensureSymlinkSync(Server.paths.hap, join(Server.paths.modules.local, "hap-nodejs"));

                HBS.cache.remove("hap/accessories");
                HBS.log.debug(`${join(Server.paths.bridge, "hoobs")} ${(this.arguments || []).join(" ")}`);

                this.proc = fork(join(Server.paths.bridge, "hoobs"), this.arguments, {
                    cwd: Server.paths.application,
                    silent: true
                });

                this.proc.on("message", (response) => {
                    switch (response.event) {
                        case "running":
                            this.running = true;
                            this.time = new Date();

                            HBS.log.debug(`Bridge started: ${this.time}`);
                            HBS.log.push.info("Bridge", "Bridge service started");

                            if (this.events.start) {
                                this.events.start();
                            }

                            resolve();
                            break;

                        case "error_log":
                            HBS.log.error(response.data);
                            break;

                        case "info_log":
                            HBS.log.info(response.data);
                            break;

                        case "debug_log":
                            HBS.log.debug(response.data);
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
                            HBS.log.debug(response.event);

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
                            HBS.log.info(line);
                        }
                    }
                });

                this.proc.stderr.on("data", (data) => {
                    const lines = `${data}`.split(/\r?\n/);

                    for (let i = 0; i < lines.length; i++) {
                        const line = lines[i].trim();

                        if (line !== "") {
                            HBS.log.error(line);

                            if (this.stderr) {
                                this.stderr(line);
                            }
                        }
                    }
                });

                this.proc.on("exit", (data) => {
                    this.running = false;
                    this.time = new Date();

                    HBS.log.push.error("Bridge", "Bridge service stopped");

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
                if (File.existsSync(join(Server.paths.modules.local, "hap-nodejs"))) {
                    try {
                        File.unlinkSync(join(Server.paths.modules.local, "hap-nodejs"));
                    } catch (_error) {
                        File.removeSync(join(Server.paths.modules.local, "hap-nodejs"));
                    }
                }

                this.proc.on("exit", () => {
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
                File.removeSync(join(Server.paths.config, HBS.name || "", "persist"));
                File.removeSync(join(Server.paths.config, HBS.name || "", "accessories"));

                HBS.config = await Server.configure();

                resolve();
            });
        });
    }
}
