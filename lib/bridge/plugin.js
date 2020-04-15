/**************************************************************************************************
 * hoobs-core / homebridge                                                                        *
 * Copyright (C) 2020 Homebridge                                                                  *
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

const path = require("path");
const fs = require("fs");
const log = require("./logger")._system;

module.exports = {
    Plugin: Plugin
}

function Plugin(pluginPath, pluginName) {
    this.pluginPath = pluginPath;
    this.pluginName = pluginName;
    this.initializer;
}

Plugin.prototype.name = function () {
    return this.pluginName.charAt(0) === "@" ? this.pluginName : path.basename(this.pluginPath);
}

Plugin.prototype.load = function (options) {
    options = options || {};

    if (!fs.existsSync(this.pluginPath)) {
        throw new Error(`Plugin "${this.pluginPath}" was not found.`);
    }

    const pjson = Plugin.loadPackageJSON(this.pluginPath);
    const pluginModules = require(path.join(this.pluginPath, pjson.main || "./index.js"));

    if (typeof pluginModules === "function") {
        this.initializer = pluginModules;
    } else if (pluginModules && typeof pluginModules.default === "function") {
        this.initializer = pluginModules.default;
    } else {
        throw new Error(`Plugin "${this.pluginPath}" does not export a initializer function from main.`);
    }
}

Plugin.loadPackageJSON = function (pluginPath) {
    const pjsonPath = path.join(pluginPath, "package.json");

    let pjson = null;

    if (!fs.existsSync(pjsonPath)) {
        throw new Error(`Plugin "${pluginPath}" does not contain a package.json.`);
    }

    try {
        pjson = JSON.parse(fs.readFileSync(pjsonPath));
    } catch (err) {
        throw new Error(`Plugin "${pluginPath}" contains an invalid package.json.`);
    }

    if (!(pjson.keywords && (pjson.keywords.indexOf("hoobs-plugin") >= 0 || pjson.keywords.indexOf("homebridge-plugin") >= 0))) {
        throw new Error(`Plugin "${pluginPath}" package.json does not contain the keyword "hoobs-plugin" or "homebridge-plugin".`);
    }

    return pjson;
}

Plugin.paths = [];

Plugin.addPluginPath = function (pluginPath) {
    if (fs.existsSync(pluginPath)) {
        Plugin.paths.push(pluginPath);
    }
};

Plugin.installed = function () {
    const plugins = [];
    const pluginsByName = {};
    const searchedPaths = {};

    for (let index in Plugin.paths) {
        const requirePath = Plugin.paths[index];

        if (searchedPaths[requirePath]) {
            continue;
        }

        searchedPaths[requirePath] = true;

        if (!fs.existsSync(requirePath)) {
            continue;
        }

        let names = fs.readdirSync(requirePath);

        for (let index3 in names) {
            if (names[index3].charAt(0) === "@" && fs.statSync(path.join(requirePath, names[index3])).isDirectory()) {
                const scopedNames = fs.readdirSync(path.join(requirePath, names[index3]));

                scopedNames.forEach(function (name) {
                    names.push(path.join(names[index3], name))

                    return;
                });
            }
        }

        if (fs.existsSync(path.join(requirePath, "package.json"))) {
            names = [""];
        }

        for (let index2 in names) {
            let name = names[index2];

            const pluginPath = path.join(requirePath, name);

            try {
                if (!fs.statSync(pluginPath).isDirectory()) continue;
            } catch (e) {
                continue;
            }

            let pjson = null;

            try {
                pjson = Plugin.loadPackageJSON(pluginPath);
            } catch (err) {
                continue;
            }

            if (!name) {
                name = pjson.name;
            }

            name = (name || "").split("/").pop();

            if (!pluginsByName[name]) {
                pluginsByName[name] = pluginPath;

                plugins.push(new Plugin(pluginPath, name));
            } else {
                log.warn(`Skipping plugin found at "${pluginPath}" since we already loaded the same plugin from "${pluginsByName[name]}".`);
            }
        }
    }

    return plugins;
}
