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

const _ = require("lodash");

const Ora = require("ora");
const File = require("fs-extra");

const { dirname, join } = require("path");
const { execSync } = require("child_process");
const { hashElement } = require("folder-hash");

class Throbber {
    constructor(debug) {
        this.debug = debug;
        this.throbber = null;
    }

    sleep(time) {
        return new Promise((resolve) => {
            setTimeout(resolve, time);
        })
    }

    async throb(message) {
        if (!this.debug) {
            message = message || "";

            this.throbber = Ora(message).start();
            this.throbber.color = "yellow";

            await this.sleep(100);
        }
    }

    async update(message, time) {
        if (message && message !== "") {
            if (this.debug) {
                console.log(message);
            } else {
                const data = message.split(":");

                message = data[0];
                data.shift();

                if (data.length > 0) {
                    message += `: ${data.map(v => v.trim().slice(-80)).join(": ")}`;
                }

                this.throbber.text = message;
                this.throbber.color = "yellow";

                await this.sleep(time);
            }
        }
    };

    async stop(message) {
        if (!this.debug) {
            await this.update(message, 10);

            this.throbber.stop();
        }
    };
}

module.exports = (debug) => {
    (async () => {
        const throbber = new Throbber(debug);

        const applicaiton = join(dirname(File.realpathSync(__filename)), "../");
        const installed = tryParseFile(join(applicaiton, "package.json"));

        if (!installed) {
            throw new Error("HOOBS Installation is Corrupt. Please Re-Install HOOBS.");
        }

        if (!File.existsSync("/hoobs")) {
            File.mkdirSync("/hoobs");
        }

        const executing = tryParseFile("/hoobs/package.json");

        console.log("");

        if (!executing || installed.version !== executing.version || !(await checksum(applicaiton))) {
            let success = true;
            let stop = false;

            if (await preparePackage(executing, installed, throbber)) {
                await setupUserMode(applicaiton, throbber);
            } else {
                success = false;

                if (!File.existsSync("/hoobs/dist")) {
                    stop = true;

                    console.log("---------------------------------------------------------");
                    console.log("There are configured plugins that are not installed.");
                    console.log("Please edit your config.json file and remove the missing");
                    console.log("plugin configurations, and remove the plugin from the");
                    console.log("plugins array.");
                    console.log("---------------------------------------------------------");
                    console.log("");
                } else {
                    console.log("---------------------------------------------------------");
                    console.log("There are configured plugins that are not installed.");
                    console.log("Please edit your config.json file and remove the missing");
                    console.log("plugin configurations, and remove the plugin from the");
                    console.log("plugins array.");
                    console.log("---------------------------------------------------------");
                    console.log("Loading previous version");
                    console.log("---------------------------------------------------------");
                }
            }

            if (success) {
                await throbber.throb("Application");

                if (File.existsSync("/hoobsdist")) {
                    File.removeSync("/hoobs/dist");
                }

                await throbber.update("Application: Update", 0);

                File.copySync(join(applicaiton, "dist"), "/hoobs/dist");

                await throbber.stop("Application");

                if (!(await checksum(applicaiton))) {
                    throw new Error("Unable to start user mode");
                }

                require(join(applicaiton, "lib/cli"))(true);
            } else if (!stop) {
                require(join(applicaiton, "lib/cli"))(true);
            }
        } else {
            require(join(applicaiton, "lib/cli"))(true);
        }
    })();
};

const tryParseFile = function(filename, replacement) {
    replacement = replacement || null;

    try {
        return JSON.parse(File.readFileSync(filename));
    } catch {
        return replacement;
    }
};

const preparePackage = async function (executing, installed, throbber) {
    await throbber.throb("Plugins");

    let success = true;
    let fix = false;

    if (File.existsSync("/hoobs/node_modules/@hoobs/hoobs")) {
        fix = true;
    }

    if (installed.dependencies) {
        installed.dependencies = {};
    }

    if (executing && executing.dependencies) {
        await throbber.update("Plugins: Reading existing plugins", 250);

        const current = tryParseFile("/hoobs/etc/config.json", null);

        const deps = (current || {}).plugins || [];
        const keys = Object.keys(executing.dependencies);
        const orphaned = [];

        for (let i = 0; i < deps.length; i++) {
            await throbber.update(`Plugins: ${deps[i]}`, 500);

            let dep = null;
            let name = deps[i];

            if (executing.dependencies[name]) {
                dep = name;
            } else {
                dep = (keys.filter(d => d.startsWith("@") && d.endsWith(`/${name}`)) || [null])[0];
            }

            if (dep && executing.dependencies[dep]) {
                installed.dependencies[dep] = executing.dependencies[dep];
            } else if (current && (current.accessories || []).findIndex(a => (a.plugin_map || {}).plugin_name === name) === -1 && (current.platforms || []).findIndex(p => (p.plugin_map || {}).plugin_name === name) === -1) {
                orphaned.push(name);
            } else {
                await throbber.stop("Plugins");

                console.log(`Plugin "${name}" is missing`);

                await throbber.throb("Plugins");

                success = false;
            }

            if (dep && !File.existsSync(join("/hoobs/node_modules/node_modules", dep))) {
                fix = true;
            }
        }

        if (success && orphaned.length > 0) {
            for (let i = 0; i < orphaned.length; i++) {
                const index = (current.plugins || []).indexOf(orphaned[i]);

                if (index > -1) {
                    current.plugins.splice(index, 1);
                }
            }

            File.unlinkSync("/hoobs/etc/config.json");
            File.appendFileSync("/hoobs/etc/config.json", JSON.stringify(current, null, 4));
        }
    }

    if (success) {
        if (installed.devDependencies) {
            delete installed.devDependencies;
        }

        if (installed.scripts) {
            delete installed.scripts;
        }

        if (installed.bin) {
            delete installed.bin;
        }

        await throbber.update("Plugins: Writing package file", 250);

        if (File.existsSync("/hoobs/package.json")) {
            File.unlinkSync("/hoobs/package.json");
        }

        File.appendFileSync("/hoobs/package.json", JSON.stringify(installed, null, 4));

        if (fix) {
            await throbber.update("Plugins: Installing missing plugins", 100);

            execSync("npm install --prefer-offline --no-audit --progress=true", {
                cwd: root,
                stdio: ["ignore", "ignore", "ignore"]
            });
        }
    }

    await throbber.stop("Plugins");

    return success;
};

const setupUserMode = function (applicaiton, throbber) {
    return new Promise(async (resolve) => {
        await throbber.throb("Modules");

        if (File.existsSync("/hoobs/dist")) {
            File.removeSync("/hoobs/dist");
        }

        File.copySync(join(applicaiton, "default.json"), "/hoobs/default.json");

        await throbber.stop("Modules");


        resolve();
    });
};

const checksum = async function(applicaiton) {
    execSync(`rm -f ${join(root, "restore-*.zip")}`);
    execSync(`rm -f ${join(root, "dist", "backup-*.hbf")}`);
    execSync(`rm -f ${join(root, "dist", "backup-*.hbfx")}`);

    if (!File.existsSync("/hoobs/dist")) {
        return false;
    }

    const options = {
        files: {
            exclude: [
                ".DS_Store"
            ]
        }
    };

    if ((await hashElement("/hoobs/dist", options)).hash.toString() !== (await hashElement(join(applicaiton, "dist"), options)).hash.toString()) {
        return false;
    }

    return true;
};
