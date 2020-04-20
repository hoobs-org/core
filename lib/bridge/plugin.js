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

const { _system } = require("./logger");
const { basename, join } = require("path");
const { existsSync, readFileSync, readdirSync, statSync } = require("fs-extra");

const paths = [];

module.exports = class Plugin {
    constructor(pluginPath, pluginName) {
        this.pluginPath = pluginPath;
        this.pluginName = pluginName;
        this.initializer;
    }
    
    name() {
        return this.pluginName.charAt(0) === "@" ? this.pluginName : basename(this.pluginPath);
    }
    
    load(options) {
        options = options || {};
    
        if (!existsSync(this.pluginPath)) {
            throw new Error(`Plugin "${this.pluginPath}" was not found.`);
        }
    
        const pjson = Plugin.loadPackageJSON(this.pluginPath);
        const pluginModules = require(join(this.pluginPath, pjson.main || "./index.js"));
    
        if (typeof pluginModules === "function") {
            this.initializer = pluginModules;
        } else if (pluginModules && typeof pluginModules.default === "function") {
            this.initializer = pluginModules.default;
        } else {
            throw new Error(`Plugin "${this.pluginPath}" does not export a initializer function from main.`);
        }
    }
    
    static loadPackageJSON = function (pluginPath) {
        const pjsonPath = join(pluginPath, "package.json");
    
        let pjson = null;
    
        if (!existsSync(pjsonPath)) {
            throw new Error(`Plugin "${pluginPath}" does not contain a package.json.`);
        }
    
        try {
            pjson = JSON.parse(readFileSync(pjsonPath));
        } catch (err) {
            throw new Error(`Plugin "${pluginPath}" contains an invalid package.json.`);
        }
    
        if (!(pjson.keywords && (pjson.keywords.indexOf("hoobs-plugin") >= 0 || pjson.keywords.indexOf("homebridge-plugin") >= 0))) {
            throw new Error(`Plugin "${pluginPath}" package.json does not contain the keyword "hoobs-plugin" or "homebridge-plugin".`);
        }
    
        return pjson;
    }
    
    static addPluginPath = function (pluginPath) {
        if (existsSync(pluginPath)) {
            paths.push(pluginPath);
        }
    };
    
    static installed = function () {
        const plugins = [];
        const pluginsByName = {};
        const searchedPaths = {};
    
        for (let index in paths) {
            const requirePath = paths[index];
    
            if (searchedPaths[requirePath]) {
                continue;
            }
    
            searchedPaths[requirePath] = true;
    
            if (!existsSync(requirePath)) {
                continue;
            }
    
            let names = readdirSync(requirePath);
    
            for (let index3 in names) {
                if (names[index3].charAt(0) === "@" && statSync(join(requirePath, names[index3])).isDirectory()) {
                    readdirSync(join(requirePath, names[index3])).forEach(function (name) {
                        names.push(join(names[index3], name))
    
                        return;
                    });
                }
            }
    
            if (existsSync(join(requirePath, "package.json"))) {
                names = [""];
            }
    
            for (let index2 in names) {
                let name = names[index2];
    
                const pluginPath = join(requirePath, name);
    
                try {
                    if (!statSync(pluginPath).isDirectory()) continue;
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
                    _system.warn(`Skipping plugin found at "${pluginPath}" since we already loaded the same plugin from "${pluginsByName[name]}".`);
                }
            }
        }
    
        return plugins;
    }
}
