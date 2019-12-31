const File = require("fs-extra");
const Crypto = require("crypto");

const HBS = require("./instance");
const Server = require("./server");

const { join } = require("path");

module.exports = class User {
    static async generateToken(id, remember) {
        const user = HBS.users.filter(u => u.id === id)[0];
        const key = await User.generateSalt();

        if (user) {
            const token = {
                key,
                id: user.id,
                name: user.name,
                username: user.username,
                admin: user.admin,
                ttl: remember ? 525600 : HBS.config.client.inactive_logoff,
                token: await User.hashValue(user.password, key)
            };

            HBS.cache.set(Buffer.from(JSON.stringify(token), "utf8").toString("base64"), true, token.ttl);

            return Buffer.from(JSON.stringify(token), "utf8").toString("base64");
        }

        return false;
    }

    static get(username) {
        return HBS.users.filter(u => u.username.toLowerCase() === username.toLowerCase())[0];
    }

    static decode(token) {
        if (!token || token === "") {
            return {};
        }

        const data = HBS.JSON.tryParse(Buffer.from(token, "base64").toString());

        if (data) {
            const user = HBS.users.filter(u => u.id === data.id)[0];

            if (!user) {
                return {};
            }

            return user;
        }

        return false;
    }

    static async create(name, username, password, admin) {
        const user = {
            id: 1,
            name,
            admin,
            username,
            password,
            salt: await User.generateSalt()
        }

        user.admin = HBS.JSON.tryParse(admin, false);
        user.password = await User.hashValue(user.password, user.salt);

        if (HBS.users.length > 0) {
            user.id = HBS.users[HBS.users.length - 1].id + 1;
        }

        HBS.users.push(user);

        if (File.existsSync(join(Server.paths.config, HBS.name || "", "access.json"))) {
            File.unlinkSync(join(Server.paths.config, HBS.name || "", "access.json"));
        }

        File.appendFileSync(join(Server.paths.config, HBS.name || "", "access.json"), JSON.stringify(HBS.users, null, 4));

        return user;
    }

    static async update(id, name, username, password, admin) {
        const index = HBS.users.findIndex(u => u.id === id);

        if (index >= 0 && (!HBS.users[index].admin || HBS.admin)) {
            HBS.users[index].name = name;
            HBS.users[index].username = username;

            if (HBS.admin) {
                HBS.users[index].admin = admin;
            } else {
                HBS.users[index].admin = false;
            }

            if (password) {
                HBS.users[index].password = await User.hashValue(password, HBS.users[index].salt);
            }

            if (File.existsSync(join(Server.paths.config, HBS.name || "", "access.json"))) {
                File.unlinkSync(join(Server.paths.config, HBS.name || "", "access.json"));
            }
    
            File.appendFileSync(join(Server.paths.config, HBS.name || "", "access.json"), JSON.stringify(HBS.users, null, 4));
    
            return HBS.users[index];
        }

        return false;
    }

    static delete(id) {
        const index = HBS.users.findIndex(u => u.id === id);

        if (index >= 0 && (!HBS.users[index].admin || HBS.admin)) {
            HBS.users.splice(index, 1);

            if (File.existsSync(join(Server.paths.config, HBS.name || "", "access.json"))) {
                File.unlinkSync(join(Server.paths.config, HBS.name || "", "access.json"));
            }
    
            File.appendFileSync(join(Server.paths.config, HBS.name || "", "access.json"), JSON.stringify(HBS.users, null, 4));

            return true;
        }

        return false;
    }

    static async validateToken(token) {
        if (!token || token === "") {
            return false;
        }

        const server = HBS.cache.get(token);

        if (!server && !HBS.name) {
            return false;
        }

        const data = HBS.JSON.tryParse(Buffer.from(token, "base64").toString());

        if (data) {
            const user = HBS.users.filter(u => u.id === data.id)[0];

            if (!user) {
                return false;
            }

            const challenge = await User.hashValue(user.password, data.key);

            if (challenge === data.token) {
                HBS.user = user.id;
                HBS.admin = user.admin;

                HBS.cache.set(token, true, data.ttl || HBS.config.client.inactive_logoff || 30);

                return true;
            }
        }

        return false;
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
}
