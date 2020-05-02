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

        this.associated = cached || new Accessory(name, uuid);

        if (category) {
            this.associated.category = category;
        }

        this.displayName = this.associated.displayName;
        this.UUID = this.associated.UUID;

        this.category = category || Accessory.Categories.OTHER;
        this.services = this.associated.services;
        this.reachable = false;
        this.context = {};

        this.associatedPlugin;
        this.associatedPlatform;

        this.associated.on("identify", (paired, callback) => {
            this.emit("identify", paired, callback);

            callback();
        });
    }

    get _associatedHAPAccessory() {
        return this.associated;
    }

    get associatedHAPAccessory() {
        return this.associated;
    }

    addService(service, ...args) {
        return this.associated.addService(service, ...args);
    }

    removeService(service) {
        this.associated.removeService(service);
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
        return this.associated.getServiceById(uuid, subType);
    }

    updateReachability(reachable) {
        this.reachable = reachable;

        try {
            this.associated.updateReachability(reachable);
        } catch (error) {
            internal.debug("Unable to update reachability");
            internal.debug(error);
        }
    }

    configureCameraSource(cameraSource) {
        this.cameraSource = cameraSource;
        this.associated.configureCameraSource(this.cameraSource);
    }

    static serialize(accessory) {
        return {
            plugin: accessory.associatedPlugin,
            platform: accessory.associatedPlatform,
            context: accessory.context,
            ...Accessory.serialize(accessory.associated),
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
