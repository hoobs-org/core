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

const Plugin = require("./plugin");

const { internal } = require("./logger");
const { join } = require("path");
const { existsSync, readJsonSync } = require("fs-extra");

module.exports = class Plugins {
    constructor(path, config, api) {
        this.path = path;
        this.config = config;
        this.api = api;

        this.plugins = {};
        this.whitelist = {};
        this.installed = [];
        this.loaded = [];

        this.api.on("register_accessory", this.registerAccessory.bind(this));
        this.api.on("register_platform", this.registerPlatform.bind(this));

        this.active();
        this.scan();
    }

    static read(path) {    
        let pjson = null;
    
        if (!existsSync(join(path, "package.json"))) {
            throw new Error(`Plugin "${path}" does not contain a package.json.`);
        }
    
        try {
            pjson = readJsonSync(join(path, "package.json"));
        } catch (err) {
            throw new Error(`Plugin "${path}" contains an invalid package.json.`);
        }
    
        if (!(pjson.keywords && (pjson.keywords.indexOf("hoobs-plugin") >= 0 || pjson.keywords.indexOf("homebridge-plugin") >= 0))) {
            throw new Error(`Plugin "${path}" package.json does not contain the keyword "hoobs-plugin" or "homebridge-plugin".`);
        }
    
        return pjson;
    }

    getPlugin(identifier) {
        internal.debug(`Lookup identifier "${identifier}"`);

        return this.loaded.find((p) => p.hasIdentifier(identifier));
    }

    getDynamicPlatform(identifier) {
        internal.debug(`Lookup dynamic identifier "${identifier}"`);

        return this.loaded.find((p) => p.getInitilizer("dynamic", identifier));
    }

    registerAccessory(name, constructor, _identifier) {
        if (this.working) {    
            this.working.registerAccessory(name, constructor);
        }
    }

    registerPlatform(name, constructor, _identifier) {
        if (this.working) {        
            this.working.registerPlatform(name, constructor);
        }
    }

    active() {
        if (this.config.plugins) {
            for (let i = 0; i < this.config.plugins.length; i++) {
                this.whitelist[this.config.plugins[i]] = true;
            }
        }
    }

    load() {
        for (let i = 0; i < this.installed.length; i++) {
            this.working = this.installed[i];

            internal.debug(`Working plugin "${this.working.name}"`);

            if (this.whitelist[this.working.name] !== true) {
                continue;
            }

            try {
                this.working.load(this.api);
                this.loaded.push(this.working);
            } catch (error) {
                internal.error(`Error loading plugin "${this.working.name}"`);
                internal.error(error.stack);
            }
        }
    }

    scan() {
        const dependencies = [];

        try {
            dependencies.push(...Object.keys((readJsonSync(join(this.path, "package.json")) || {}).dependencies || {}));
        } catch (_error) {
            internal.warn(`Missing "${join(this.path, "package.json")}" file`);
        }

        for (let i = 0; i < dependencies.length; i++) {
            const path = join(this.path, "node_modules", dependencies[i]);

            let pjson = null;
    
            try {
                pjson = Plugins.read(path);
            } catch (error) {
                internal.error(error.message);

                continue;
            }

            this.installed.push(new Plugin(path, dependencies[i], pjson));
        }
    }
}
