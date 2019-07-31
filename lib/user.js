const File = require("fs-extra");
const Crypto = require("crypto");
const Server = require("./server");

module.exports = class User {
    static async generateToken(id) {
        const user = global.users.filter(u => u.id === id)[0];
        const key = await User.generateSalt();

        if (user) {
            return Buffer.from(JSON.stringify({
                key,
                id: user.id,
                name: user.name,
                username: user.username,
                admin: user.admin,
                token: await User.hashValue(user.password, key)
            })).toString("base64");
        }

        return false;
    }

    static get(username) {
        return global.users.filter(u => u.username === username)[0];
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

        user.password = await User.hashValue(user.password, user.salt);

        if (global.users.length > 0) {
            user.id = global.users[global.users.length - 1].id + 1;
        }

        global.users.push(user);

        if (File.existsSync(Server.paths.config.access)) {
            File.unlinkSync(Server.paths.config.access);
        }

        File.appendFileSync(Server.paths.config.access, JSON.stringify(global.users, null, 4));

        return user;
    }

    static async update(id, name, username, password, admin) {
        const index = global.users.findIndex(u => u.id === id);

        if (index >= 0) {
            global.users[index].name = name;
            global.users[index].username = username;
            global.users[index].admin = admin;

            if (password) {
                global.users[index].password = await User.hashValue(password, global.users[index].salt);
            }

            if (File.existsSync(Server.paths.config.access)) {
                File.unlinkSync(Server.paths.config.access);
            }
    
            File.appendFileSync(Server.paths.config.access, JSON.stringify(global.users, null, 4));
    
            return global.users[index];
        }

        return false;
    }

    static delete(id) {
        const index = global.users.findIndex(u => u.id === id);

        if (index >= 0) {
            global.users.splice(index, 1);

            if (File.existsSync(Server.paths.config.access)) {
                File.unlinkSync(Server.paths.config.access);
            }
    
            File.appendFileSync(Server.paths.config.access, JSON.stringify(global.users, null, 4));

            return true;
        }

        return false;
    }

    static async validateToken(token) {
        if (!token || token === "") {
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
