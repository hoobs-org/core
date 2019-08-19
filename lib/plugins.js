const Request = require("request");
const File = require("fs-extra");

const Server = require("./server");

const { join } = require("path");
const { spawn } = require("child_process");

module.exports = class Plugins {
    static list() {
        const results = {};
        const modules = File.readdirSync(Server.paths.modules.local).filter(file => File.lstatSync(join(Server.paths.modules.local, file)).isDirectory());

        const level = JSON.parse(JSON.stringify(modules));

        for (let i = 0; i < level.length; i++) {
            if (level[i].startsWith("@")) {
                const directory = join(Server.paths.modules.local, level[i]);
                const scopes = File.readdirSync(directory).filter(file => File.lstatSync(join(directory, file)).isDirectory());

                for (let j = 0; j < scopes.length; j++) {
                    modules.push(`${level[i]}/${scopes[j]}`);
                }
            }
        }

        modules.sort();

        for (let i = 0; i < modules.length; i++) {
            const directory = join(Server.paths.modules.local, modules[i]);
            const filename = join(directory, "/package.json");

            log.debug(directory);

            if (File.existsSync(filename)) {
                const item = JSON.parse(File.readFileSync(filename));

                const schema = {
                    platform: {},
                    accessories: {}
                };

                if (File.existsSync(join(directory, "/platform.schema.json"))) {
                    schema.platform = JSON.parse(File.readFileSync(join(directory, "/platform.schema.json")));
                } else if (File.existsSync(join(directory, "/config.schema.json"))) {
                    schema.platform = JSON.parse(File.readFileSync(join(directory, "/config.schema.json")));
                }

                if (File.existsSync(join(directory, "/accessories.schema.json"))) {
                    schema.accessories = JSON.parse(File.readFileSync(join(directory, "/accessories.schema.json")));
                }

                if (item.name === "@hoobs/homebridge" || (Array.isArray(item.keywords) && (item.keywords.indexOf("hoobs-plugin") >= 0 || item.keywords.indexOf("homebridge-plugin") >= 0 || item.keywords.indexOf("hoobs-interface") >= 0))) {
                    const id = item.name.split("/");

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
                    if (item.name === "homebridge") {
                        certified.unshift({
                            name: response.name,
                            scope: response.scope,
                            local: false,
                            version: response.version,
                            installed: response.installed,
                            date: response.date,
                            description: response.description,
                            keywords: response.keywords || [],
                            links: response.links
                        });
                    } else if (response.scope === "hoobs") {
                        certified.push({
                            name: response.name,
                            scope: response.scope,
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
                }).catch(() => {
                    local.push({
                        name: item.name,
                        scope: item.scope,
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
            Request({
                url: `https://registry.npmjs.org/${encodeURIComponent(name)}`,
                json: true
            }, (error, response, body) => {
                if (!error && body) {
                    const { ...item } = body;
                    const id = item.name.split("/");

                    resolve({
                        name: id.length === 2 ? id[1] : item.name,
                        scope: id.length === 2 ? id[0].replace(/@/gi, "") : null,
                        local: false,
                        version: (item["dist-tags"] || {}).latest,
                        installed: version || false,
                        date: (item.time || {}).modified,
                        author: (item.author || {}).name,
                        description: (item.description || "").replace(/(?:https?|ftp):\/\/[\n\S]+/g, "").trim(),
                        keywords: item.keywords,
                        license: item.license,
                        readme: item.readme
                    });
                } else {
                    reject(error);
                }
            });
        });
    }

    static categories() {
        return new Promise((resolve, reject) => {
            Request({
                url: `https://raw.githubusercontent.com/hoobs-org/HOOBS/master/certified/categories.json`,
                json: true
            }, (error, response, body) => {
                if (!error) {
                    body.sort();

                    resolve(body);
                } else {
                    reject(error);
                }
            });
        });
    }

    static certified(category) {
        return new Promise((resolve, reject) => {
            if (category && category !== "") {
                const installed = Plugins.list();

                Request({
                    url: `https://registry.npmjs.org/-/v1/search?text=@hoobs+keywords:hoobs-certified+${category}`,
                    json: true
                }, (error, response, body) => {
                    const results = [];

                    if (!error) {
                        for (let i = 0; i < body.objects.length; i++) {
                            const { ...item } = body.objects[i].package;
                            const id = item.name.split("/");
                            const repository = ((item.links || {}).repository || "").replace("https://github.com/", "https://raw.githubusercontent.com/");

                            results.push({
                                name: id.length === 2 ? id[1] : item.name,
                                scope: item.scope,
                                version: item.version,
                                installed: installed[item.name] ? installed[item.name].version : false,
                                date: item.date,
                                description: (item.description || "").replace(/(?:https?|ftp):\/\/[\n\S]+/g, "").trim(),
                                icon: repository && repository !== "" ? `${repository}/master/branding/icon.svg` : null,
                                image: repository && repository !== "" ? `${repository}/master/branding/product.png` : null,
                                keywords: item.keywords
                            });
                        }

                        resolve(results);
                    } else {
                        reject(error);
                    }
                });
            } else {
                resolve([]);
            }
        });
    }

    static search(search, limit) {
        return new Promise((resolve, reject) => {
            if (search && search !== "") {
                const installed = Plugins.list();

                search = (search || "").split("/")
                search = encodeURIComponent(search[search.length - 1]);

                Request({
                    url: `https://registry.npmjs.org/-/v1/search?text=${search}+keywords:hoobs-plugin,homebridge-plugin&size=${limit}`,
                    json: true
                }, (error, response, body) => {
                    const certified = [];
                    const results = [];

                    if (!error) {
                        for (let i = 0; i < body.objects.length; i++) {
                            const { ...item } = body.objects[i].package;
                            const id = item.name.split("/");

                            if (item.scope === "hoobs") {
                                certified.push({
                                    name: id.length === 2 ? id[1] : item.name,
                                    scope: item.scope,
                                    version: item.version,
                                    installed: installed[item.name] ? installed[item.name].version : false,
                                    date: item.date,
                                    description: (item.description || "").replace(/(?:https?|ftp):\/\/[\n\S]+/g, "").trim(),
                                    keywords: item.keywords
                                });
                            } else {
                                results.push({
                                    name: id.length === 2 ? id[1] : item.name,
                                    scope: item.scope,
                                    version: item.version,
                                    installed: installed[item.name] ? installed[item.name].version : false,
                                    date: item.date,
                                    description: (item.description || "").replace(/(?:https?|ftp):\/\/[\n\S]+/g, "").trim(),
                                    keywords: item.keywords
                                });
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

    static getPlatform(id, name) {
        if (config.platforms.findIndex(p => (p.plugin_map || {}).plugin_name === name) >= 0) {
            return null;
        }

        if (File.existsSync(join(Server.paths.modules.local, `/${id}/platform.schema.json`))) {
            let schema = {};

            try {
                schema = JSON.parse(File.readFileSync(join(Server.paths.modules.local, `/${id}/platform.schema.json`)));
            } catch {
                schema = {};
            }

            const alias = schema.plugin_alias || schema.pluginAlias || name;
            const index = config.platforms.findIndex(p => p.platform === alias);

            if (index >= 0) {
                config.platforms[index].plugin_map = {
                    plugin_name: name
                };

                return null;
            } else {
                return {
                    platform: alias,
                    plugin_map: {
                        plugin_name: name
                    }
                };
            }
        } else if (File.existsSync(join(Server.paths.modules.local, `/${id}/config.schema.json`))) {
            let schema = {};

            try {
                schema = JSON.parse(File.readFileSync(join(Server.paths.modules.local, `/${id}/config.schema.json`)));
            } catch {
                schema = {};
            }

            const alias = schema.plugin_alias || schema.pluginAlias || name;
            const index = config.platforms.findIndex(p => p.platform === alias);

            if (index >= 0) {
                config.platforms[index].plugin_map = {
                    plugin_name: name
                };

                return null;
            } else {
                return {
                    platform: alias,
                    plugin_map: {
                        plugin_name: name
                    }
                };
            }
        } else if (File.existsSync(join(Server.paths.modules.local, `/${id}/config.json`))) {
            const plugin = JSON.parse(File.readFileSync(join(Server.paths.modules.local, `/${id}/config.json`)));

            if (plugin.platforms) {
                if (!Array.isArray(plugin.platforms)) {
                    plugin.platforms = [plugin.platforms];
                }

                if (plugin.platforms.length > 0) {
                    plugin.platforms[0].plugin_map = {
                        plugin_name: name
                    }
                }

                return plugin.platforms[0];
            }
        }

        return null;
    }

    static install(id) {
        return new Promise((resolve) => {
            const process = spawn(join(Server.paths.modules.global, "npm/bin/npm-cli.js"), [
                "install",
                id
            ], {
                cwd: Server.paths.application
            });

            process.stdout.on("data", (data) => {
                global.log.info(`${data}`.trimEnd());
            });
              
            process.stderr.on("data", (data) => {
                global.log.error(`${data}`.trimEnd());
            });
              
            process.on("close", () => {
                if (File.existsSync(join(Server.paths.modules.local, `/${id}/package.json`))) {
                    const item = JSON.parse(File.readFileSync(join(Server.paths.modules.local, `/${id}/package.json`)));
                    const parts = id.split("/");
                    const name = parts[parts.length - 1];

                    if (item.keywords) {
                        if ((item.keywords.indexOf("hoobs-plugin") >= 0 || item.keywords.indexOf("homebridge-plugin") >= 0) && config.plugins.indexOf(name) === -1) {
                            config.plugins.push(name);
                        }

                        if (item.keywords.indexOf("homebridge-interface") >= 0 && config.interfaces.indexOf(name) === -1) {
                            config.interfaces.push(name);
                        }

                        const platform = Plugins.getPlatform(id, name);

                        if (platform) {
                            config.platforms.push(platform);
                        }
                    }

                    Server.saveConfig(config);
                }

                resolve();
            });
        });
    }

    static uninstall(id) {
        return new Promise((resolve) => {
            const process = spawn(join(Server.paths.modules.global, "npm/bin/npm-cli.js"), [
                "uninstall",
                id
            ], {
                cwd: Server.paths.application
            });

            process.stdout.on("data", (data) => {
                global.log.info(`${data}`.trimEnd());
            });
              
            process.stderr.on("data", (data) => {
                global.log.error(`${data}`.trimEnd());
            });
              
            process.on("close", () => {
                const parts = id.split("/");
                const name = parts[parts.length - 1];

                let index = config.plugins.indexOf(name);

                if (index > -1) {
                    config.plugins.splice(index, 1);
                }

                index = config.interfaces.indexOf(name);

                if (index > -1) {
                    config.interfaces.splice(index, 1);
                }

                index = config.platforms.findIndex(p => (p.plugin_map || {}).plugin_name === name);

                while (index >= 0) {
                    config.platforms.splice(index, 1);
                    index = config.platforms.findIndex(p => (p.plugin_map || {}).plugin_name === name);
                }

                index = config.accessories.findIndex(a => (a.plugin_map || {}).plugin_name === name);

                while (index >= 0) {
                    config.accessories.splice(index, 1);
                    index = config.accessories.findIndex(a => (a.plugin_map || {}).plugin_name === name);
                }

                Server.saveConfig(config);

                resolve();
            });
        });
    }

    static update(name) {
        return new Promise((resolve) => {
            const process = spawn(join(Server.paths.modules.global, "npm/bin/npm-cli.js"), [
                "install",
                name
            ], {
                cwd: Server.paths.application
            });

            process.stdout.on("data", (data) => {
                global.log.info(`${data}`.trimEnd());
            });
              
            process.stderr.on("data", (data) => {
                global.log.error(`${data}`.trimEnd());
            });
              
            process.on("close", () => {
                resolve();
            });
        });
    }

    static releases() {
        return new Promise((resolve, reject) => {
            Request({
                url: "https://api.github.com/repos/hoobs-org/HOOBS/releases",
                json: true,
                headers: {
                    "Accept": "application/vnd.github.v3+json",
                    "User-Agent": "hoobs-core"
                }
            }, (error, response, body) => {
                const results = [];

                if (!error) {
                    const versions = [];
                    const lookup = {};

                    for (let i = 0; i < body.length; i++) {
                        const { ...item } = body[i];

                        if (!item.draft && item.assets && item.assets.length > 0) {
                            versions.push(item.tag_name.replace(/v/gi, ""));
                            lookup[item.tag_name.replace(/v/gi, "")] = i;
                        }
                    }

                    versions.sort((a, b) => Plugins.checkVersion(a, b) ? 1 : -1);

                    for (let i = 0; i < versions.length; i++) {
                        const { ...item } = body[lookup[versions[i]]];

                        results.push({
                            version: versions[i],
                            name: item.name,
                            filename: item.assets[0].name,
                            content_type: item.assets[0].content_type,
                            size: item.assets[0].size,
                            url: item.assets[0].browser_download_url
                        });
                    }

                    resolve(results);
                } else {
                    reject(error);
                }
            });
        });
    }

    static checkVersion(version, latest) {
        const current = `${version}`.split(".");
        const release = `${latest}`.split(".");

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
