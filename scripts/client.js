const File = require("fs-extra");
const Crypto = require("crypto");
const Prompt = require("prompt");

const { dirname, join } = require("path");

module.exports = () => {
    const root = dirname(File.realpathSync(__filename));

    const questions = {
        properties: {
            name: {
                description: "Choose your HOOBS cluster account name",
                default: "Administrator",
                message: "Name is required",
                required: true
            },
            username: {
                description: "Choose your HOOBS cluster username",
                default: "admin",
                message: "Username is required",
                required: true
            },
            password: {
                description: "Choose your HOOBS cluster password",
                message: "Password is required",
                required: true,
                hidden: true
            },
            confirm: {
                description: "Confirm your password",
                message: "Password is required",
                required: true,
                hidden: true
            }
        }
    };

    Prompt.start();

    Prompt.get(questions, async (error, result) => {
        if (result.password !== result.confirm) {
            console.log("");
            console.log("Passwords do not match");
            console.log("");

            process.exit();
        }

        if (!error) {
            const user = {
                id: 1,
                name: result.name,
                admin: true,
                username: result.username,
                password: result.password,
                salt: await generateSalt()
            }

            user.password = await hashValue(user.password, user.salt);

            writeJson("access.json", [user]);

            await (require(join(root, "../scripts/prerequisites")))();
            await (require(join(root, "../scripts/nginx")))(true);
            await (require(join(root, "../scripts/systemd")))(true, "client");
            await (require(join(root, "../scripts/reboot")))(false, "hoobs.service");
        }
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

    if (File.existsSync(join("/var/hoobs/.migration/", filename))) {
        File.unlinkSync(join("/var/hoobs/.migration/", filename));
    }

    File.appendFileSync(join("/var/hoobs/.migration/", filename), JSON.stringify(data, null, 4));
    File.chmodSync(join("/var/hoobs/.migration/", filename), 0755);
};

const generateSalt = function() {
    return new Promise((resolve, reject) => {
        Crypto.randomBytes(32, (error, buffer) => {
            if (error) {
                reject(error);
            } else {
                resolve(buffer.toString("hex"));
            }
        });
    });
};

const hashValue = function(value, salt) {
    return new Promise((resolve, reject) => {
        Crypto.pbkdf2(value, salt, 1000, 64, "sha512", (error, key) => {
            if (error) {
                reject(error);
            } else {
                resolve(key.toString("hex"));
            }
        });
    });
};
