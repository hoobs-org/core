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

const { Accessory } = require("hap-nodejs");
const { EventEmitter } = require("events").EventEmitter;

module.exports = class Platform extends EventEmitter {
    constructor(name, uuid, category) {
        super();

        let cached = null;

        if (name instanceof Accessory) {
            cached = name;
            category = uuid;
            uuid = cached.UUID;
            name = cached.displayName;
        }

        this.associatedHAPAccessory = cached || new Accessory(name, uuid);

        if (category) {
            this.associatedHAPAccessory.category = category;
        }

        this.displayName = this.associatedHAPAccessory.displayName;
        this.UUID = this.associatedHAPAccessory.UUID;

        this.category = category || Accessory.Categories.OTHER;
        this.services = this.associatedHAPAccessory.services;
        this.reachable = false;
        this.context = {};

        this.associatedPlugin;
        this.associatedPlatform;

        this.associatedHAPAccessory.on("identify", (paired, callback) => {
            this.emit("identify", paired, callback);

            callback();
        });
    }

    addService(service, ...args) {
        return this.associatedHAPAccessory.addService(service, ...args);
    }

    removeService(service) {
        this.associatedHAPAccessory.removeService(service);
    }

    getService(name) {
        for (let i = 0; i < this.services.length; i++) {
            if (typeof name === "string" && (this.services[i].displayName === name || this.services[i].name === name)) {
                return this.services[i];
            } else if (typeof name === "function" && ((this.services[i] instanceof name) || (name.UUID === this.services[i].UUID))) {
                return this.services[i];
            }
        }
    }

    getServiceByUUIDAndSubType(uuid, subType) {
        return this.getServiceById(uuid, subType);
    }

    getServiceById(uuid, subType) {
        return this.associatedHAPAccessory.getServiceById(uuid, subType);
    }

    updateReachability(reachable) {
        this.reachable = reachable;
        this.associatedHAPAccessory.updateReachability(reachable);
    }

    configureCameraSource(cameraSource) {
        this.cameraSource = cameraSource;
        this.associatedHAPAccessory.configureCameraSource(this.cameraSource);
    }

    static serialize(accessory) {
        return {
            plugin: accessory.associatedPlugin,
            platform: accessory.associatedPlatform,
            context: accessory.context,
            ...Accessory.serialize(accessory.associatedHAPAccessory),
        };
    }

    static deserialize(json) {
        const platform = new Platform(Accessory.deserialize(json), json.category);

        platform.associatedPlugin = json.plugin;
        platform.associatedPlatform = json.platform;
        platform.context = json.context;

        return platform;
    }
}
