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

const { uuid, Accessory, Service, Characteristic } = require("hap-nodejs");
const { EventEmitter } = require("events").EventEmitter;

module.exports = class Platform extends EventEmitter {
    constructor(displayName, UUID, category, injected) {
        super();

        if (!displayName) {
            throw new Error("Accessories must be created with a non-empty displayName.");
        }

        if (!UUID) {
            throw new Error("Accessories must be created with a valid UUID.");
        }

        if (!uuid.isValid(UUID)) {
            throw new Error(`UUID "${UUID}" is not a valid UUID.`);
        }

        this.associatedHAPAccessory = injected ? injected : new Accessory(displayName, UUID);;

        this.displayName = this.associatedHAPAccessory.displayName;
        this.UUID = this.associatedHAPAccessory.UUID;

        this.category = category || Accessory.Categories.OTHER;
        this.services = this.associatedHAPAccessory.services;
        this.reachable = false;
        this.context = {};

        this.associatedPlugin;
        this.associatedPlatform;

        this.associatedHAPAccessory.on("identify", (paired, callback) => {
            if (this.listeners("identify").length > 0) {
                this.emit("identify", paired, callback);
            } else {
                callback();
            }
        });
    }

    addService(service, ...args) {
        return this.associatedHAPAccessory.addService(service, ...args);
    }

    removeService(service) {
        this.associatedHAPAccessory.removeService(service);
    }

    getService(name) {
        return this.associatedHAPAccessory.getService(name);
    }

    getServiceByUUIDAndSubType(UUID, subType) {
        return this.getServiceById(UUID, subType);
    }

    getServiceById(UUID, subType) {
        return this.associatedHAPAccessory.getServiceById(UUID, subType);
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
        const accessory = Accessory.deserialize(json);
        const platform = new Platform(accessory.displayName, accessory.UUID, accessory);

        platform.associatedPlugin = json.plugin;
        platform.associatedPlatform = json.platform;
        platform.context = json.context;
        platform.category = json.category;

        return platform;
    }
}
