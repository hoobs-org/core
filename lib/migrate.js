const _ = require("lodash");

const File = require("fs-extra");
const OS = require("os");

const { join } = require("path");
const { spawn } = require("child_process");

module.exports = class Migrate {
    static access(path) {
        let storage = join(OS.homedir(), ".homebridge");

        if (global.STORAGE && global.STORAGE !== "" && File.existsSync(global.STORAGE)) {
            storage = global.STORAGE;
        }

        const users = [];

        if (File.existsSync(join(storage, "auth.json"))) {
            const current = JSON.parse(File.readFileSync(join(storage, "auth.json")));

            for (let i = 0; i < current.length; i++) {
                const { ...user } = current[i];

                users.push({
                    id: user.id,
                    name: user.name,
                    admin: user.admin,
                    username: user.username,
                    password: user.hashedPassword,
                    salt: user.salt
                });
            }
        }

        if (File.existsSync(join(path, "access.json"))) {
            File.unlinkSync(join(path, "access.json"));
        }

        File.appendFileSync(join(path, "access.json"), JSON.stringify(users, null, 4));
    }

    static configure(path) {
        let storage = join(OS.homedir(), ".homebridge");

        if (global.STORAGE && global.STORAGE !== "" && File.existsSync(global.STORAGE)) {
            storage = global.STORAGE;
        }

        let current = {
            bridge: {
                name: "HOOBS",
                port: 51826,
                pin: "031-45-154"
            },
            description: "",
            ports: {},
            plugins: [],
            interfaces: [],
            accessories: [],
            platforms: []
        };

        if (File.existsSync(join(storage, "config.json"))) {
            current = _.extend(current, JSON.parse(File.readFileSync(join(storage, "config.json"))));
        }

        const index = current.platforms.findIndex((p) => p.platform === "config");

        if (index >= 0) {
            current.platforms.splice(index, 1);
        }

        if (File.existsSync(join(storage, "accessories"))) {
            File.copySync(join(storage, "accessories"), join(path, "accessories"));
        }

        if (File.existsSync(join(storage, "persist"))) {
            File.copySync(join(storage, "persist"), join(path, "persist"));
        }

        return current;
    }

    static plugins(path, application) {
        return new Promise((resolve) => {
            const plugins = [];
            const queue = [];

            const incompatable = [
                "hoobs-core",
                "homebridge",
                "homebridge-server",
                "homebridge-config-ui",
                "homebridge-config-ui-x",
                "homebridge-config-ui-hoobs"
            ];

            const modules = File.readdirSync(path).filter(file => File.lstatSync(join(path, file)).isDirectory());

            for (let i = 0; i < modules.length; i++) {
                const directory = join(path, modules[i]);
                const filename = join(directory, "/package.json");

                if (File.existsSync(filename)) {
                    const item = JSON.parse(File.readFileSync(filename));

                    if (Array.isArray(item.keywords) && item.keywords.indexOf("homebridge-plugin") >= 0 && incompatable.indexOf(item.name) === -1) {
                        queue.push(true);

                        const process = spawn(join(path, "npm/bin/npm-cli.js"), [
                            "install",
                            item.name
                        ], {
                            cwd: application
                        });
            
                        process.stdout.on("data", (data) => {
                            console.log(`${data}`.trimEnd());
                        });

                        process.stderr.on("data", (data) => {
                            console.log(`${data}`.trimEnd());
                        });

                        process.on("close", () => {
                            queue.pop();

                            plugins.push(item.name);

                            if (queue.length === 0) {
                                resolve(plugins);
                            }
                        });
                    }
                }
            }

            if (queue.length === 0) {
                resolve(plugins);
            }
        });
    }

    static cleanup(path) {
        return new Promise((resolve) => {
            if (OS.userInfo().username === "root") {
                const modules = File.readdirSync(path).filter(file => File.lstatSync(join(path, file)).isDirectory());
                const queue = [];

                for (let i = 0; i < modules.length; i++) {
                    const directory = join(path, modules[i]);
                    const filename = join(directory, "/package.json");

                    if (File.existsSync(filename)) {
                        const item = JSON.parse(File.readFileSync(filename));

                        if ((Array.isArray(item.keywords) && item.keywords.indexOf("homebridge-plugin") >= 0 && item.name !== "hoobs-core") || item.name === "homebridge") {
                            queue.push(true);

                            const process = spawn(join(path, "npm/bin/npm-cli.js"), [
                                "uninstall",
                                "-g",
                                item.name
                            ]);

                            process.stdout.on("data", (data) => {
                                console.log(`${data}`.trimEnd());
                            });

                            process.stderr.on("data", (data) => {
                                console.log(`${data}`.trimEnd());
                            });

                            process.on("close", () => {
                                queue.pop();

                                if (queue.length === 0) {
                                    return resolve();
                                }
                            });
                        }
                    }
                }

                if (queue.length === 0) {
                    return resolve();
                }
            } else {
                return resolve();
            }
        });
    }
}
