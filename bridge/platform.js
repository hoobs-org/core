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
    constructor(displayName, UUID, category) {
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
    
        this.associatedHAPAccessory = new Accessory(displayName, UUID);;

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
    
        this.addService(Service.AccessoryInformation)
            .setCharacteristic(Characteristic.Name, displayName)
            .setCharacteristic(Characteristic.Manufacturer, "Default-Manufacturer")
            .setCharacteristic(Characteristic.Model, "Default-Model")
            .setCharacteristic(Characteristic.SerialNumber, "Default-SerialNumber");
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
    
    getServiceByUUIDAndSubType(UUID, subtype) {
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
    
    dictionaryPresentation() {
        const accessory = {};
    
        accessory.plugin = this.associatedPlugin;
        accessory.platform = this.associatedPlatform;
        accessory.displayName = this.displayName;
        accessory.UUID = this.UUID;
        accessory.category = this.category;
        accessory.context = this.context;
    
        const services = [];
        const linkedServices = {};
    
        for (let index in this.services) {
            const service = this.services[index];
            const servicePresentation = {};
    
            servicePresentation.displayName = service.displayName;
            servicePresentation.UUID = service.UUID;
            servicePresentation.subtype = service.subtype;
    
            const linkedServicesPresentation = [];
    
            for (let linkedServiceIdx in service.linkedServices) {
                linkedServicesPresentation.push(service.linkedServices[linkedServiceIdx].UUID + (linkedServices.subtype || ""));
            }
    
            linkedServices[service.UUID + (service.subtype || "")] = linkedServicesPresentation;
    
            const characteristics = [];
    
            for (let cIndex in service.characteristics) {
                const characteristic = service.characteristics[cIndex];
                const characteristicPresentation = {};
    
                characteristicPresentation.displayName = characteristic.displayName;
                characteristicPresentation.UUID = characteristic.UUID;
                characteristicPresentation.props = characteristic.props;
                characteristicPresentation.value = characteristic.value;
                characteristicPresentation.eventOnlyCharacteristic = characteristic.eventOnlyCharacteristic;
    
                characteristics.push(characteristicPresentation);
            }
    
            servicePresentation.characteristics = characteristics;
    
            services.push(servicePresentation);
        }
    
        accessory.linkedServices = linkedServices;
        accessory.services = services;
    
        return accessory;
    }
    
    configFromData(data) {
        this.associatedPlugin = data.plugin;
        this.associatedPlatform = data.platform;
        this.displayName = data.displayName;
        this.UUID = data.UUID;
        this.category = data.category;
        this.context = data.context;
        this.reachable = false;
    
        const services = [];
        const servicesMap = {};
    
        for (let index in data.services) {
            const service = data.services[index];
            const hapService = new Service(service.displayName, service.UUID, service.subtype);
            const characteristics = [];
    
            for (let cIndex in service.characteristics) {
                const characteristic = service.characteristics[cIndex];
                const hapCharacteristic = new Characteristic(characteristic.displayName, characteristic.UUID, characteristic.props);
    
                hapCharacteristic.eventOnlyCharacteristic = characteristic.eventOnlyCharacteristic;
                hapCharacteristic.value = characteristic.value;
    
                characteristics.push(hapCharacteristic);
            }
    
            hapService.sideloadCharacteristics(characteristics);
    
            servicesMap[service.UUID + (service.subtype || "")] = hapService;
    
            services.push(hapService);
        }
    
        if (data.linkedServices) {
            const linkedServices = data.linkedServices;
    
            for (let key in linkedServices) {
                if (servicesMap[key]) {
                    const linkedServiceKeys = linkedServices[key];
    
                    for (let linkedServiceKey in linkedServiceKeys) {
                        if (servicesMap[linkedServiceKeys[linkedServiceKey]]) {
                            servicesMap[key].addLinkedService(servicesMap[linkedServiceKeys[linkedServiceKey]]);
                        }
                    }
                }
            }
        }
    
        this.services = services;
    }
}
