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
const Crypto = require("crypto");
const Prompt = require("prompts");

const { dirname, join } = require("path");

module.exports = () => {
    const root = dirname(File.realpathSync(__filename));

    const questions = [
        {
            type: "text",
            name: "name",
            message: "Choose your HOOBS cluster account name",
            validate: (value) => {
                if (!value || value === "") {
                    return "an account name is required"
                }

                return true;
            }
        },
        {
            type: "text",
            name: "username",
            message: "Choose your HOOBS cluster username",
            validate: (value) => {
                if (!value || value === "") {
                    return "a username is required"
                }

                return true;
            }
        },
        {
            type: "password",
            name: "password",
            message: "Choose your HOOBS cluster password",
            validate: (value) => {
                if (!value || value === "") {
                    return "a password is required"
                }

                return true;
            }
        },
        {
            type: "password",
            name: "confirm",
            message: "Confirm your password",
            validate: (value) => {
                if (!value || value === "") {
                    return "a password is required"
                }

                return true;
            }
        }
    ];

    Prompt(questions).then(async (result) => {
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

            await (require(join(root, "./prerequisites")))();
            await (require(join(root, "./systemd")))(true, "client");
            await (require(join(root, "./reboot")))(false, "hoobs.service");
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
