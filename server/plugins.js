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

const File = require("fs-extra");
const Request = require("axios");

const HBS = require("./instance");
const Server = require("./server");

const { join } = require("path");
const { spawn } = require("child_process");

const blocked = [
    "hoobs-core",
    "homebridge",
    "homebridge-server",
    "homebridge-to-hoobs",
    "homebridge-config-ui",
    "homebridge-config-ui-x",
    "homebridge-config-ui-rdp",
    "homebridge-config-ui-hoobs"
];

module.exports = class Plugins {
    static list() {
        const results = {};
        const modules = [];
        const plugins = HBS.config.plugins || [];

        let dependencies = [];
        
        try {
            dependencies = Object.keys(HBS.JSON.load(join(Server.paths.application, "package.json"), {}).dependencies);
        } catch (_error) {
            dependencies = [];
        }

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
                        library: item.main || "./index.js",
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
            const results = [];
            const installed = Plugins.list();
            const keys = Object.keys(installed);

            for (let i = 0; i < keys.length; i++) {
                const { ...item } = installed[keys[i]];

                queue.push(true);

                Plugins.package(item.scope ? `@${item.scope}/${item.name}` : item.name, item.version).then((response) => {
                    results.push({
                        name: response.name,
                        scope: response.scope,
                        replaces: response.replaces,
                        details: Plugins.getPluginType(item.scope ? `@${item.scope}/${item.name}` : item.name),
                        local: false,
                        version: response.version,
                        certified: response.certified,
                        installed: response.installed,
                        date: response.date,
                        description: response.description,
                        keywords: response.keywords || [],
                        links: response.links,
                        schema: item.schema
                    });
                }).catch((error) => {
                    HBS.log.debug(error.message);
                    HBS.log.debug(error.stack);

                    results.push({
                        name: item.name,
                        scope: item.scope,
                        details: Plugins.getPluginType(item.scope ? `@${item.scope}/${item.name}` : item.name),
                        local: true,
                        version: item.version,
                        certified: false,
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
                        resolve(results);
                    }
                });
            }

            if (queue.length === 0) {
                resolve(results);
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
                Request.get(`https://plugins.hoobs.org/api/plugin/${name}`).then((response) => {
                    const { ...item } = response.data.results || {};
                    const id = (item.name || "").split("/");

                    if (item.override[0]) {
                        Plugins.package(item.override[0], version).then((response) => {
                            response.replaces = name;

                            HBS.cache.set(key, response, 60 * 3);
    
                            resolve(response);
                        });
                    } else {
                        const results = {
                            name: id.length === 2 ? id[1] : item.name,
                            scope: id.length === 2 ? id[0].replace(/@/gi, "") : null,
                            local: false,
                            version: (item.tags || {}).latest,
                            certified: item.certified,
                            installed: version || false,
                            date: item.published,
                            author: (item.author || {}).username,
                            description: (item.description || "").replace(/(?:https?|ftp):\/\/[\n\S]+/g, "").trim(),
                            homepage: item.homepage,
                            keywords: (item.keywords || "").split(","),
                            license: item.license,
                            readme: item.curated || item.details
                        };
    
                        HBS.cache.set(key, results, 60 * 3);
    
                        resolve(results);
                    }
                }).catch((error) => {
                    reject(error);
                });
            }
        });
    }

    static search(search) {
        return new Promise(async (resolve, reject) => {
            if (search && search !== "") {
                const installed = Plugins.list();

                Request.get(`https://plugins.hoobs.org/api/search/${encodeURIComponent(search)}`).then((response) => {
                    const results = [];

                    response.data = response.data || {};
                    response.data.results = response.data.results || [];

                    for (let i = 0; i < response.data.results.length; i++) {
                        const { ...item } = response.data.results[i];

                        if (blocked.indexOf(item.name || "") === -1) {
                            const id = (item.name || "").split("/");

                            results.push({
                                name: id.length === 2 ? id[1] : item.name,
                                scope: id.length === 2 ? id[0].replace(/@/gi, "") : null,
                                version: item.version,
                                certified: item.certified,
                                installed: installed[item.name] ? installed[item.name].version : false,
                                date: item.published,
                                description: (item.description || "").replace(/(?:https?|ftp):\/\/[\n\S]+/g, "").trim(),
                                keywords: item.keywords
                            });
                        }
                    }

                    resolve(results);
                }).catch((error) => {
                    reject(error);
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
            let rpath = (pjson || {}).main || "" !== "" ? join(ppath, pjson.main) : ppath;

            if (rpath.toLowerCase() === "index.js") {
                rpath = ppath;
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
                } = require("hap-nodejs");

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
                    version: 2.5,
                    serverVersion: HBS.application.version,
    
                    registerPlatform: (_p, a) => {
                        const idx = registered.findIndex(p => p.alias === a && p.type === "platform");
    
                        if (idx === -1) {
                            registered.push({
                                alias: a,
                                type: "platform",
                                path: name
                            });
                        }
                    },
    
                    registerAccessory: (_p, a) => {
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
    
            delete require.cache[require.resolve(rpath)];
        }

        if (registered.length > 0) {
            HBS.plugins[name] = registered;
        }

        return registered;
    }

    static getPlatform(id, name, config) {
        config.platforms = config.platforms || [];

        if (config.platforms.findIndex(p => (p.plugin_map || {}).plugin_name === name) >= 0) {
            return config;
        }

        let found = false;
        let alias = "";

        const details = Plugins.getPluginType(id) || [];

        for (let i = 0; i < details.length; i++) {
            if (details[i].type === "platform") {
                const index = config.platforms.findIndex(p => p.platform === details[i].alias);

                if (index >= 0) {
                    config.platforms[index].plugin_map = {
                        plugin_name: name
                    };

                    found = true;
                } else if (alias === "") {
                    alias = details[i].alias;
                }
            }
        }

        if (!found && alias !== "") {
            config.platforms.push({
                platform: alias,
                plugin_map: {
                    plugin_name: name
                }
            });
        }

        return config;
    }

    static linkLibs() {
        HBS.active.pop();

        if (HBS.active.length === 0) {
            File.ensureSymlinkSync(Server.paths.hap, join(Server.paths.modules.local, "hap-nodejs"));
        }
    }

    static unlinkLibs() {
        if (join(Server.paths.modules.local, "hap-nodejs")) {
            try {
                File.unlinkSync(join(Server.paths.modules.local, "hap-nodejs"));
            } catch (_error) {
                File.removeSync(join(Server.paths.modules.local, "hap-nodejs"));
            }
        }

        HBS.active.push(true);
    }

    static install(id, tag, replace) {
        tag = tag || "latest";

        return new Promise(async (resolve) => {
            if (HBS.active.length > 0) {
                resolve({
                    success: false,
                    active: HBS.active.length
                });
            } else {
                if (blocked.indexOf(id) >= 0) {
                    HBS.log.error(`[plugin] '${id}' is a blocked plugin.`);

                    return resolve(false);
                }

                Plugins.unlinkLibs();

                if (replace) {
                    const name = replace.split("/").pop();
                    const config = HBS.JSON.load(join(Server.paths.config, HBS.name || "", "config.json"), {});

                    config.plugins = config.plugins || [];

                    let index = config.plugins.indexOf(name);

                    if (index > -1) {
                        config.plugins.splice(index, 1);
                    }

                    config.platforms = config.platforms || [];
                    index = config.platforms.findIndex(p => (p.plugin_map || {}).plugin_name === name);

                    while (index >= 0) {
                        config.platforms[index].plugin_map.plugin_name = id.split("/").pop();
                        index = config.platforms.findIndex(p => (p.plugin_map || {}).plugin_name === name);
                    }

                    index = config.platforms.findIndex(p => (p.plugin_map || {}).plugin_name === replace);

                    while (index >= 0) {
                        config.platforms[index].plugin_map.plugin_name = id.split("/").pop();
                        index = config.platforms.findIndex(p => (p.plugin_map || {}).plugin_name === replace);
                    }

                    config.accessories = config.accessories || [];
                    index = config.accessories.findIndex(a => (a.plugin_map || {}).plugin_name === name);

                    while (index >= 0) {
                        config.accessories[index].plugin_map.plugin_name = id.split("/").pop();
                        index = config.accessories.findIndex(a => (a.plugin_map || {}).plugin_name === name);
                    }

                    index = config.accessories.findIndex(a => (a.plugin_map || {}).plugin_name === replace);

                    while (index >= 0) {
                        config.accessories[index].plugin_map.plugin_name = id.split("/").pop();
                        index = config.accessories.findIndex(a => (a.plugin_map || {}).plugin_name === replace);
                    }

                    Server.saveConfig(config);
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
                        "--prefer-offline",
                        "--no-audit",
                        "--unsafe-perm",
                        "--progress=true",
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
                    let success = false;

                    if (File.existsSync(join(Server.paths.modules.local, id, "package.json"))) {
                        const name = id.split("/").pop();

                        let config = HBS.JSON.load(join(Server.paths.config, HBS.name || "", "config.json"), {});

                        config.plugins = config.plugins || [];

                        if (config.plugins.indexOf(name) === -1) {
                            config.plugins.push(name);
                        }

                        Plugins.linkLibs();

                        config = Plugins.getPlatform(id, name, config);

                        Server.saveConfig(config);

                        HBS.config = await Server.configure();
                        HBS.application = HBS.JSON.load(join(Server.paths.application, "/package.json"));

                        success = true;
                    } else {
                        Plugins.linkLibs();
                    }

                    resolve({
                        success,
                        active: HBS.active.length
                    });
                });
            }
        });
    }

    static uninstall(id) {
        return new Promise((resolve) => {
            if (HBS.active.length > 0) {
                resolve({
                    success: false,
                    active: HBS.active.length
                });
            } else {
                Plugins.unlinkLibs();

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
                        "--unsafe-perm",
                        "--progress=true",
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
                    let success = false;

                    if (!File.existsSync(join(Server.paths.modules.local, id, "package.json"))) {
                        const name = id.split("/").pop();
                        const config = HBS.JSON.load(join(Server.paths.config, HBS.name || "", "config.json"), {});

                        config.plugins = config.plugins || [];

                        let index = config.plugins.indexOf(name);

                        if (index > -1) {
                            config.plugins.splice(index, 1);
                        }

                        config.platforms = config.platforms || [];
                        index = config.platforms.findIndex(p => (p.plugin_map || {}).plugin_name === name);

                        while (index >= 0) {
                            config.platforms.splice(index, 1);
                            index = config.platforms.findIndex(p => (p.plugin_map || {}).plugin_name === name);
                        }

                        index = config.platforms.findIndex(p => (p.plugin_map || {}).plugin_name === id);

                        while (index >= 0) {
                            config.platforms.splice(index, 1);
                            index = config.platforms.findIndex(p => (p.plugin_map || {}).plugin_name === id);
                        }

                        config.accessories = config.accessories || [];
                        index = config.accessories.findIndex(a => (a.plugin_map || {}).plugin_name === name);

                        while (index >= 0) {
                            config.accessories.splice(index, 1);
                            index = config.accessories.findIndex(a => (a.plugin_map || {}).plugin_name === name);
                        }

                        index = config.accessories.findIndex(a => (a.plugin_map || {}).plugin_name === id);

                        while (index >= 0) {
                            config.accessories.splice(index, 1);
                            index = config.accessories.findIndex(a => (a.plugin_map || {}).plugin_name === id);
                        }

                        Server.saveConfig(config);

                        HBS.config = await Server.configure();
                        HBS.application = HBS.JSON.load(join(Server.paths.application, "/package.json"));

                        success = true;
                    }

                    Plugins.linkLibs();

                    resolve({
                        success,
                        active: HBS.active.length
                    });
                });
            }
        });
    }

    static update(id, tag) {
        tag = tag || "latest";

        return new Promise((resolve) => {
            if (HBS.active.length > 0) {
                resolve({
                    active: HBS.active.length
                });
            } else {
                Plugins.unlinkLibs();

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
                        "--no-audit",
                        "--progress=true",
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
                    Plugins.linkLibs();

                    resolve({
                        active: HBS.active.length
                    });
                });
            }
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

                Request.get("https://raw.githubusercontent.com/hoobs-org/hoobs-core/master/CHANGELOG.md").then((response) => {
                    response.data = (response.data || "").split("\n");

                    let current = "";

                    for (let i = 0; i < response.data.length; i++) {
                        if (response.data[i].startsWith("##")) {
                            current = response.data[i].replace("## ", "");

                            if (!results[current]) {
                                results[current] = "";
                            }
                        } else if (current && current !== "") {
                            if (results[current] !== "") {
                                results[current] += "\n";
                            }

                            results[current] += response.data[i];
                        }
                    }

                    HBS.cache.set(key, results, 60 * 3);

                    resolve(results);
                }).catch((error) => {
                    reject(error);
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

                Request.get("https://registry.npmjs.org/%40hoobs%2Fhoobs").then((response) => {
                    const results = [];
                    const versions = Object.keys(response.data.versions);

                    versions.sort((a, b) => Plugins.checkVersion(a, b) ? 1 : -1);

                    for (let i = 0; i < Math.min(versions.length, 5); i++) {
                        const { ...item } = response.data.versions[versions[i]];

                        results.push({
                            version: item.version,
                            name: item.name,
                            description: (item.description || "").replace(/(?:https?|ftp):\/\/[\n\S]+/g, "").trim(),
                            changelog: changelog[item.version]
                        });
                    }

                    HBS.cache.set(key, results, 60 * 3);

                    resolve(results);
                }).catch((error) => {
                    reject(error);
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
