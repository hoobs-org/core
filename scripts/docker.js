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

const { dirname, join } = require("path");
const { execSync } = require("child_process");

const storage = "/hoobs";

module.exports = (reload) => {
    const applicaiton = join(dirname(File.realpathSync(__filename)), "../");
    const installed = tryParseFile(join(applicaiton, "package.json"));

    if (!installed) {
        throw new Error("HOOBS Installation is Corrupt. Please Re-Install HOOBS.");
    }

    if (!File.existsSync(storage)) {
        File.mkdirSync(storage);
    }

    const executing = tryParseFile(join(storage, "package.json"), {});

    if (!executing || !(checksum(executing, installed))) {
        if (!preparePackage(executing, installed)) {
            console.error("---------------------------------------------------------");
            console.error("There are configured plugins that are not installed.");
            console.error("Please edit your config.json file and remove the missing");
            console.error("plugin configurations, and remove the plugin from the");
            console.error("plugins array.");
            console.error("---------------------------------------------------------");
        }

        if (!reload) {
            require(join(applicaiton, "server", "cli"))(true);
        }
    } else {
        if (!reload) {
            require(join(applicaiton, "server", "cli"))(true);
        }
    }
};

const tryParseFile = function(filename, replacement) {
    replacement = replacement || null;

    try {
        return JSON.parse(File.readFileSync(filename));
    } catch {
        return replacement;
    }
};

const preparePackage = function (executing, installed) {
    let success = true;
    let install = false;

    if (File.existsSync(join(storage, "node_modules", "@hoobs", "hoobs"))) {
        install = true;
    }

    if (File.existsSync(join(storage, "dist"))) {
        File.removeSync(join(storage, "dist"));
    }

    if (File.existsSync(join(storage, "node_modules", "homebridge"))) {
        try {
            File.unlinkSync(join(storage, "node_modules", "homebridge"));
        } catch (_error) {
            File.removeSync(join(storage, "node_modules", "homebridge"));
        }
    }

    if (File.existsSync(join(storage, "node_modules", "hap-nodejs"))) {
        try {
            File.unlinkSync(join(storage, "node_modules", "hap-nodejs"));
        } catch (_error) {
            File.removeSync(join(storage, "node_modules", "hap-nodejs"));
        }
    }

    if (installed.dependencies) {
        installed.dependencies = {};
    }

    if (executing && executing.dependencies) {
        const orphaned = [];
        const current = tryParseFile(join(storage, "etc", "config.json"), null);
        const plugins = (current || {}).plugins || [];
        const keys = Object.keys(executing.dependencies);

        for (let i = 0; i < plugins.length; i++) {
            let plugin = null;
            let name = plugins[i];

            if (executing.dependencies[name]) {
                plugin = name;
            } else {
                plugin = (keys.filter(d => d.startsWith("@") && d.endsWith(`/${name}`)) || [null])[0];
            }

            if (plugin && executing.dependencies[plugin]) {
                installed.dependencies[plugin] = executing.dependencies[plugin];
            } else if (current && (current.accessories || []).findIndex(a => (a.plugin_map || {}).plugin_name === name) === -1 && (current.platforms || []).findIndex(p => (p.plugin_map || {}).plugin_name === name) === -1) {
                orphaned.push(name);
            } else {
                console.error(`Plugin "${name}" is missing`);

                success = false;
            }

            if (plugin && !File.existsSync(join(storage, "node_modules", "node_modules", plugin))) {
                install = true;
            }
        }

        if (success && orphaned.length > 0) {
            for (let i = 0; i < orphaned.length; i++) {
                const index = (current.plugins || []).indexOf(orphaned[i]);

                if (index > -1) {
                    current.plugins.splice(index, 1);
                }
            }

            File.unlinkSync(join(storage, "etc", "config.json"));
            File.appendFileSync(join(storage, "etc", "config.json"), JSON.stringify(current, null, 4));
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

        if (File.existsSync(join(storage, "package.json"))) {
            File.unlinkSync(join(storage, "package.json"));
        }

        File.appendFileSync(join(storage, "package.json"), JSON.stringify(installed, null, 4));

        if (install) {
            execSync("npm install --unsafe-perm --prefer-offline --no-audit --progress=true", {
                cwd: storage,
                stdio: ["inherit", "inherit", "inherit"]
            });
        }
    }

    return success;
};

const checksum = function(executing, installed) {
    if (File.existsSync(join(storage, "backups"))) {
        File.removeSync(join(storage, "backups"));
    }

    File.ensureDirSync(join(storage, "backups"));

    if (executing.version !== installed.version) {
        return false;
    }

    if (File.existsSync(join(storage, "dist"))) {
        return false;
    }

    if (File.existsSync(join(storage, "node_modules", "@hoobs", "hoobs"))) {
        return false;
    }

    return true;
};
