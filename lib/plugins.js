const File = require("fs-extra");
const Request = require("request");

const HBS = require("./instance");
const Server = require("./server");

const { join } = require("path");
const { spawn, execSync } = require("child_process");

module.exports = class Plugins {
    static list() {
        const results = {};
        const modules = [];

        const plugins = HBS.config.plugins || [];
        const dependencies = Object.keys(HBS.application.dependencies);

        for (let i = 0; i < plugins.length; i++) {
            let plugin = null;

            if (dependencies.indexOf(plugins[i]) >= 0) {
                plugin = plugins[i];
            } else {
                plugin = (dependencies.filter(d => d.startsWith("@") && d.endsWith(`/${plugins[i]}`)) || [null])[0];
            }

            if (plugin && dependencies.indexOf(plugin) >= 0) {
                modules.push(plugin);
            }
        }

        modules.sort();

        for (let i = 0; i < modules.length; i++) {
            const directory = join(Server.paths.modules.local, modules[i]);
            const filename = join(directory, "/package.json");

            HBS.log.debug(directory);

            if (File.existsSync(filename)) {
                const item = HBS.JSON.load(filename, {});

                const schema = {
                    platform: {},
                    accessories: {}
                };

                let data;

                if (File.existsSync(join(directory, "/platform.schema.json"))) {
                    schema.platform = HBS.JSON.load(join(directory, "/platform.schema.json"), {});
                } else if (File.existsSync(join(directory, "/config.schema.json"))) {
                    data = HBS.JSON.load(join(directory, "/config.schema.json"), {});

                    if (data.pluginType === "platform") {
                        let value = HBS.JSON.clone(data);

                        if (data.schema && !data.schema.properties) {
                            value = {
                                plugin_alias: data.plugin_alias || data.pluginAlias,
                                schema: {
                                    type: "object",
                                    properties: HBS.JSON.clone(data).schema
                                }
                            };
                        }

                        schema.platform = value;
                    } else if (data.pluginType === "accessory") {
                        schema.accessories = {
                            plugin_alias: data.pluginAlias,
                            schemas: [HBS.JSON.clone(data).schema]
                        };
                    }
                }

                if (File.existsSync(join(directory, "/accessories.schema.json"))) {
                    schema.accessories = HBS.JSON.load(join(directory, "/accessories.schema.json"), {});
                }

                if (Array.isArray(item.keywords) && (item.keywords.indexOf("hoobs-plugin") >= 0 || item.keywords.indexOf("homebridge-plugin") >= 0 || item.keywords.indexOf("hoobs-interface") >= 0)) {
                    const id = (item.name || "").split("/");

                    results[item.name] = {
                        name: id.length === 2 ? id[1] : item.name,
                        scope: id.length === 2 ? id[0].replace(/@/gi, "") : null,
                        version: item.version,
                        directory: directory,
                        description: (item.description || "").replace(/(?:https?|ftp):\/\/[\n\S]+/g, "").trim(),
                        keywords: item.keywords || [],
                        schema: {
                            platform: {
                                plugin_alias: schema.platform.plugin_alias || schema.platform.pluginAlias,
                                schema: schema.platform.schema || {}
                            },
                            accessories: {
                                plugin_alias: schema.accessories.plugin_alias || schema.accessories.pluginAlias,
                                schemas: schema.accessories.schemas || []
                            }
                        }
                    };
                }
            }
        }

        return results;
    }

    static installed() {
        const queue = [];

        return new Promise((resolve) => {
            const certified = [];
            const results = [];
            const local = [];
            const installed = Plugins.list();
            const keys = Object.keys(installed);

            for (let i = 0; i < keys.length; i++) {
                const { ...item } = installed[keys[i]];

                queue.push(true);

                Plugins.package(item.scope ? `@${item.scope}/${item.name}` : item.name, item.version).then((response) => {
                    if (item.name !== "homebridge") {
                        if (response.scope === "hoobs") {
                            certified.push({
                                name: response.name,
                                scope: response.scope,
                                details: Plugins.getPluginType(response.scope && response.scope !== "" ? `@${response.scope}/${response.name}` : response.name),
                                local: false,
                                version: response.version,
                                installed: response.installed,
                                date: response.date,
                                description: response.description,
                                keywords: response.keywords || [],
                                links: response.links,
                                schema: item.schema
                            });
                        } else {
                            results.push({
                                name: response.name,
                                scope: response.scope,
                                details: Plugins.getPluginType(response.scope && response.scope !== "" ? `@${response.scope}/${response.name}` : response.name),
                                local: false,
                                version: response.version,
                                installed: response.installed,
                                date: response.date,
                                description: response.description,
                                keywords: response.keywords || [],
                                links: response.links,
                                schema: item.schema
                            });
                        }
                    }
                }).catch((error) => {
                    HBS.log.debug(error.message);
                    HBS.log.debug(error.stack);

                    local.push({
                        name: item.name,
                        scope: item.scope,
                        details: Plugins.getPluginType(response.scope && response.scope !== "" ? `@${response.scope}/${response.name}` : response.name),
                        local: true,
                        version: item.version,
                        installed: item.version,
                        date: new Date(),
                        description: (item.description || "").replace(/(?:https?|ftp):\/\/[\n\S]+/g, "").trim(),
                        keywords: item.keywords || [],
                        links: {
                            directory: item.directory
                        },
                        schema: item.schema
                    });
                }).finally(() => {
                    queue.pop();

                    if (queue.length === 0) {
                        resolve(certified.concat(results).concat(local));
                    }
                });
            }

            if (queue.length === 0) {
                resolve(certified.concat(results).concat(local));
            }
        });
    }

    static package(name, version) {
        return new Promise((resolve, reject) => {
            const key = `package/${name}${version ? `@${version}` : ""}`;
            const cached = HBS.cache.get(key);

            if (cached) {
                HBS.log.debug(`[Cache Hit] ${key}`);

                resolve(cached);
            } else {
                Request({
                    url: `https://registry.npmjs.org/${encodeURIComponent(name)}`,
                    json: true
                }, (error, response, body) => {
                    if (!error && body) {
                        const { ...item } = body;
                        const id = (item.name || "").split("/");

                        const results = {
                            name: id.length === 2 ? id[1] : item.name,
                            scope: id.length === 2 ? id[0].replace(/@/gi, "") : null,
                            local: false,
                            version: (item["dist-tags"] || {}).latest,
                            installed: version || false,
                            date: (item.time || {}).modified,
                            author: (item.author || {}).name,
                            description: (item.description || "").replace(/(?:https?|ftp):\/\/[\n\S]+/g, "").trim(),
                            homepage: item.homepage,
                            keywords: item.keywords,
                            license: item.license,
                            readme: item.readme
                        };

                        HBS.cache.set(key, results, 60 * 3);

                        resolve(results);
                    } else {
                        reject(error);
                    }
                });
            }
        });
    }

    static categories() {
        return new Promise((resolve, reject) => {
            const key = "certified/categories";
            const cached = HBS.cache.get(key);

            if (cached) {
                HBS.log.debug(`[Cache Hit] ${key}`);

                resolve(cached);
            } else {
                Request({
                    url: `https://raw.githubusercontent.com/hoobs-org/HOOBS/master/certified/categories.json`,
                    json: true
                }, (error, response, body) => {
                    if (!error) {
                        body.sort();
    
                        HBS.cache.set(key, body, 60 * 3);
    
                        resolve(body);
                    } else {
                        reject(error);
                    }
                });
            }
        });
    }

    static lookup() {
        return new Promise((resolve, reject) => {
            const key = "certified/plugins";
            const cached = HBS.cache.get(key);

            if (cached) {
                HBS.log.debug(`[Cache Hit] ${key}`);

                resolve(cached);
            } else {
                Request({
                    url: `https://raw.githubusercontent.com/hoobs-org/HOOBS/master/certified/plugins.json`,
                    json: true
                }, (error, response, body) => {
                    if (!error) {
                        HBS.cache.set(key, body, 60 * 3);
    
                        resolve(body);
                    } else {
                        reject(error);
                    }
                });
            }
        });
    }

    static certified(category) {
        return new Promise((resolve, reject) => {
            if (category && category !== "") {
                const key = `certified/${category}`;
                const installed = Plugins.list();
                const cached = HBS.cache.get(key);

                const processObjects = function (objects) {
                    const results = [];

                    for (let i = 0; i < objects.length; i++) {
                        const { ...item } = objects[i].package;
                        const id = (item.name || "").split("/");
                        const repository = ((item.links || {}).repository || "").replace("https://github.com/", "https://raw.githubusercontent.com/");

                        results.push({
                            name: id.length === 2 ? id[1] : item.name,
                            scope: item.scope === "unscoped" ? null : item.scope,
                            version: item.version,
                            installed: installed[item.name] ? installed[item.name].version : false,
                            date: item.date,
                            description: (item.description || "").replace(/(?:https?|ftp):\/\/[\n\S]+/g, "").trim(),
                            homepage: item.homepage,
                            image: repository && repository !== "" ? `${repository}/master/branding/product.png` : null,
                            keywords: item.keywords
                        });
                    }

                    return results;
                }

                if (cached) {
                    HBS.log.debug(`[Cache Hit] ${key}`);

                    resolve(processObjects(cached));
                } else {
                    Request({
                        url: `https://registry.npmjs.org/-/v1/search?text=@hoobs+keywords:hoobs-certified+${category}`,
                        json: true
                    }, (error, response, body) => {
                        body.objects = body.objects || [];

                        if (!error) {
                            if (body.objects.length > 0) {
                                HBS.cache.set(key, body.objects, 60 * 3);
                            }

                            resolve(processObjects(body.objects));
                        } else {
                            reject(error);
                        }
                    });
                }
            } else {
                resolve([]);
            }
        });
    }

    static search(search, keyword, limit) {
        return new Promise(async (resolve, reject) => {
            if (search && search !== "") {
                const installed = Plugins.list();
                const blocked = await Plugins.blocked();

                search = (search || "").split("/")
                search = encodeURIComponent(search[search.length - 1]);

                Request({
                    url: `https://registry.npmjs.org/-/v1/search?text=${search}+keywords:${keyword}&size=${limit}`,
                    json: true
                }, (error, response, body) => {
                    const certified = [];
                    const results = [];

                    body.objects = body.objects || [];

                    if (!error) {
                        for (let i = 0; i < body.objects.length; i++) {
                            const { ...item } = body.objects[i].package;

                            if (blocked.indexOf(item.name || "") === -1) {
                                const id = (item.name || "").split("/");

                                if (item.scope === "hoobs") {
                                    certified.push({
                                        name: id.length === 2 ? id[1] : item.name,
                                        scope: item.scope === "unscoped" ? null : item.scope,
                                        version: item.version,
                                        installed: installed[item.name] ? installed[item.name].version : false,
                                        date: item.date,
                                        description: (item.description || "").replace(/(?:https?|ftp):\/\/[\n\S]+/g, "").trim(),
                                        homepage: item.homepage,
                                        keywords: item.keywords
                                    });
                                } else {
                                    results.push({
                                        name: id.length === 2 ? id[1] : item.name,
                                        scope: item.scope === "unscoped" ? null : item.scope,
                                        version: item.version,
                                        installed: installed[item.name] ? installed[item.name].version : false,
                                        date: item.date,
                                        description: (item.description || "").replace(/(?:https?|ftp):\/\/[\n\S]+/g, "").trim(),
                                        homepage: item.homepage,
                                        keywords: item.keywords
                                    });
                                }
                            }
                        }

                        resolve(certified.concat(results));
                    } else {
                        reject(error);
                    }
                });
            } else {
                resolve([]);
            }
        });
    }

    static getPluginType(name) {
        HBS.log.debug(`[Get Plugin Type] Plugin Name: ${name}`);

        if (HBS.plugins[name] && Array.isArray(HBS.plugins[name]) && HBS.plugins[name].length > 0) {
            HBS.log.debug("[Get Plugin Type] Fetching from cache");

            return HBS.plugins[name];
        }

        const registered = [];
        const ppath = join(Server.paths.modules.local, name);

        if (File.existsSync(join(ppath, "platform.schema.json"))) {
            const schema = HBS.JSON.load(join(ppath, "platform.schema.json"), {});

            HBS.log.debug("[Get Plugin Type] Fetching from platform.schema.json");

            const alias = schema.plugin_alias || schema.pluginAlias || name;
            const idx = registered.findIndex(p => p.alias === alias && p.type === "platform");

            if (idx === -1) {
                registered.push({
                    alias,
                    type: "platform",
                    path: name
                });
            }
        } else if (File.existsSync(join(ppath, "accessories.schema.json"))) {
            const schema = HBS.JSON.load(join(ppath, "accessories.schema.json"), {});

            HBS.log.debug("[Get Plugin Type] Fetching from accessories.schema.json");

            const alias = schema.plugin_alias || schema.pluginAlias || name;
            const idx = registered.findIndex(p => p.alias === alias && p.type === "accessory");

            if (idx === -1) {
                registered.push({
                    alias,
                    type: "accessory",
                    path: name
                });
            }
        } else if (File.existsSync(join(ppath, "config.schema.json"))) {
            const schema = HBS.JSON.load(join(ppath, "config.schema.json"), {});

            HBS.log.debug("[Get Plugin Type] Fetching from config.schema.json");

            const alias = schema.plugin_alias || schema.pluginAlias || name;

            let type = "platform";

            if (schema.pluginType === "accessory") {
                type = "accessory";
            }

            const idx = registered.findIndex(p => p.alias === alias && p.type === type);

            if (idx === -1) {
                registered.push({
                    alias,
                    type,
                    path: name
                });
            }
        } else {
            let pjson = HBS.JSON.load(join(ppath, "package.json"), {});
            let rpath = (pjson || {}).main || "" !== "" ? join(name, pjson.main) : name;

            if (rpath.toLowerCase() === "index.js") {
                rpath = name;
            }

            if (rpath.toLowerCase().endsWith("/index.js")) {
                rpath = rpath.replace(/\/index.js/gi, "");
            }

            if (rpath.toLowerCase().endsWith(".js")) {
                rpath = rpath.replace(/.js/gi, "");
            }

            HBS.log.debug("[Get Plugin Type] Fetching from plugin loadout");
            HBS.log.debug(`[Get Plugin Type] Plugin Require: ${rpath}`);

            try {
                const {
                    uuid,
                    Bridge,
                    Accessory,
                    Service,
                    Characteristic,
                    AccessoryLoader
                } = require("@hoobs/hap");
    
                const plugin = require(rpath);
    
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
                                alias: a,
                                type: "platform",
                                path: name
                            });
                        }
                    },
    
                    registerAccessory: (p, a) => {
                        const idx = registered.findIndex(p => p.alias === a && p.type === "accessory");
    
                        if (idx === -1) {
                            registered.push({
                                alias: a,
                                type: "accessory",
                                path: name
                            });
                        }
                    },
    
                    user: {
                        configPath() {
                            return join(Server.paths.config, "config.json");
                        },
                        storagePath() {
                            return Server.paths.config;
                        }
                    }
                };
    
                if (typeof plugin === "function") {
                    plugin(options);
                } else if (plugin && typeof plugin.default === "function") {
                    plugin.default(options);
                } else {
                    HBS.log.info(`Plugin "${name}" does not export a initializer function from main.`);
                }
            } catch (error) {
                HBS.log.info(error.message);
                HBS.log.debug(error.stack);
    
                HBS.log.info(`Unable to determine plugin type for "${name}"`);
            }
    
            delete require.cache[require.resolve("@hoobs/hap")];
            delete require.cache[require.resolve(rpath)];
        }

        if (registered.length > 0) {
            HBS.plugins[name] = registered;
        }

        return registered;
    }

    static getPlatform(id, name, data) {
        if (!data.platforms) {
            data.platforms = [];
        }

        if (data.platforms.findIndex(p => (p.plugin_map || {}).plugin_name === name) >= 0) {
            return null;
        }

        let found = false;
        let alias = "";

        const details = Plugins.getPluginType(id) || [];

        for (let i = 0; i < details.length; i++) {
            if (details[i].type === "platform") {
                const index = data.platforms.findIndex(p => p.platform === details[i].alias);

                if (index >= 0) {
                    data.platforms[index].plugin_map = {
                        plugin_name: name
                    };

                    found = true;
                } else if (alias === "") {
                    alias = details[i].alias;
                }
            }
        }

        if (!found && alias !== "") {
            data.platforms.push({
                platform: alias,
                plugin_map: {
                    plugin_name: name
                }
            });
        }

        return data;
    }

    static blocked() {
        return new Promise((resolve) => {
            let blocked = [
                "hoobs-core",
                "homebridge",
                "homebridge-server",
                "homebridge-to-hoobs",
                "homebridge-config-ui",
                "homebridge-config-ui-x",
                "homebridge-config-ui-rdp",
                "homebridge-config-ui-hoobs"
            ];

            Plugins.lookup().then((data) => {
                blocked = blocked.concat(Object.keys(data.lookup))
            }).finally(() => {
                resolve(blocked);
            });
        });
    }

    static install(id, tag) {
        tag = tag || "latest";

        return new Promise(async (resolve, reject) => {
            const blocked = await Plugins.blocked();

            if (blocked.indexOf(id) >= 0) {
                HBS.log.error(`[plugin] '${id}' is a blocked plugin.`);

                return resolve(false);
            }

            let proc;

            if (HBS.config.package_manager === "yarn") {
                proc = spawn("yarn", [
                    "add",
                    "--unsafe-perm",
                    "--ignore-engines",
                    `${id}@${tag}`
                ], {
                    cwd: Server.paths.application
                });
            } else {
                proc = spawn("npm", [
                    "install",
                    "--unsafe-perm",
                    `${id}@${tag}`
                ], {
                    cwd: Server.paths.application
                });
            }

            proc.stdout.on("data", (data) => {
                HBS.log.info(`${data}`.trimEnd());
            });
              
            proc.stderr.on("data", (data) => {
                HBS.log.error(`${data}`.trimEnd());
            });
              
            proc.on("close", async () => {
                if (File.existsSync(join(Server.paths.modules.local, id, "package.json"))) {
                    const item = HBS.JSON.load(join(Server.paths.modules.local, id, "package.json"), {});
                    const parts = id.split("/");
                    const name = parts[parts.length - 1];

                    let data = HBS.JSON.load(join(Server.paths.config, HBS.name || "", "config.json"), {});

                    if (item.keywords) {
                        if (!data.plugins) {
                            data.plugins = [];
                        }

                        if ((item.keywords.indexOf("hoobs-plugin") >= 0 || item.keywords.indexOf("homebridge-plugin") >= 0) && data.plugins.indexOf(name) === -1) {
                            data.plugins.push(name);
                        }

                        if (id.startsWith("@hoobs/")) {
                            const lookup = (await Plugins.lookup()).certified;

                            if (lookup[id]) {
                                const index = data.plugins.indexOf(lookup[id]);

                                if (index > -1) {
                                    data.plugins.splice(index, 1);
                                }

                                if (HBS.config.package_manager === "yarn") {
                                    execSync(`yarn remove ${lookup[id]}`, {
                                        cwd: Server.paths.application
                                    });
                                } else {
                                    execSync(`npm uninstall ${lookup[id]}`, {
                                        cwd: Server.paths.application
                                    });
                                }
                            }
                        }

                        data = Plugins.getPlatform(id, name, data);
                    }

                    Server.saveConfig(data);

                    HBS.config = await Server.configure();
                    HBS.application = HBS.JSON.load(join(Server.paths.application, "/package.json"));

                    return resolve();
                } else {
                    return reject();
                }
            });
        });
    }

    static uninstall(id) {
        return new Promise((resolve, reject) => {
            let proc;

            if (HBS.config.package_manager === "yarn") {
                proc = spawn("yarn", [
                    "remove",
                    id
                ], {
                    cwd: Server.paths.application
                });
            } else {
                proc = spawn("npm", [
                    "uninstall",
                    id
                ], {
                    cwd: Server.paths.application
                });
            }

            proc.stdout.on("data", (data) => {
                HBS.log.info(`${data}`.trimEnd());
            });
              
            proc.stderr.on("data", (data) => {
                HBS.log.error(`${data}`.trimEnd());
            });
              
            proc.on("close", async () => {
                if (!File.existsSync(join(Server.paths.modules.local, id, "package.json"))) {
                    const parts = id.split("/");
                    const name = parts[parts.length - 1];
                    const data = HBS.JSON.load(join(Server.paths.config, HBS.name || "", "config.json"), {});

                    if (!data.plugins) {
                        data.plugins = [];
                    }

                    let index = data.plugins.indexOf(name);

                    if (index > -1) {
                        data.plugins.splice(index, 1);
                    }

                    if (!data.platforms) {
                        data.platforms = [];
                    }

                    index = data.platforms.findIndex(p => (p.plugin_map || {}).plugin_name === name);

                    while (index >= 0) {
                        data.platforms.splice(index, 1);
                        index = data.platforms.findIndex(p => (p.plugin_map || {}).plugin_name === name);
                    }

                    if (!data.accessories) {
                        data.accessories = [];
                    }

                    index = data.accessories.findIndex(a => (a.plugin_map || {}).plugin_name === name);

                    while (index >= 0) {
                        data.accessories.splice(index, 1);
                        index = data.accessories.findIndex(a => (a.plugin_map || {}).plugin_name === name);
                    }

                    Server.saveConfig(data);

                    HBS.config = await Server.configure();
                    HBS.application = HBS.JSON.load(join(Server.paths.application, "/package.json"));

                    return resolve();
                } else {
                    return reject();
                }
            });
        });
    }

    static update(id, tag) {
        tag = tag || "latest";

        return new Promise((resolve) => {
            let proc;

            if (HBS.config.package_manager === "yarn") {
                proc = spawn("yarn", [
                    "upgrade",
                    "--ignore-engines",
                    `${id}@${tag}`
                ], {
                    cwd: Server.paths.application
                });
            } else {
                proc = spawn("npm", [
                    "install",
                    "--unsafe-perm",
                    `${id}@${tag}`
                ], {
                    cwd: Server.paths.application
                });
            }

            proc.stdout.on("data", (data) => {
                HBS.log.info(`${data}`.trimEnd());
            });
              
            proc.stderr.on("data", (data) => {
                HBS.log.error(`${data}`.trimEnd());
            });
              
            proc.on("close", () => {
                resolve();
            });
        });
    }

    static readChangelog() {
        return new Promise((resolve) => {
            const key = "hoobs/changelog";
            const cached = HBS.cache.get(key);

            if (cached) {
                HBS.log.debug(`[Cache Hit] ${key}`);

                resolve(cached);
            } else {
                const results = {};

                Request({
                    url: `https://raw.githubusercontent.com/hoobs-org/hoobs-core/master/CHANGELOG.md`,
                    json: false
                }, (error, response, body) => {
                    if (!error && body) {
                        body = (body || "").split("\n");

                        let current = "";

                        for (let i = 0; i < body.length; i++) {
                            if (body[i].startsWith("##")) {
                                current = body[i].replace("## ", "");

                                if (!results[current]) {
                                    results[current] = "";
                                }
                            } else if (current && current !== "") {
                                if (results[current] !== "") {
                                    results[current] += "\n";
                                }

                                results[current] += body[i];
                            }
                        }
                    }

                    HBS.cache.set(key, results, 60 * 3);

                    resolve(results);
                });
            }
        });
    }

    static releases() {
        return new Promise(async (resolve, reject) => {
            const key = "hoobs/releases";
            const cached = HBS.cache.get(key);

            if (cached) {
                HBS.log.debug(`[Cache Hit] ${key}`);

                resolve(cached);
            } else {
                const changelog = await Plugins.readChangelog();

                Request({
                    url: "https://registry.npmjs.org/%40hoobs%2Fhoobs",
                    json: true
                }, (error, response, body) => {
                    if (!error && body) {
                        const results = [];
                        const versions = Object.keys(body.versions);

                        versions.sort((a, b) => Plugins.checkVersion(a, b) ? 1 : -1);

                        for (let i = 0; i < Math.min(versions.length, 5); i++) {
                            const { ...item } = body.versions[versions[i]];

                            results.push({
                                version: item.version,
                                name: item.name,
                                description: (item.description || "").replace(/(?:https?|ftp):\/\/[\n\S]+/g, "").trim(),
                                changelog: changelog[item.version]
                            });
                        }

                        HBS.cache.set(key, results, 60 * 3);

                        resolve(results);
                    } else {
                        reject(error);
                    }
                });
            }
        });
    }

    static checkVersion(version, latest) {
        const current = `${version}`.split(/[.-]+/);
        const release = `${latest}`.split(/[.-]+/);

        const length = Math.max(current.length, release.length);

        for (let i = 0; i < length; i++) {
            let a = 0;
            let b = 0;

            if (i < current.length) {
                a = parseInt(current[i], 10);
            }

            if (i < release.length) {
                b = parseInt(release[i], 10);
            }

            if (Number.isNaN(a) || Number.isNaN(b)) {
                a = "A";
                b = "A";

                if (i < current.length) {
                    a = current[i].toUpperCase();
                }
    
                if (i < release.length) {
                    b = release[i].toUpperCase();
                }
            }

            if (a > b) {
                return false;
            }

            if (b > a) {
                return true;
            }
        }

        return false;
    }
}
