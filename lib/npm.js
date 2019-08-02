const Request = require("request");
const File = require("fs-extra");

const Server = require("./server");

const { join } = require("path");
const { spawn } = require("child_process");

module.exports = class NPM {
    static list() {
        const results = {};

        const modules = File.readdirSync(Server.paths.modules.local).filter(file => File.lstatSync(join(Server.paths.modules.local, file)).isDirectory());

        for (let i = 0; i < modules.length; i++) {
            const directory = join(Server.paths.modules.local, modules[i]);
            const filename = join(directory, "/package.json");

            log.debug(directory);

            if (File.existsSync(filename)) {
                const item = JSON.parse(File.readFileSync(filename));
                const schema = {};

                if (File.existsSync(join(directory, "/platform.schema.json"))) {
                    schema.platform = JSON.parse(File.readFileSync(join(directory, "/platform.schema.json")));
                } else if (File.existsSync(join(directory, "/config.schema.json"))) {
                    schema.platform = JSON.parse(File.readFileSync(join(directory, "/config.schema.json")));
                }

                if (File.existsSync(join(directory, "/accessories.schema.json"))) {
                    schema.accessories = JSON.parse(File.readFileSync(join(directory, "/accessories.schema.json")));
                }

                if (item.name === "homebridge" || (Array.isArray(item.keywords) && (item.keywords.indexOf("homebridge-plugin") >= 0 || item.keywords.indexOf("homebridge-interface") >= 0))) {
                    results[item.name] = {
                        name: item.name,
                        version: item.version,
                        directory: directory,
                        description: (item.description || "").replace(/(?:https?|ftp):\/\/[\n\S]+/g, "").trim(),
                        keywords: item.keywords || [],
                        schema: {
                            platform: schema.platform,
                            accessories: schema.accessories
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
            const installed = NPM.list();
            const keys = Object.keys(installed);

            for (let i = 0; i < keys.length; i++) {
                const { ...item } = installed[keys[i]];

                queue.push(true);

                NPM.package(item.name, item.version).then((response) => {
                    if (item.name === "homebridge") {
                        results.unshift({
                            name: response.name,
                            local: false,
                            version: response.version,
                            installed: response.installed,
                            date: response.date,
                            description: response.description,
                            keywords: response.keywords || [],
                            links: response.links
                        });
                    } else {
                        results.push({
                            name: response.name,
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
                    results.push({
                        name: item.name,
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
            Request({
                url: `https://api.npms.io/v2/package/${name}`,
                json: true
            }, (error, response, body) => {
                if (!error && body.collected && body.collected.metadata) {
                    const { ...item } = body.collected.metadata;

                    resolve({
                        name: item.name,
                        local: false,
                        version: item.version,
                        installed: version || false,
                        date: item.date,
                        author: item.author,
                        publisher: item.publisher,
                        repository: item.repository,
                        description: (item.description || "").replace(/(?:https?|ftp):\/\/[\n\S]+/g, "").trim(),
                        keywords: item.keywords,
                        links: item.links,
                        license: item.license,
                        readme: item.readme
                    });
                } else {
                    reject(error);
                }
            });
        });
    }

    static search(search, limit) {
        return new Promise((resolve, reject) => {
            if (search && search !== "") {
                const installed = NPM.list();

                Request({
                    url: `https://api.npms.io/v2/search?q=${search}+keywords:homebridge-plugin,homebridge-interface+not:deprecated+not:insecure&size=${limit}`,
                    json: true
                }, (error, response, body) => {
                    const results = [];

                    if (!error) {
                        for (let i = 0; i < body.results.length; i++) {
                            const { ...item } = body.results[i].package;

                            results.push({
                                name: item.name,
                                version: item.version,
                                installed: installed[item.name] ? installed[item.name].version : false,
                                date: item.date,
                                description: (item.description || "").replace(/(?:https?|ftp):\/\/[\n\S]+/g, "").trim(),
                                keywords: item.keywords,
                                links: item.links
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

    static install(name) {
        return new Promise((resolve) => {
            const process = spawn(join(Server.paths.modules.global, "npm/bin/npm-cli.js"), [
                "install",
                "--save",
                "--unsafe-perm",
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
                if (File.existsSync(join(Server.paths.modules.local, `/${name}/package.json`))) {
                    const item = JSON.parse(File.readFileSync(join(Server.paths.modules.local, `/${name}/package.json`)));

                    if (item.keywords) {
                        if (item.keywords.indexOf("homebridge-plugin") >= 0 && config.plugins.indexOf(name) === -1) {
                            config.plugins.push(name);
                        }

                        if (item.keywords.indexOf("homebridge-interface") >= 0 && config.interfaces.indexOf(name) === -1) {
                            config.interfaces.push(name);
                        }

                        if (File.existsSync(join(Server.paths.modules.local, `/${name}/config.schema.json`))) {
                            const plugin = JSON.parse(File.readFileSync(join(Server.paths.modules.local, `/${name}/config.schema.json`)));

                            if (plugin.platform) {
                                config.platforms.push(plugin.platform);
                            }

                            if (plugin.accessories && Array.isArray(plugin.accessories)) {
                                for (let i = 0; i < plugin.accessories.length; i++) {
                                    config.accessories.push(plugin.accessories[i])
                                }
                            }
                        }
                    }

                    Server.saveConfig(config);
                }

                resolve();
            });
        });
    }

    static uninstall(name) {
        return new Promise((resolve) => {
            const process = spawn(join(Server.paths.modules.global, "npm/bin/npm-cli.js"), [
                "uninstall",
                "--save",
                "--unsafe-perm",
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
                let index = config.plugins.indexOf(name);

                if (index > -1) {
                    config.plugins.splice(index, 1);
                }

                index = config.plugins.indexOf(name);

                if (index > -1) {
                    config.plugins.splice(index, 1);
                }

                index = config.interfaces.indexOf(name);

                if (index > -1) {
                    config.interfaces.splice(index, 1);
                }

                Server.saveConfig(config);

                resolve();
            });
        });
    }

    static update(name) {
        return new Promise((resolve) => {
            const process = spawn(join(Server.paths.modules.global, "npm/bin/npm-cli.js"), [
                "update",
                "--save",
                "--unsafe-perm",
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
}
