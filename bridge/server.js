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
const Plugin = require("./plugin");
const Manager = require("./manager");
const Platform = require("./platform");

const { once } = require("hap-nodejs/dist/lib/util/once");
const { Logger } = require("./logger");
const { internal } = require("./logger");
const { existsSync, readFileSync, writeFileSync } = require("fs-extra");
const { uuid, Bridge, Accessory, Service, Characteristic, AccessoryLoader } = require("hap-nodejs");

const persist = require("node-persist").create();

module.exports = class Server {
    constructor(opts) {
        opts = opts || {};
    
        persist.initSync({ dir: User.cachedAccessoryPath() });
    
        this.api = new API();
    
        this.api.on("registerPlatformAccessories", (accessories) => {
            this.handleRegisterPlatformAccessories(accessories);
        });
    
        this.api.on("updatePlatformAccessories", (accessories) => {
            this.handleUpdatePlatformAccessories(accessories);
        });
    
        this.api.on("unregisterPlatformAccessories", (accessories) => {
            this.handleUnregisterPlatformAccessories(accessories);
        });
    
        this.api.on("publishExternalAccessories", (accessories) => {
            this.handlePublishExternalAccessories(accessories);
        });
    
        this.config = opts.config || this.loadConfig();
        this.plugins = this.loadPlugins();
        this.cachedPlatformAccessories = this.loadCachedPlatformAccessories();
        this.bridge = this.createBridge();
        this.removeOrphans = opts.removeOrphans || false;
    
        this.externalPorts = this.config.ports;
        this.nextExternalPort = undefined;
    
        this.activeDynamicPlugins = {};
        this.configurablePlatformPlugins = {};
        this.publishedAccessories = {};
        this.setupManager = new Manager();
    
        this.setupManager.on("newConfig", () => {
            this.handleNewConfig()
        });
    
        this.setupManager.on("requestCurrentConfig", (callback) => {
            callback(this.config);
        });
    }

    run() {
        this.asyncCalls = 0;
        this.asyncWait = true;
    
        if (this.config.platforms) {
            this.loadPlatforms();
        }
    
        if (this.config.accessories) {
            this.loadAccessories();
        }
    
        this.loadDynamicPlatforms();
        this.configCachedPlatformAccessories();
        this.setupManager.configurablePlatformPlugins = this.configurablePlatformPlugins;
        this.bridge.addService(this.setupManager.service);
    
        this.asyncWait = false;
    
        if (this.asyncCalls == 0) {
            this.publish();
        }
    
        this.api.emit("didFinishLaunching");
    
        process.send({ event: "api_launched" });
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
            publishInfo["setupID"] = bridgeConfig.setupID;
        }
    
        this.bridge.publish(publishInfo, true);
        this.printSetupInfo();
    
        process.send({ event: "running" });
    }
    
    loadPlugins() {
        const plugins = {};
        const activePlugins = this.computeActivePluginList();
    
        let foundOnePlugin = false;
    
        Plugin.installed().forEach((plugin) => {
            if (activePlugins !== undefined && activePlugins[plugin.name()] !== true) {
                return;
            }
    
            try {
                plugin.load();
            } catch (err) {
                internal.error(`Error loading plugin "${plugin.name()}".`);
                internal.error(err.stack);
    
                plugin.loadError = err;
            }
    
            if (!plugin.loadError) {
                plugins[plugin.name()] = plugin;
    
                internal.info(`Loaded plugin "${plugin.name()}".`);
    
                plugin.initializer(this.api);
    
                foundOnePlugin = true;
            }
        });
    
        if (!foundOnePlugin) {
            internal.warn("No plugins found.");
        }
    
        return plugins;
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
    
            throw err;
        }
    
        if (config.ports !== undefined) {
            if (config.ports.start > config.ports.end) {
                internal.error("Invalid port pool configuration. End should be greater than or equal to start.");
    
                config.ports = undefined;
            }
        }
    
        if (!/^([0-9A-F]{2}:){5}([0-9A-F]{2})$/.test(config.bridge.username)) {
            throw new Error(`Not a valid username: "${config.bridge.username}".`);
        }
    
        internal.info(`Loaded config.json with ${(config.accessories && config.accessories.length) || 0} accessories and ${(config.platforms && config.platforms.length) || 0} platforms.`);
    
        return config;
    }
    
    loadCachedPlatformAccessories() {
        const cachedAccessories = persist.getItem("cachedAccessories");
        const platformAccessories = [];
    
        if (cachedAccessories) {
            for (let index in cachedAccessories) {
                const serializedAccessory = cachedAccessories[index];
                const platformAccessory = new Platform(serializedAccessory.displayName, serializedAccessory.UUID, serializedAccessory.category);
    
                platformAccessory.configFromData(serializedAccessory);
    
                platformAccessories.push(platformAccessory);
            }
        }
    
        return platformAccessories;
    }
    
    computeActivePluginList() {
        if (this.config.plugins === undefined) {
            return undefined;
        }
    
        const activePlugins = {};
    
        for (let i = 0; i < this.config.plugins.length; i++) {
            activePlugins[this.config.plugins[i]] = true;
        }
    
        return activePlugins;
    }
    
    createBridge() {
        return new Bridge((this.config.bridge || {}).name || "HOOBS", uuid.generate("HomeBridge"));
    }
    
    loadAccessories() {
        internal.info(`Loading ${this.config.accessories.length} accessories...`);
    
        for (let i = 0; i < this.config.accessories.length; i++) {
            const accessoryConfig = this.config.accessories[i];
            const accessoryConstructor = this.api.accessory(accessoryConfig["accessory"]);
    
            if (!accessoryConstructor) {
                throw new Error(`Your config.json is requesting the accessory "${accessoryConfig["accessory"]}" which has not been published by any installed plugins.`);
            }
    
            const accessoryLogger = Logger.withPrefix(accessoryConfig["name"]);
    
            accessoryLogger(`Initializing ${accessoryConfig["accessory"]} accessory...`);
    
            const accessoryInstance = new accessoryConstructor(accessoryLogger, accessoryConfig);
    
            this.bridge.addBridgedAccessory(this.createAccessory(accessoryInstance, accessoryConfig["name"], accessoryConfig["accessory"], accessoryConfig.uuid_base));
        }
    }
    
    loadPlatforms() {
        internal.info(`Loading ${this.config.platforms.length} platforms...`);
    
        for (let i = 0; i < this.config.platforms.length; i++) {
            const platformConfig = this.config.platforms[i];
            const platformConstructor = this.api.platform(platformConfig["platform"]);
    
            if (!platformConstructor) {
                throw new Error(`Your config.json is requesting the platform "${platformConfig["platform"]}" which has not been published by any installed plugins.`);
            }
    
            const platformLogger = Logger.withPrefix(platformConfig["name"] || platformConfig["platform"]);
    
            platformLogger(`Initializing ${platformConfig["platform"]} platform...`);
    
            const platformInstance = new platformConstructor(platformLogger, platformConfig, this.api);
    
            if (platformInstance.configureAccessory == undefined) {
                this.loadPlatformAccessories(platformInstance, platformLogger, platformConfig["platform"]);
            } else {
                this.activeDynamicPlugins[platformConfig["platform"]] = platformInstance;
            }
    
            if (platformInstance.configurationRequestHandler != undefined) {
                this.configurablePlatformPlugins[platformConfig["platform"]] = platformInstance;
            }
        }
    }
    
    loadDynamicPlatforms() {
        for (let dynamicPluginName in this.api.dynamicPlatforms) {
            if (!this.activeDynamicPlugins[dynamicPluginName] && !this.activeDynamicPlugins[dynamicPluginName.split(".")[1]]) {
                process.send({ event: "info_log", data: `Load ${dynamicPluginName}` });
    
                const platformConstructor = this.api.dynamicPlatforms[dynamicPluginName];
                const platformLogger = Logger.withPrefix(dynamicPluginName);
                const platformInstance = new platformConstructor(platformLogger, null, this.api);
    
                this.activeDynamicPlugins[dynamicPluginName] = platformInstance;
    
                if (platformInstance.configurationRequestHandler != undefined) {
                    this.configurablePlatformPlugins[dynamicPluginName] = platformInstance;
                }
            }
        }
    }
    
    configCachedPlatformAccessories() {
        const verifiedAccessories = [];
    
        for (let index in this.cachedPlatformAccessories) {
            const accessory = this.cachedPlatformAccessories[index];
    
            if (!(accessory instanceof Platform)) {
                process.send({ event: "error_log", data: "Unexpected Accessory" });
    
                continue;
            }
    
            let platformInstance = this.activeDynamicPlugins[accessory.associatedPlugin + "." + accessory.associatedPlatform];
    
            if (!platformInstance) {
                platformInstance = this.activeDynamicPlugins[accessory.associatedPlatform];
            }
    
            if (platformInstance) {
                platformInstance.configureAccessory(accessory);
            } else {
                process.send({ event: "error_log", data: `Failed to find plugin to handle accessory ${accessory.displayName}` });
    
                if (this.removeOrphans) {
                    process.send({ event: "info_log", data: `Removing orphaned accessory ${accessory.displayName}` });
    
                    continue;
                }
            }
    
            verifiedAccessories.push(accessory);
    
            this.bridge.addBridgedAccessory(accessory.associatedHAPAccessory);
        }
    
        this.cachedPlatformAccessories = verifiedAccessories;
    }
    
    loadPlatformAccessories(platformInstance, internal, platformType) {
        this.asyncCalls++;
    
        platformInstance.accessories(once((foundAccessories) => {
            this.asyncCalls--;
    
            for (let i = 0; i < foundAccessories.length; i++) {
                const accessoryInstance = foundAccessories[i];
    
                internal(`Initializing platform accessory "${accessoryInstance.name}"...`);
    
                this.bridge.addBridgedAccessory(this.createAccessory(accessoryInstance, accessoryInstance.name, platformType, accessoryInstance.uuid_base));
            }
    
            if (this.asyncCalls === 0 && !this.asyncWait) {
                this.publish();
            }
        }));
    }
    
    createAccessory(accessoryInstance, displayName, accessoryType, uuidBase) {
        const services = accessoryInstance.getServices();
    
        if (!(services[0] instanceof Service)) {
            return AccessoryLoader.parseAccessoryJSON({
                displayName: displayName,
                services: services
            });
        } else {
            const accessory = new Accessory(displayName, uuid.generate(accessoryType + ":" + (uuidBase || displayName)));
    
            accessory.on("service-characteristic-change", () => {
                process.send({ event: "accessory_change" });
            });
    
            if (accessoryInstance.identify) {
                accessory.on("identify", (_paired, callback) => {
                    accessoryInstance.identify(callback);
                });
            }
    
            services.forEach((service) => {
                if (service instanceof Service.AccessoryInformation) {
                    const existingService = accessory.getService(Service.AccessoryInformation);
    
                    const manufacturer = service.getCharacteristic(Characteristic.Manufacturer).value;
                    const model = service.getCharacteristic(Characteristic.Model).value;
                    const serialNumber = service.getCharacteristic(Characteristic.SerialNumber).value;
                    const firmwareRevision = service.getCharacteristic(Characteristic.FirmwareRevision).value;
                    const hardwareRevision = service.getCharacteristic(Characteristic.HardwareRevision).value;
    
                    if (manufacturer) {
                        existingService.setCharacteristic(Characteristic.Manufacturer, manufacturer);
                    }
    
                    if (model) {
                        existingService.setCharacteristic(Characteristic.Model, model);
                    }
    
                    if (serialNumber) {
                        existingService.setCharacteristic(Characteristic.SerialNumber, serialNumber);
                    }
    
                    if (firmwareRevision) {
                        existingService.setCharacteristic(Characteristic.FirmwareRevision, firmwareRevision);
                    }
    
                    if (hardwareRevision) {
                        existingService.setCharacteristic(Characteristic.HardwareRevision, hardwareRevision);
                    }
                } else {
                    accessory.addService(service);
                }
            });
    
            return accessory;
        }
    }
    
    handleRegisterPlatformAccessories(accessories) {
        const hapAccessories = [];
    
        for (let index in accessories) {
            const accessory = accessories[index];
    
            hapAccessories.push(accessory.associatedHAPAccessory);
    
            this.cachedPlatformAccessories.push(accessory);
        }
    
        this.bridge.addBridgedAccessories(hapAccessories);
        this.updateCachedAccessories();
    }
    
    handleUpdatePlatformAccessories() {
        this.updateCachedAccessories();
    }
    
    handleUnregisterPlatformAccessories(accessories) {
        const hapAccessories = [];
    
        for (let index in accessories) {
            const accessory = accessories[index];
    
            if (accessory.associatedHAPAccessory) {
                hapAccessories.push(accessory.associatedHAPAccessory);
            }
    
            for (let targetIndex in this.cachedPlatformAccessories) {
                if (this.cachedPlatformAccessories[targetIndex].UUID === accessory.UUID) {
                    this.cachedPlatformAccessories.splice(targetIndex, 1);
    
                    break;
                }
            }
        }
    
        this.bridge.removeBridgedAccessories(hapAccessories);
        this.updateCachedAccessories();
    }
    
    handlePublishExternalAccessories(accessories) {
        for (let index in accessories) {
            const accessory = accessories[index];
    
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
        
            const hapAccessory = accessory.associatedHAPAccessory;
            const advertiseAddress = this.generateAddress(accessory.UUID);
    
            if (this.publishedAccessories[advertiseAddress]) {
                throw new Error("Accessory " + accessory.displayName + " experienced an address collision.");
            } else {
                this.publishedAccessories[advertiseAddress] = accessory;
            }
    
            ((name) => {
                hapAccessory.on("listening", (port) => {
                    internal.info(`${name} is running on port ${port}.`);
                });
            })(accessory.displayName);
    
            hapAccessory.publish({
                username: advertiseAddress,
                pincode: (this.config.bridge || {}).pin || "031-45-154",
                category: accessory.category,
                port: accessoryPort,
                mdns: this.config.mdns
            }, true);
        }
    }
    
    updateCachedAccessories() {
        const serializedAccessories = [];
    
        for (let index in this.cachedPlatformAccessories) {
            serializedAccessories.push(this.cachedPlatformAccessories[index].dictionaryPresentation());
        }
    
        persist.setItemSync("cachedAccessories", serializedAccessories);
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
        this.updateCachedAccessories();
        this.bridge.unpublish();
    
        Object.keys(this.publishedAccessories).forEach((advertiseAddress) => {
            this.publishedAccessories[advertiseAddress].associatedHAPAccessory.unpublish();
        });
    }
    
    handleNewConfig(type, name, replace, config) {
        if (type === "accessory") {
            if (!this.config.accessories) {
                this.config.accessories = [];
            }
    
            if (!replace) {
                this.config.accessories.push(config);
            } else {
                let targetName;
    
                if (name.indexOf(".") !== -1) {
                    targetName = name.split(".")[1];
                }
    
                let found = false;
    
                for (let index in this.config.accessories) {
                    if (this.config.accessories[index].accessory === name) {
                        this.config.accessories[index] = config;
    
                        found = true;
    
                        break;
                    }
    
                    if (targetName && (this.config.accessories[index].accessory === targetName)) {
                        this.config.accessories[index] = config;
    
                        found = true;
    
                        break;
                    }
                }
    
                if (!found) {
                    this.config.accessories.push(config);
                }
            }
        } else if (type === "platform") {
            if (!this.config.platforms) {
                this.config.platforms = [];
            }
    
            if (!replace) {
                this.config.platforms.push(config);
            } else {
                let targetName;
    
                if (name.indexOf(".") !== -1) {
                    targetName = name.split(".")[1];
                }
    
                let found = false;
    
                for (let index in this.config.platforms) {
                    if (this.config.platforms[index].platform === name) {
                        this.config.platforms[index] = config;
    
                        found = true;
    
                        break;
                    }
    
                    if (targetName && (this.config.platforms[index].platform === targetName)) {
                        this.config.platforms[index] = config;
    
                        found = true;
    
                        break;
                    }
                }
    
                if (!found) {
                    this.config.platforms.push(config);
                }
            }
        }
    
        writeFileSync(User.configPath(), JSON.stringify(this.config, null, 4), "utf8");
    }
    
    printSetupInfo() {
        process.send({ event: "setup_uri", data: this.bridge.setupURI() });
    }
}
