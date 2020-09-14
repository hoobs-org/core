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

const HBS = require("../server/instance");
const HAP = require("hap-nodejs");
const User = require("./user");
const Platform = require("./platform");
const LegacyTypes = require("hap-nodejs/dist/accessories/types");

const { internal } = require("./logger");
const { EventEmitter } = require("events");

module.exports = class API extends EventEmitter {
    constructor() {
        super();

        this.platforms = {};

        this.dynamicPlatforms = {};

        this.version = 2.6;
        this.serverVersion = HBS.application.version;

        this.user = User;
        this.hap = HAP;

        this.hapLegacyTypes = LegacyTypes;

        this.platformAccessory = Platform;
    }

    static isDynamicPlatformPlugin(platform) {
        return "configureAccessory" in platform;
    }

    static isStaticPlatformPlugin(platform) {
        return "accessories" in platform;
    }  

    registerAccessory(identifier, name, constructor) {
        if (typeof name === "function") {
            constructor = name;
            name = identifier;
    
            this.emit("register_accessory", name, constructor);
        } else {
            this.emit("register_accessory", name, constructor, identifier);
        }
    }
    
    publishCameraAccessories(name, accessories) {
        this.publishExternalAccessories(name, accessories);
    }
    
    publishExternalAccessories(name, accessories) {
        for (let i = 0; i < accessories.length; i++) {
            if (!(accessories[i] instanceof Platform)) {
                internal.error(`"${name}" attempt to register an accessory that isn't platform accessory.`);
            } else {
                accessories[i].associatedPlugin = name;
            }
        }

        this.emit("publishExternalAccessories", accessories);
    }
    
    registerPlatform(identifier, name, constructor) {
        if (typeof name === "function") {
            constructor = name;
            name = identifier;

            this.emit("register_platform", name, constructor);
        } else {
            this.emit("register_platform", name, constructor, identifier);
        }
    }

    registerPlatformAccessories(name, platform, accessories) {
        for (let index in accessories) {
            if (!(accessories[index] instanceof Platform)) {
                internal.error(`"${name} - ${platform}" attempt to register an accessory that isn't platform accessory.`);
            } else {
                accessories[index].associatedPlugin = name;
                accessories[index].associatedPlatform = platform;
            }    
        }
    
        this.emit("registerPlatformAccessories", accessories);
    }
    
    updatePlatformAccessories(accessories) {
        this.emit("updatePlatformAccessories", accessories);
    }
    
    unregisterPlatformAccessories(_name, _platform, accessories) {    
        this.emit("unregisterPlatformAccessories", accessories);
    }

    static expandUUID(value) {
        value = `00000000${value}`;

        return `${value.substring(value.length - 8, value.length)}-0000-1000-8000-0026BB765291`;
    }
}
