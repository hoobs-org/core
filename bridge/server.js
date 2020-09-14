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

const API = require("./api");
const User = require("./user");
const Crypto = require("crypto");
const Plugins = require("./plugins");
const Platform = require("./platform");

const { once } = require("hap-nodejs/dist/lib/util/once");
const { Logger, internal } = require("./logger");
const { existsSync, readFileSync } = require("fs-extra");
const { uuid, Bridge, Accessory, Service, Characteristic, AccessoryLoader, CharacteristicEventTypes } = require("hap-nodejs");

const persist = require("node-persist").create();

module.exports = class Server {
    constructor(opts) {
        opts = opts || {};

        persist.initSync({ dir: User.cachedAccessoryPath() });

        this.api = new API();

        this.api.on("registerPlatformAccessories", this.handleRegisterPlatformAccessories.bind(this));
        this.api.on("updatePlatformAccessories", this.handleUpdatePlatformAccessories.bind(this));
        this.api.on("unregisterPlatformAccessories", this.handleUnregisterPlatformAccessories.bind(this));
        this.api.on("publishExternalAccessories", this.handlePublishExternalAccessories.bind(this));

        this.path = opts.path;
        this.config = opts.config || this.loadConfig();
        this.removeOrphans = opts.removeOrphans || false;
        this.cacheExists = false;

        this.externalPorts = this.config.ports;
        this.nextExternalPort = undefined;

        this.publishedAccessories = {};
        this.cachedAccessories = [];

        this.plugins = new Plugins(this.path, this.config, this.api);
        this.bridge = new Bridge((this.config.bridge || {}).name || "HOOBS", uuid.generate("HomeBridge"));
    }

    async run() {
        const platforms = [];

        this.loadCache();
        this.plugins.load();

        if (this.config.platforms.length > 0) {
            platforms.push(...this.loadPlatforms());
        }

        if (this.config.accessories) {
            this.loadAccessories();
        }

        this.restoreCache();

        this.api.emit("didFinishLaunching");

        await Promise.all(platforms).then(() => {
            this.publish();
    
            process.send({ event: "api_launched" });
        });        
    }

    publish() {
        const bridgeConfig = this.config.bridge || {};
        const info = this.bridge.getService(Service.AccessoryInformation);

        info.setCharacteristic(Characteristic.Manufacturer, bridgeConfig.manufacturer || "HOOBS");
        info.setCharacteristic(Characteristic.Model, bridgeConfig.model || "HOOBS");
        info.setCharacteristic(Characteristic.SerialNumber, bridgeConfig.username);
        info.setCharacteristic(Characteristic.FirmwareRevision, require("../package.json").version);

        this.bridge.on("listening", (port) => {
            internal.info(`Bridge is running on port ${port}.`);
        });

        const publishInfo = {
            username: bridgeConfig.username || "CC:22:3D:E3:CE:30",
            port: bridgeConfig.port || 0,
            pincode: bridgeConfig.pin || "031-45-154",
            category: Accessory.Categories.BRIDGE,
            mdns: this.config.mdns
        };

        if (bridgeConfig.setupID && bridgeConfig.setupID.length === 4) {
            publishInfo.setupID = bridgeConfig.setupID;
        }

        this.bridge.publish(publishInfo, true);
        this.printSetupInfo();

        process.send({ event: "running" });
    }

    loadConfig() {
        const configPath = User.configPath();

        if (!existsSync(configPath)) {
            internal.warn(`config.json "${configPath}" not found.`);

            return {
                bridge: {
                    name: "HOOBS",
                    username: "CC:22:3D:E3:CE:30",
                    pin: "031-45-154"
                }
            };
        }

        let config = {};

        try {
            config = JSON.parse(readFileSync(configPath));
        } catch (err) {
            internal.error("There was a problem reading your config.json file.");

            return {
                bridge: {
                    name: "HOOBS",
                    username: "CC:22:3D:E3:CE:30",
                    pin: "031-45-154"
                }
            };
        }

        if (config.ports !== undefined) {
            if (config.ports.start > config.ports.end) {
                internal.error("Invalid port pool configuration. End should be greater than or equal to start.");

                config.ports = undefined;
            }
        }

        if (!/^([0-9A-F]{2}:){5}([0-9A-F]{2})$/.test(config.bridge.username)) {
            internal.error(`Not a valid username "${config.bridge.username}".`);

            config.bridge.username = "CC:22:3D:E3:CE:30";
        }

        return config;
    }

    loadAccessories() {
        for (let i = 0; i < this.config.accessories.length; i++) {
            const plugin = this.plugins.getPlugin(this.config.accessories[i].accessory);

            if (plugin) {
                const initilizer = plugin.getInitilizer("accessory", this.config.accessories[i].accessory);

                if (initilizer) {
                    const logger = Logger.withPrefix(plugin.name, this.config.accessories[i]["name"]);
                    const instance = new initilizer(logger, this.config.accessories[i], this.api);
                    const accessory = this.createAccessory(plugin, instance, this.config.accessories[i]["name"], this.config.accessories[i]["accessory"], this.config.accessories[i].uuid_base);

                    if (accessory) {
                        this.bridge.addBridgedAccessory(accessory);
                    }
                } else {
                    internal.error(`Unable to find initilizer "${plugin.name}"`);
                }
            } else {
                internal.error(`Unable to find plugin "${this.config.accessories[i].accessory}"`);
            }
        }
    }

    loadPlatforms() {
        const platforms = [];

        for (let i = 0; i < this.config.platforms.length; i++) {
            const plugin = this.plugins.getPlugin(this.config.platforms[i].platform);

            if (plugin) {
                const initilizer = plugin.getInitilizer("platform", this.config.platforms[i].platform);

                if (initilizer) {
                    const logger = Logger.withPrefix(plugin.name, this.config.platforms[i].name || this.config.platforms[i].platform);
                    const instance = new initilizer(logger, this.config.platforms[i], this.api);

                    if (API.isDynamicPlatformPlugin(instance)) {
                        plugin.assignDynamicPlatform(this.config.platforms[i].platform, instance);
                    } else if (API.isStaticPlatformPlugin(instance)) {
                        platforms.push(this.loadPlatformAccessories(plugin, instance, this.config.platforms[i].platform));
                    }
                } else {
                    internal.error(`Unable to find initilizer "${plugin.name}"`);
                }
            } else {
                internal.error(`Unable to find plugin "${this.config.platforms[i].platform}"`);
            }
        }

        return platforms;
    }

    loadPlatformAccessories(plugin, instance, type) {
        return new Promise((resolve) => {
            instance.accessories(once((accessories) => {    
                for (let i = 0; i < accessories.length; i++) {    
                    internal.debug(`Initializing "${plugin.name}" accessory "${accessories[i].name}"`);

                    const accessory = this.createAccessory(plugin, accessories[i], accessories[i].name, type, accessories[i].uuid_base);

                    if (accessory) {
                        this.bridge.addBridgedAccessory();
                    }
                }
    
                resolve();
            }));
        });
    }

    loadCache() {
        const accessories = persist.getItem("cachedAccessories") || [];

        this.cachedAccessories = [];

        for (let i = 0; i < accessories.length; i++) {
            this.cachedAccessories.push(Platform.deserialize(accessories[i]));
        }

        this.cacheExists = true;
    }

    restoreCache() {
        const accessories = [];

        for (let i = 0; i < this.cachedAccessories.length; i++) {
            const accessory = this.cachedAccessories[i];

            let plugin = this.plugins.getPlugin(accessory.associatedPlugin);

            if (!plugin) {
                try {
                    plugin = this.plugins.getDynamicPlatform(accessory.associatedPlatform);

                    if (plugin) {
                        accessory.associatedPlugin = plugin.name;
                    }
                } catch (_error) {
                    internal.info(`Could not find the associated plugin for the accessory "${accessory.name}".`);
                }
            }

            if (plugin) {
                let instance = plugin.getInitilizer("dynamic", accessory.associatedPlatform);

                if (instance) {
                    instance.configureAccessory(accessory);

                    accessories.push(accessory);

                    this.bridge.addBridgedAccessory(accessory.associated);
                }
            }
        }

        this.cachedAccessories = accessories;
    }

    updateCache() {
        if (this.cachedAccessories.length > 0) {
            this.cacheExists = true;

            const serializedAccessories = [];

            for (let index in this.cachedAccessories) {
                serializedAccessories.push(Platform.serialize(this.cachedAccessories[index]));
            }

            persist.setItemSync("cachedAccessories", serializedAccessories);
        } else if (this.cacheExists) {
            this.cacheExists = false;

            persist.removeItemSync("cachedAccessories");
        }
    }

    createAccessory(plugin, instance, name, type, uuidBase) {
        const services = (instance.getServices() || []).filter(service => !!service);
        const controllers = (instance.getControllers && instance.getControllers() || []).filter(controller => !!controller);

        if (services.length === 0 && controllers.length === 0) {
            return undefined;
        }

        if (!(services[0] instanceof Service)) {
            return AccessoryLoader.parseAccessoryJSON({
                displayName: name,
                services
            });
        } else {
            const accessory = new Accessory(name, uuid.generate(`${type}:${uuidBase || name}`));

            /*
            accessory.on("service-characteristic-change", (data) => {
                if (
                    data.newValue !== data.oldValue
                 && data.characteristic.displayName !== "Last Updated"
                 && data.characteristic.displayName !== "Serial Number"
                 && data.characteristic.displayName !== "Manufacturer"
                 && data.characteristic.displayName !== "Identify"
                 && data.characteristic.displayName !== "Model"
                ) {
                    process.send({ event: "accessory_change" });
                }
            });
            */

            if (instance.identify) {
                accessory.on("identify", (_paired, callback) => {
                    instance.identify(() => {});

                    callback();
                });
            }

            const informationService = accessory.getService(Service.AccessoryInformation);

            for (let i = 0; i < services.length; i++) {
                if (services[i] instanceof Service.AccessoryInformation) {
                    services[i].setCharacteristic(Characteristic.Name, name);
                    services[i].getCharacteristic(Characteristic.Identify).removeAllListeners(CharacteristicEventTypes.SET);

                    informationService.replaceCharacteristicsFromService(services[i]);
                } else {
                    accessory.addService(services[i]);
                }
            }

            if (informationService.getCharacteristic(Characteristic.FirmwareRevision).value === "0.0.0") {
                informationService.setCharacteristic(Characteristic.FirmwareRevision, plugin.version);
            }

            for (let i = 0; i < controllers.length; i++) {
                accessory.configureController(controllers[i]);
            }

            return accessory;
        }
    }

    handleRegisterPlatformAccessories(accessories) {
        const hapAccessories = [];

        for (let i = 0; i < accessories.length; i++) {
            this.cachedAccessories.push(accessories[i]);

            const accessory = accessories[i];
            const plugin = this.plugins.getPlugin(accessory.associatedPlugin);

            if (plugin) {
                const informationService = accessory.getService(Service.AccessoryInformation);

                if (informationService.getCharacteristic(Characteristic.FirmwareRevision).value === "0.0.0") {
                    informationService.setCharacteristic(Characteristic.FirmwareRevision, plugin.version);
                }
            }

            hapAccessories.push(accessory.associated);
        }

        this.bridge.addBridgedAccessories(hapAccessories);

        this.updateCache();
    }

    handleUpdatePlatformAccessories() {
        this.updateCache();
    }

    handleUnregisterPlatformAccessories(accessories) {
        const hapAccessories = [];

        for (let i = 0; i < accessories.length; i++) {
            const accessory = accessories[i];
            const index = this.cachedAccessories.findIndex((a) => a.UUID === accessory.UUID);

            if (index >= 0) {
                this.cachedAccessories.splice(index, 1);
            }

            hapAccessories.push(accessory.associated);
        }

        this.bridge.removeBridgedAccessories(hapAccessories);

        this.updateCache();
    }

    handlePublishExternalAccessories(accessories) {
        for (let i = 0; i < accessories.length; i++) {
            const accessory = accessories[i];

            let accessoryPort = 0;

            if (this.externalPorts) {
                if (this.nextExternalPort > this.externalPorts.end) {
                    internal.info("External port pool ran out of ports. Fallback to random assign.");

                    accessoryPort = 0;
                } else {
                    if (this.nextExternalPort !== undefined) {
                        accessoryPort = this.nextExternalPort;

                        this.nextExternalPort += 1;
                    } else {
                        accessoryPort = this.externalPorts.start;

                        this.nextExternalPort = this.externalPorts.start + 1;
                    }
                }
            }

            const hapAccessory = accessory.associated;
            const advertiseAddress = this.generateAddress(accessory.UUID);

            if (this.publishedAccessories[advertiseAddress]) {
                internal.warn(`Accessory ${accessory.displayName}experienced an address collision.`);
            } else {
                this.publishedAccessories[advertiseAddress] = accessory;
            }

            const plugin = this.plugins.getPlugin(accessory.associatedPlugin);

            if (plugin) {
                const informationService = hapAccessory.getService(Service.AccessoryInformation);

                if (informationService.getCharacteristic(Characteristic.FirmwareRevision).value === "0.0.0") {
                  informationService.setCharacteristic(Characteristic.FirmwareRevision, plugin.version);
                }
            }

            hapAccessory.on("listening", (port) => {
                internal.info(`${accessory.displayName} is running on port ${port}.`);
                internal.info(`Please add ${hapAccessory.displayName} manually in Home app. Setup Code: ${(this.config.bridge || {}).pin || "031-45-154"}`);
            });

            hapAccessory.publish({
                username: advertiseAddress,
                pincode: (this.config.bridge || {}).pin || "031-45-154",
                category: accessory.category,
                port: accessoryPort,
                mdns: this.config.mdns
            }, true);
        }
    }

    generateAddress(data) {
        const sha1sum = Crypto.createHash("sha1");

        sha1sum.update(data);

        let s = sha1sum.digest("hex");
        let i = -1;

        return "xx:xx:xx:xx:xx:xx".replace(/[x]/g, function () {
            i += 1;

            return s[i];
        }).toUpperCase();
    }

    teardown() {
        this.updateCache();
        this.bridge.unpublish();

        Object.keys(this.publishedAccessories).forEach((advertiseAddress) => {
            this.publishedAccessories[advertiseAddress].associated.unpublish();
        });
    }

    printSetupInfo() {
        process.send({ event: "setup_uri", data: this.bridge.setupURI() });
    }
}
