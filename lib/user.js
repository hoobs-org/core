const File = require("fs-extra");
const Crypto = require("crypto");
const Server = require("./server");

const { join } = require("path");

module.exports = class User {
    static async generateToken(id, remmeber) {
        const user = global.users.filter(u => u.id === id)[0];
        const key = await User.generateSalt();

        if (user) {
            const token = {
                key,
                id: user.id,
                name: user.name,
                username: user.username,
                admin: user.admin,
                ttl: remmeber ? 525600 : global.config.client.inactive_logoff,
                token: await User.hashValue(user.password, key)
            };

            await global.cache.set(Buffer.from(JSON.stringify(token)).toString("base64"), true, token.ttl);

            return Buffer.from(JSON.stringify(token)).toString("base64");
        }

        return false;
    }

    static get(username) {
        return global.users.filter(u => u.username === username)[0];
    }

    static decode(token) {
        if (!token || token === "") {
            return {};
        }

        try {
            const data = JSON.parse(Buffer.from(token, "base64").toString());
            const user = global.users.filter(u => u.id === data.id)[0];

            if (!user) {
                return {};
            }

            return user;
        } catch (error) {
            return false;
        }
    }

    static async create(name, username, password, admin) {
        const user = {
            id: 1,
            name,
            admin: false,
            username,
            password,
            salt: await User.generateSalt()
        }

        if (global.admin || global.users.length === 0) {
            try {
                user.admin = JSON.parse(admin);
            } catch {
                user.admin = false;
            }
        } else {
            user.admin = false;
        }

        user.password = await User.hashValue(user.password, user.salt);

        if (global.users.length > 0) {
            user.id = global.users[global.users.length - 1].id + 1;
        }

        global.users.push(user);

        if (File.existsSync(join(Server.paths.config, "access.json"))) {
            File.unlinkSync(join(Server.paths.config, "access.json"));
        }

        File.appendFileSync(join(Server.paths.config, "access.json"), JSON.stringify(global.users, null, 4));

        return user;
    }

    static async update(id, name, username, password, admin) {
        const index = global.users.findIndex(u => u.id === id);

        if (index >= 0 && (!global.users[index].admin || global.admin)) {
            global.users[index].name = name;
            global.users[index].username = username;

            if (global.admin) {
                global.users[index].admin = admin;
            } else {
                global.users[index].admin = false;
            }

            if (password) {
                global.users[index].password = await User.hashValue(password, global.users[index].salt);
            }

            if (File.existsSync(join(Server.paths.config, "access.json"))) {
                File.unlinkSync(join(Server.paths.config, "access.json"));
            }
    
            File.appendFileSync(join(Server.paths.config, "access.json"), JSON.stringify(global.users, null, 4));
    
            return global.users[index];
        }

        return false;
    }

    static delete(id) {
        const index = global.users.findIndex(u => u.id === id);

        if (index >= 0 && (!global.users[index].admin || global.admin)) {
            global.users.splice(index, 1);

            if (File.existsSync(join(Server.paths.config, "access.json"))) {
                File.unlinkSync(join(Server.paths.config, "access.json"));
            }
    
            File.appendFileSync(join(Server.paths.config, "access.json"), JSON.stringify(global.users, null, 4));

            return true;
        }

        return false;
    }

    static async validateToken(token) {
        if (!token || token === "") {
            return false;
        }

        const server = await global.cache.get(token);

        if (!server && !INSTANCE) {
            return false;
        }

        try {
            const data = JSON.parse(Buffer.from(token, "base64").toString());
            const user = global.users.filter(u => u.id === data.id)[0];

            if (!user) {
                return false;
            }

            const challenge = await User.hashValue(user.password, data.key);

            if (challenge === data.token) {
                global.user = user.id;
                global.admin = user.admin;

                await global.cache.set(token, true, data.ttl || global.config.client.inactive_logoff || 30);

                return true;
            }

            return false;
        } catch (error) {
            return false;
        }
    }

    static generateSalt() {
        return new Promise((resolve, reject) => {
            Crypto.randomBytes(32, (error, buffer) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(buffer.toString("hex"));
                }
            });
        });
    }

    static hashValue(value, salt) {
        return new Promise((resolve, reject) => {
            Crypto.pbkdf2(value, salt, 1000, 64, "sha512", (error, key) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(key.toString("hex"));
                }
            });
        });
    }

    static strongPassword(password) {
        return (/(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%&*()]).{8,}/).test(password);
    }
}
