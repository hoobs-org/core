const Path = require("path");
const File = require("fs-extra");
const Ora = require("ora");

module.exports = (enviornment) => {
    return new Promise(async (resolve) => {
        const throbber = Ora("Checking Existing Configuration").start();

        if (enviornment.plugins && Array.isArray(enviornment.plugins) && enviornment.plugins.length > 0) {
            writeJson("plugins.json", enviornment.plugins);
        }

        if (File.existsSync(Path.join(enviornment.storage, "config.json"))) {
            let config = {
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

            config = JSON.parse(File.readFileSync(Path.join(enviornment.storage, "config.json")));

            let index = (config.platforms || []).findIndex((p) => p.platform === "config");

            if (index >= 0) {
                (config.platforms || []).splice(index, 1);
            }

            index = (config.platforms || []).findIndex((p) => p.platform === "to-hoobs");

            if (index >= 0) {
                (config.platforms || []).splice(index, 1);
            }

            writeJson("config.json", config);
        }

        if (enviornment.plugins && Array.isArray(enviornment.plugins) && enviornment.plugins.length > 0) {
            const dependencies = {};
            const installed = (JSON.parse(File.readFileSync(Path.join(enviornment.application, "package.json")))).dependencies;

            for (let i = 0; i < enviornment.plugins.length; i++) {
                installed[enviornment.plugins[i].name] = `^${enviornment.plugins[i].version}`;
            }

            const names = Object.keys(installed).sort();

            for (let i = 0; i < names.length; i++) {
                dependencies[names[i]] = installed[names[i]];
            }

            writeJson("dependencies.json", dependencies);
        }

        if (File.existsSync(Path.join(enviornment.storage, "auth.json"))) {
            const users = [];
            const current = JSON.parse(File.readFileSync(Path.join(enviornment.storage, "auth.json")));

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

            writeJson("access.json", users);
        }

        if (File.existsSync(Path.join(enviornment.storage, "accessories/uiAccessoriesLayout.json"))) {
            let layout = {};
            let source = {};

            try {
                source = JSON.parse(File.readFileSync(Path.join(enviornment.storage, "accessories/uiAccessoriesLayout.json")));
            } catch {
                source = {};
            }

            const sections = Object.keys(source);
            const placed = [];

            for (let i = 0; i < sections.length; i++) {
                const user = source[sections[i]];

                layout[sections[i]] = {
                    rooms: [],
                    hidden: [],
                    names: {}
                };

                for (let j = 0; j < user.length; j++) {
                    const item = user[j];

                    if (item.name !== "Default Room" && item.name !== "Unassigned") {
                        const room = {
                            name: item.name,
                            accessories: []
                        };

                        for (let k = 0; k < item.services.length; k++) {
                            const service = item.services[k];

                            let aid = parseFloat(service.aid);

                            if (!Number.isNaN(aid)) {
                                let count = 0;
                                let safety = 0;

                                while (placed.indexOf(aid) >= 0) {
                                    count += 1;
                                    safety += 1;

                                    aid = parseFloat(`${service.aid}.${count}`);

                                    if (Number.isNaN(aid) || safety >= 10) {
                                        aid = NaN;

                                        break;
                                    }
                                }

                                if (!Number.isNaN(aid)) {
                                    if (service.hidden) {
                                        layout[sections[i]].hidden.push(aid);
                                    } else {
                                        room.accessories.push(aid);
                                        placed.push(aid);
                                    }

                                    if (service.customName && service.customName !== "") {
                                        layout[sections[i]].names[aid] = service.customName;
                                    }
                                }
                            }
                        }

                        layout[sections[i]].rooms.push(room);
                    }
                }
            }

            writeJson("layout.json", layout);
        }

        if (File.existsSync(Path.join(enviornment.storage, "accessories"))) {
            if (!File.existsSync("/var/hoobs")) {
                File.mkdirSync("/var/hoobs");
                File.chmodSync("/var/hoobs", 0755);
            }
    
            if (!File.existsSync("/var/hoobs/.migration")) {
                File.mkdirSync("/var/hoobs/.migration");
                File.chmodSync("/var/hoobs/.migration", 0755);
            }

            File.copySync(Path.join(enviornment.storage, "accessories"), "/var/hoobs/.migration/accessories");
            File.chmodSync("/var/hoobs/.migration/accessories", 0755);

            if (File.existsSync("/var/hoobs/.migration/accessories/uiAccessoriesLayout.json")) {
                File.unlinkSync("/var/hoobs/.migration/accessories/uiAccessoriesLayout.json");
            }
        }

        if (File.existsSync(Path.join(enviornment.storage, "persist"))) {
            if (!File.existsSync("/var/hoobs")) {
                File.mkdirSync("/var/hoobs");
                File.chmodSync("/var/hoobs", 0755);
            }
    
            if (!File.existsSync("/var/hoobs/.migration")) {
                File.mkdirSync("/var/hoobs/.migration");
                File.chmodSync("/var/hoobs/.migration", 0755);
            }

            File.copySync(Path.join(enviornment.storage, "persist"), "/var/hoobs/.migration/persist");
            File.chmodSync("/var/hoobs/.migration/persist", 0755);
        }

        if (File.existsSync(enviornment.storage)) {
            const known = [
                "auth.json",
                "config.json",
                "layout.json"
            ];

            const files = File.readdirSync(enviornment.storage).filter(f => File.lstatSync(Path.join(enviornment.storage, f)).isFile() && known.indexOf(f) === -1);
            const unmanaged = [];

            for (let i = 0; i < files.length; i++) {
                File.copySync(Path.join(enviornment.storage, files[i]), Path.join("/var/hoobs/.migration", files[i]));
                File.chmodSync(Path.join("/var/hoobs/.migration", files[i]), 0755);

                unmanaged.push(files[i]);
            }

            writeJson("unmanaged.json", unmanaged);
        }

        throbber.stopAndPersist();

        resolve();
    });
};

const writeJson = function (filename, data) {
    if (!File.existsSync("/var/hoobs")) {
        File.mkdirSync("/var/hoobs");
        File.chmodSync("/var/hoobs", 0755);
    }

    if (!File.existsSync("/var/hoobs/.migration")) {
        File.mkdirSync("/var/hoobs/.migration");
        File.chmodSync("/var/hoobs/.migration", 0755);
    }

    if (File.existsSync(Path.join("/var/hoobs/.migration/", filename))) {
        File.unlinkSync(Path.join("/var/hoobs/.migration/", filename));
    }

    File.appendFileSync(Path.join("/var/hoobs/.migration/", filename), JSON.stringify(data, null, 4));
    File.chmodSync(Path.join("/var/hoobs/.migration/", filename), 0755);
};
