const Path = require("path");
const File = require("fs-extra");
const Reader = require("readline");

module.exports = () => {
    return new Promise(async (resolve) => {
        const incompatable = [
            "homebridge",
            "homebridge-server",
            "homebridge-to-hoobs",
            "homebridge-config-ui",
            "homebridge-config-ui-x",
            "homebridge-config-ui-rdp",
            "homebridge-config-ui-hoobs"
        ];

        let root = "/root/";

        if (!File.existsSync(root)) {
            root = "/var/root/";
        }

        const application = Path.dirname(File.realpathSync(Path.join(__filename, "../")));
        const modules = Path.dirname(File.realpathSync(Path.join(__filename, "../../../")));
        const svc = await readLines("/etc/systemd/system/homebridge.service");
        const env = (svc.filter(v => v.trim().startsWith("EnvironmentFile"))[0] || "").replace(/environmentfile/i, "").replace(/=/i, "").trim();
        const user = (svc.filter(v => v.trim().startsWith("User"))[0] || "root").replace(/user/i, "").replace(/=/i, "").trim();
        const args = ((await readLines(env)).filter(v => v.trim().startsWith("HOMEBRIDGE_OPTS"))[0] || "").replace(/homebridge_opts/i, "").replace(/=/i, "").trim().split(" ");

        let storage = "";

        for (let i = 0; i < args.length; i++) {
            if (args[i] === "-U") {
                storage = "#storage_path#";
            } else if (storage === "#storage_path#") {
                storage = args[i];
            }
        }

        if (storage === "" || storage === "#storage_path#") {
            storage = user === "root" ? Path.join(root, ".homebridge") : `/home/${user}/.homebridge`
        }

        const plgns = [];

        if (File.existsSync(storage)) {
            const entries = File.readdirSync(modules).filter(f => File.lstatSync(Path.join(modules, f)).isDirectory());

            for (let i = 0; i < entries.length; i++) {
                const directory = Path.join(modules, entries[i]);
                const filename = Path.join(directory, "/package.json");

                if (File.existsSync(filename)) {
                    const item = JSON.parse(File.readFileSync(filename));

                    if (Array.isArray(item.keywords) && item.keywords.indexOf("homebridge-plugin") >= 0 && incompatable.indexOf(item.name) === -1) {
                        const details = getPluginDetails(storage, directory, item.name);

                        plgns.push({
                            name: item.name,
                            version: item.version,
                            details
                        });
                    }
                }
            }
        }

        resolve({
            application,
            arguments: args,
            modules,
            defaults: env,
            user,
            storage,
            plugins: plgns,
            incompatable
        });
    });
};

const readLines = function (filename) {
    return new Promise((resolve) => {
        const results = [];

        if (filename && filename !== "" && File.existsSync(filename)) {
            const reader = Reader.createInterface({
                input: File.createReadStream(filename),
                crlfDelay: Infinity
            });

            reader.on("line", (line) => {
                results.push(line);
            });

            reader.on("close", () => {
                resolve(results);
            });
        } else {
            resolve(results);
        }
    });
};

const getPluginDetails = function (storage, directory, name) {
    const registered = [];

    if (File.existsSync(Path.join(directory, "platform.schema.json"))) {
        let schema = {};

        try {
            schema = JSON.parse(File.readFileSync(Path.join(directory, "platform.schema.json")));
        } catch {
            schema = {};
        }

        const alias = schema.plugin_alias || schema.pluginAlias || name;
        const idx = registered.findIndex(p => p.alias === alias && p.type === "platform");

        if (idx === -1) {
            registered.push({
                type: "platform",
                alias: alias
            });
        }
    } else if (File.existsSync(Path.join(directory, "accessories.schema.json"))) {
        let schema = {};

        try {
            schema = JSON.parse(File.readFileSync(Path.join(directory, "accessories.schema.json")));
        } catch {
            schema = {};
        }

        const alias = schema.plugin_alias || schema.pluginAlias || name;
        const idx = registered.findIndex(p => p.alias === alias && p.type === "accessory");

        if (idx === -1) {
            registered.push({
                type: "accessory",
                alias: alias
            });
        }
    } else if (File.existsSync(Path.join(directory, "config.schema.json"))) {
        let schema = {};

        try {
            schema = JSON.parse(File.readFileSync(Path.join(directory, "config.schema.json")));
        } catch {
            schema = {};
        }

        const alias = schema.plugin_alias || schema.pluginAlias || name;

        let type = "platform";

        if (schema.pluginType === "accessory") {
            type = "accessory";
        }

        const idx = registered.findIndex(p => p.alias === alias && p.type === type);

        if (idx === -1) {
            registered.push({
                type: type,
                alias: alias
            });
        }
    } else {
        let pjson = null;

        try {
            pjson = JSON.parse(File.readFileSync(Path.join(directory, "package.json")));
        } catch {
            pjson = {};
        }

        let path = (pjson || {}).main || "" !== "" ? Path.join(name, pjson.main) : name;

        if (path.toLowerCase() === "index.js") {
            path = name;
        }

        if (path.toLowerCase().endsWith("/index.js")) {
            path = path.replace(/\/index.js/gi, "");
        }

        if (path.toLowerCase().endsWith(".js")) {
            path = path.replace(/.js/gi, "");
        }

        try {
            const {
                uuid,
                Bridge,
                Accessory,
                Service,
                Characteristic,
                AccessoryLoader
            } = require("@hoobs/hap");

            const plugin = require(path);

            const options = {
                hap: {
                    uuid,
                    Bridge,
                    Accessory,
                    Service,
                    Characteristic,
                    AccessoryLoader
                },

                platformAccessory: {},
                version: "Loadout Test",

                registerPlatform: (p, a) => {
                    const idx = registered.findIndex(p => p.alias === a && p.type === "platform");

                    if (idx === -1) {
                        registered.push({
                            type: "platform",
                            alias: a
                        });
                    }
                },

                registerAccessory: (p, a) => {
                    const idx = registered.findIndex(p => p.alias === a && p.type === "accessory");

                    if (idx === -1) {
                        registered.push({
                            type: "accessory",
                            alias: a
                        });
                    }
                },

                user: {
                    configPath() {
                        return Path.join(storage, "config.json");
                    },
                    storagePath() {
                        return storage;
                    }
                }
            };

            if (typeof plugin === "function") {
                plugin(options);
            } else if (plugin && typeof plugin.default === "function") {
                plugin.default(options);
            }
        } finally {
            delete require.cache[require.resolve("@hoobs/hap")];
            delete require.cache[require.resolve(path)];
        }

        return registered;
    }
};
