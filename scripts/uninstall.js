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

const Path = require("path");
const File = require("fs-extra");
const Reader = require("readline");
const Process = require("child_process");

module.exports = () => {
    return new Promise(async (resolve) => {
        const root = File.existsSync("/root/") ? "/root/" : "/var/root/";
        const svc = await readLines("/etc/systemd/system/homebridge.service");
        const env = (svc.filter(v => v.trim().startsWith("EnvironmentFile"))[0] || "").replace(/environmentfile/i, "").replace(/=/i, "").trim();
        const user = (svc.filter(v => v.trim().startsWith("User"))[0] || "root").replace(/user/i, "").replace(/=/i, "").trim();
        const args = ((await readLines(env)).filter(v => v.trim().startsWith("HOMEBRIDGE_OPTS"))[0] || "").replace(/homebridge_opts/i, "").replace(/=/i, "").trim().split(" ");

        let storage = "";

        for (let i = 0; i < args.length; i++) {
            if (args[i] === "-U") {
                storage = "#storage_path#";
            } else if (storage === "#storage_path#") {
                storage = args[i];
            }
        }

        if (storage === "" || storage === "#storage_path#") {
            storage = user === "root" ? Path.join(root, ".homebridge") : `/home/${user}/.homebridge`
        }

        const plugins = [];
        const modules = Path.dirname(File.realpathSync(Path.join(__filename, "../../../")));

        if (File.existsSync(storage)) {
            const entries = File.readdirSync(modules).filter(f => File.lstatSync(Path.join(modules, f)).isDirectory());

            for (let i = 0; i < entries.length; i++) {
                const directory = Path.join(modules, entries[i]);
                const filename = Path.join(directory, "/package.json");

                if (File.existsSync(filename)) {
                    const item = JSON.parse(File.readFileSync(filename));

                    if (Array.isArray(item.keywords) && item.keywords.indexOf("homebridge-plugin") >= 0) {
                        plugins.push(item.name);
                    }
                }
            }
        }

        console.log("");
        console.log("Removing the HOOBS/Homebridge Switch Capabilities");

        const known = [
            "auth.json",
            "config.json",
            "layout.json"
        ];

        console.log("Removing Configuration Files");

        if (File.existsSync(Path.join(storage, "config.json"))) {
            File.unlinkSync(Path.join(storage, "config.json"));
        }

        if (File.existsSync(Path.join(storage, "auth.json"))) {
            File.unlinkSync(Path.join(storage, "auth.json"));
        }

        if (File.existsSync(Path.join(storage, "accessories/uiAccessoriesLayout.json"))) {
            File.unlinkSync(Path.join(storage, "accessories/uiAccessoriesLayout.json"));
        }

        console.log("Removing Homebridge Accessory Cache");

        if (File.existsSync(Path.join(storage, "accessories"))) {
            File.removeSync(Path.join(storage, "accessories"));
        }

        if (File.existsSync(Path.join(storage, "persist"))) {
            File.removeSync(Path.join(storage, "persist"));
        }

        console.log("Removing Unmanaged Files");

        if (File.existsSync(storage)) {
            const files = File.readdirSync(storage).filter(f => File.lstatSync(Path.join(storage, f)).isFile() && known.indexOf(f) === -1);

            for (let i = 0; i < files.length; i++) {
                File.unlinkSync(Path.join(storage, files[i]));
            }
        }

        console.log("Removing Services - This May Take Some Time");

        if (File.existsSync("/etc/systemd/system/multi-user.target.wants/homebridge-config-ui-x.service")) {
            Process.execSync("systemctl disable homebridge-config-ui-x.service");
            Process.execSync("systemctl stop homebridge-config-ui-x.service");
        }

        if (File.existsSync("/etc/systemd/system/homebridge-config-ui-x.service")) {
            File.unlinkSync("/etc/systemd/system/homebridge-config-ui-x.service");
        }

        if (File.existsSync("/etc/systemd/system/multi-user.target.wants/homebridge.service")) {
            Process.execSync("systemctl disable homebridge.service");
            Process.execSync("systemctl stop homebridge.service");
        }

        if (File.existsSync("/etc/systemd/system/homebridge.service")) {
            File.unlinkSync("/etc/systemd/system/homebridge.service");
        }

        console.log("Removing Enviornment File");

        if (File.existsSync(env)) {
            File.unlinkSync(env);
        }

        if (File.existsSync(storage)) {
            Process.execSync(`rm -fR ${storage}`);
        }

        for (let i = 0; i < plugins.length; i++) {
            await npmUnnstall(plugins[i]);
        }

        console.log("Starting HOOBS");

        if (!File.existsSync("/etc/systemd/system/multi-user.target.wants/hoobs.service")) {
            Process.execSync("systemctl enable hoobs.service");
        }

        Process.execSync("systemctl start hoobs.service");

        console.log("");

        resolve();
    });
};

const npmUnnstall = function (name) {
    return new Promise((resolve) => {
        console.log(`Removing Plugin "${name}"`);

        const proc = Process.spawn("npm", [
            "uninstall",
            "-g",
            name
        ]);

        proc.on("close", () => {
            resolve();
        });
    });
};

const readLines = function (filename) {
    return new Promise((resolve) => {
        const results = [];

        if (filename && filename !== "" && File.existsSync(filename)) {
            const reader = Reader.createInterface({
                input: File.createReadStream(filename),
                crlfDelay: Infinity
            });

            reader.on("line", (line) => {
                results.push(line);
            });

            reader.on("close", () => {
                resolve(results);
            });
        } else {
            resolve(results);
        }
    });
};
