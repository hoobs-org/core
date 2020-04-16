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

const inherits = require("util").inherits;
const EventEmitter = require("events").EventEmitter;
const hap = require("hap-nodejs");
const hapLegacyTypes = require("hap-nodejs/accessories/types.js");
const log = require("./logger")._system;
const User = require("./user").User;
const PlatformAccessory = require("./accessory").PlatformAccessory;
const serverVersion = require("./version");

module.exports = {
    API
}

function API() {
    this._accessories = {};
    this._platforms = {};

    this._configurableAccessories = {};
    this._dynamicPlatforms = {};

    this.version = 2.4;
    this.serverVersion = serverVersion;

    this.user = User;
    this.hap = hap;

    this.hapLegacyTypes = hapLegacyTypes;

    this.platformAccessory = PlatformAccessory;
}

inherits(API, EventEmitter);

API.prototype.accessory = function (name) {
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

API.prototype.registerAccessory = function (pluginName, accessoryName, constructor, configurationRequestHandler) {
    if (this._accessories[`${pluginName}.${accessoryName}`]) {
        throw new Error(`Attempting to register an accessory "${pluginName}.${accessoryName}" which has already been registered.`);
    }

    log.info(`Registering accessory "${pluginName}.${accessoryName}"`);

    this._accessories[`${pluginName}.${accessoryName}`] = constructor;

    if (configurationRequestHandler) {
        this._configurableAccessories[`${pluginName}.${accessoryName}`] = configurationRequestHandler;
    }
}

API.prototype.publishCameraAccessories = function (pluginName, accessories) {
    for (let index in accessories) {
        if (!(accessories[index] instanceof PlatformAccessory)) {
            throw new Error(`"${pluginName}" attempt to register an accessory that isn't PlatformAccessory.`);
        }

        accessories[index]._associatedPlugin = pluginName;
    }

    this.emit("publishExternalAccessories", accessories);
}

API.prototype.publishExternalAccessories = function (pluginName, accessories) {
    for (let index in accessories) {
        if (!(accessories[index] instanceof PlatformAccessory)) {
            throw new Error(`"${pluginName}" attempt to register an accessory that isn't PlatformAccessory.`);
        }

        accessories[index]._associatedPlugin = pluginName;
    }

    this.emit("publishExternalAccessories", accessories);
}

API.prototype.platform = function (name) {
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

API.prototype.registerPlatform = function (pluginName, platformName, constructor, dynamic) {
    if (this._platforms[`${pluginName}.${platformName}`]) {
        throw new Error(`Attempting to register a platform "${pluginName}.${platformName}" which has already been registered!`);
    }

    log.info(`Registering platform "${pluginName}.${platformName}"`);

    this._platforms[`${pluginName}.${platformName}`] = constructor;

    if (dynamic) {
        this._dynamicPlatforms[`${pluginName}.${platformName}`] = constructor;
    }
}

API.prototype.registerPlatformAccessories = function (pluginName, platformName, accessories) {
    for (let index in accessories) {
        if (!(accessories[index] instanceof PlatformAccessory)) {
            throw new Error(`"${pluginName} - ${platformName}" attempt to register an accessory that isn't PlatformAccessory.`);
        }

        accessories[index]._associatedPlugin = pluginName;
        accessories[index]._associatedPlatform = platformName;
    }

    this.emit("registerPlatformAccessories", accessories);
}

API.prototype.updatePlatformAccessories = function (accessories) {
    this.emit("updatePlatformAccessories", accessories);
}

API.prototype.unregisterPlatformAccessories = function (pluginName, platformName, accessories) {
    for (let index in accessories) {
        if (!(accessories[index] instanceof PlatformAccessory)) {
            throw new Error(`"${pluginName} - ${platformName}" attempt to unregister an accessory that isn't PlatformAccessory.`);
        }
    }

    this.emit("unregisterPlatformAccessories", accessories);
}
