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

const HAP = require("hap-nodejs");
const User = require("./user");
const Version = require("./version");
const Platform = require("./platform");
const LegacyTypes = require("hap-nodejs/accessories/types.js");

const { EventEmitter } = require("events");

const log = require("./logger")._system;

module.exports = class API extends EventEmitter {
    constructor() {
        super();

        this._accessories = {};
        this._platforms = {};

        this._configurableAccessories = {};
        this._dynamicPlatforms = {};

        this.version = 2.4;
        this.serverVersion = Version;

        this.user = User;
        this.hap = HAP;

        this.hapLegacyTypes = LegacyTypes;

        this.platformAccessory = Platform;
    }

    accessory(name) {
        if (name.indexOf(".") === -1) {
            const found = [];

            for (let fullName in this._accessories) {
                if (fullName.split(".")[1] === name) {
                    found.push(fullName);
                }
            }

            if (found.length === 1) {
                return this._accessories[found[0]];
            } else if (found.length > 1) {
                throw new Error(`The requested accessory "${name}" has been registered multiple times.`);
            } else {
                throw new Error(`The requested accessory "${name}" was not registered by any plugin.`);
            }
        } else {
            if (!this._accessories[name]) {
                throw new Error(`The requested accessory "${name}" was not registered by any plugin.`);
            }

            return this._accessories[name];
        }
    }

    registerAccessory(pluginName, accessoryName, constructor, configurationRequestHandler) {
        if (this._accessories[`${pluginName}.${accessoryName}`]) {
            throw new Error(`Attempting to register an accessory "${pluginName}.${accessoryName}" which has already been registered.`);
        }
    
        log.info(`Registering accessory "${pluginName}.${accessoryName}"`);
    
        this._accessories[`${pluginName}.${accessoryName}`] = constructor;
    
        if (configurationRequestHandler) {
            this._configurableAccessories[`${pluginName}.${accessoryName}`] = configurationRequestHandler;
        }
    }
    
    publishCameraAccessories(pluginName, accessories) {
        for (let index in accessories) {
            if (!(accessories[index] instanceof Platform)) {
                throw new Error(`"${pluginName}" attempt to register an accessory that isn't platform accessory.`);
            }
    
            accessories[index]._associatedPlugin = pluginName;
        }
    
        this.emit("publishExternalAccessories", API.seralizeAccessories(accessories));
    }
    
    publishExternalAccessories(pluginName, accessories) {
        for (let index in accessories) {
            if (!(accessories[index] instanceof Platform)) {
                throw new Error(`"${pluginName}" attempt to register an accessory that isn't platform accessory.`);
            }
    
            accessories[index]._associatedPlugin = pluginName;
        }
    
        this.emit("publishExternalAccessories", API.seralizeAccessories(accessories));
    }
    
    platform(name) {
        if (name.indexOf(".") === -1) {
            const found = [];
    
            for (let fullName in this._platforms) {
                if (fullName.split(".")[1] === name) {
                    found.push(fullName);
                }
            }
    
            if (found.length === 1) {
                return this._platforms[found[0]];
            } else if (found.length > 1) {
                throw new Error(`The requested platform "${name}" has been registered multiple times.`);
            } else {
                throw new Error(`The requested platform "${name}" was not registered by any plugin.`);
            }
        } else {
            if (!this._platforms[name]) {
                throw new Error(`The requested platform "${name}" was not registered by any plugin.`);
            }
    
            return this._platforms[name];
        }
    }
    
    registerPlatform(pluginName, platformName, constructor, dynamic) {
        if (this._platforms[`${pluginName}.${platformName}`]) {
            throw new Error(`Attempting to register a platform "${pluginName}.${platformName}" which has already been registered!`);
        }
    
        log.info(`Registering platform "${pluginName}.${platformName}"`);
    
        this._platforms[`${pluginName}.${platformName}`] = constructor;
    
        if (dynamic) {
            this._dynamicPlatforms[`${pluginName}.${platformName}`] = constructor;
        }
    }
    
    registerPlatformAccessories(pluginName, platformName, accessories) {
        for (let index in accessories) {
            if (!(accessories[index] instanceof Platform)) {
                throw new Error(`"${pluginName} - ${platformName}" attempt to register an accessory that isn't platform accessory.`);
            }
    
            accessories[index]._associatedPlugin = pluginName;
            accessories[index]._associatedPlatform = platformName;
        }
    
        this.emit("registerPlatformAccessories", API.seralizeAccessories(accessories));
    }
    
    updatePlatformAccessories(accessories) {
        this.emit("updatePlatformAccessories", API.seralizeAccessories(accessories));
    }
    
    unregisterPlatformAccessories(pluginName, platformName, accessories) {
        for (let index in accessories) {
            if (!(accessories[index] instanceof Platform)) {
                throw new Error(`"${pluginName} - ${platformName}" attempt to unregister an accessory that isn't platform accessory.`);
            }
        }
    
        this.emit("unregisterPlatformAccessories", API.seralizeAccessories(accessories));
    }
    
    static seralizeAccessories(value) {
        const cache = [];
    
        return JSON.parse(JSON.stringify(value, (_key, item) => {
            if (typeof item === "object" && item !== null) {
                if (cache.indexOf(item) !== -1) {
                    return;
                }
    
                cache.push(item);
            }
            return item;
        }));
    }
}
