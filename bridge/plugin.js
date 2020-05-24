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

const { internal } = require("./logger");
const { join } = require("path");
const { existsSync } = require("fs-extra");

module.exports = class Plugin {
    constructor(path, name, pjson) {
        this.path = path;
        this.name = name;
        this.identifiers = [];
        this.main = pjson.main || "./index.js";
        this.version = pjson.version || "0.0.0";

        this.accessories = {};
        this.platforms = {};
        this.dynamic = {};
    }

    toFqpn(identifier) {
        return `${this.name}.${identifier.toString().split(".").pop()}`;
    }

    hasIdentifier(identifier) {
        return this.identifiers.indexOf(this.toFqpn(identifier)) >= 0;
    }

    addIdentifier(identifier) {
        if (!this.hasIdentifier(identifier)) {
            internal.debug(`Registering "${this.toFqpn(identifier)}"`);

            this.identifiers.push(this.toFqpn(identifier));
        }
    }

    getInitilizer(type, identifier) {
        switch (type) {
            case "accessory":
                return this.accessories[this.toFqpn(identifier)];

            case "platform":
                return this.platforms[this.toFqpn(identifier)];

            case "dynamic":
                return (this.dynamic[this.toFqpn(identifier)] || [])[0];
        }

        return null;
    }
    
    load(api) {    
        if (!existsSync(this.path)) {
            internal.error(`Plugin "${this.path}" was not found`);
        } else {
            this.initializer = require(join(this.path, this.main));

            internal.debug(`Loaded plugin "${this.name}"`);

            if (typeof this.initializer === "function") {
                this.initializer(api);
            } else if (this.initializer && typeof this.initializer.default === "function") {
                this.initializer.default(api);
            } else {
                internal.error(`Plugin "${this.path}" does not export a initializer function from main`);
            }
        }
    }

    registerAccessory(identifier, constructor) {
        this.addIdentifier(identifier);
        this.accessories[this.toFqpn(identifier)] = constructor;
    }

    registerPlatform(identifier, constructor) {
        this.addIdentifier(identifier);
        this.platforms[this.toFqpn(identifier)] = constructor;
    }

    assignDynamicPlatform(identifier, platform) {
        this.addIdentifier(identifier);
        this.dynamic[this.toFqpn(identifier)] = platform;
    }
}
