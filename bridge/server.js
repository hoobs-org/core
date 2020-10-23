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

const _ = require("lodash");

const fs = require("fs");
const os = require("os");
const { join } = require("path");
const storage = require("node-persist");

const {
    Accessory,
    AccessoryEventTypes,
    AccessoryLoader,
    Bridge,
    Categories,
    Characteristic,
    CharacteristicEventTypes,
    once,
    Service,
    uuid,
} = require("hap-nodejs");

const { Console, internal } = require("./logger");
const { Plugin } = require("homebridge/lib/plugin");
const { Logger } = require("homebridge/lib/logger");

Logger.internal = internal;

const {
    HomebridgeAPI,
    InternalAPIEvent,
} = require("homebridge/lib/api");

const { PlatformAccessory } = require("homebridge/lib/platformAccessory");
const mac = require("homebridge/lib/util/mac");
const { PluginManager } = require("homebridge/lib/pluginManager");
const HBS = require("../server/instance");
const Plugins = require("../server/plugins");

PluginManager.PLUGIN_IDENTIFIER_PATTERN = /^((@[\S]*)\/)?([\S-]*)$/;

const home = HBS.docker ? "/hoobs" : join(os.userInfo().homedir, ".hoobs");
const accessoryStorage = storage.create();
const log = internal;

module.exports = class Server {
    constructor(options = {}) {
        accessoryStorage.initSync({ dir: join(home, "etc", HBS.name || "", "accessories") });

        this.cachedPlatformAccessories = [];
        this.cachedAccessoriesFileCreated = false;
        this.publishedExternalAccessories = new Map();
        this.config = options.config;
        this.keepOrphanedCachedAccessories = options.keepOrphanedCachedAccessories || false;
        this.allowInsecureAccess = true;
        this.externalPorts = this.config.ports;

        this.api = new HomebridgeAPI();
        this.api.on(InternalAPIEvent.REGISTER_PLATFORM_ACCESSORIES, this.handleRegisterPlatformAccessories.bind(this));
        this.api.on(InternalAPIEvent.UPDATE_PLATFORM_ACCESSORIES, this.handleUpdatePlatformAccessories.bind(this));
        this.api.on(InternalAPIEvent.UNREGISTER_PLATFORM_ACCESSORIES, this.handleUnregisterPlatformAccessories.bind(this));
        this.api.on(InternalAPIEvent.PUBLISH_EXTERNAL_ACCESSORIES, this.handlePublishExternalAccessories.bind(this));

        this.pluginManager = new PluginManager(this.api, {
            activePlugins: this.config.plugins,
            customPluginPath: options.customPluginPath,
        });

        this.bridge = new Bridge(this.config.bridge.name || "HOOBS", uuid.generate("HomeBridge"));
    }

    async start() {
        const promises = [];

        this.loadCachedPlatformAccessoriesFromDisk();

        const installed = Plugins.list();
        const keys = Object.keys(installed);

        for (let i = 0; i < keys.length; i += 1) {
            const { ...item } = installed[keys[i]];
            const filename = join(item.directory, "package.json");
            const identifier = item.scope ? `@${item.scope}/${item.name}` : item.name;

            if (fs.existsSync(filename) && fs.existsSync(join(item.directory, item.library))) {
                let pjson = null;

                try {
                    pjson = JSON.parse(fs.readFileSync(filename).toString());
                } catch (error) {
                    pjson = null;

                    log.error(error.message);
                }

                if (pjson && !this.pluginManager.plugins.get(identifier)) {
                    const plugin = new Plugin(item.name, item.directory, pjson, item.scope);

                    this.pluginManager.plugins.set(identifier, plugin);

                    try {
                        plugin.load();
                    } catch (error) {
                        log.error(`Error loading plugin "${identifier}"`);
                        log.error(error.stack);

                        this.pluginManager.plugins.delete(identifier);
                    }

                    log.info(`Loaded plugin '${identifier}'`);

                    if (this.pluginManager.plugins.get(identifier)) {
                        try {
                            this.pluginManager.currentInitializingPlugin = plugin;

                            plugin.initialize(this.api);
                        } catch (error) {
                            log.error(`Error initializing plugin '${identifier}'`);
                            log.error(error.stack);

                            this.pluginManager.plugins.delete(identifier);
                        }
                    }
                }
            }
        }

        this.pluginManager.currentInitializingPlugin = undefined;

        if (this.pluginManager.plugins.size === 0) {
            log.warn("No plugins installed.");
        }

        if (this.config.platforms.length > 0) {
            promises.push(...this.loadPlatforms());
        }

        if (this.config.accessories.length > 0) {
            this._loadAccessories();
        }

        this.restoreCachedPlatformAccessories();
        this.api.signalFinished();

        await Promise.all(promises).then(() => this.publishBridge());
    }

    publishBridge() {
        const bridgeConfig = this.config.bridge;
        const info = this.bridge.getService(Service.AccessoryInformation);

        info.setCharacteristic(Characteristic.Manufacturer, bridgeConfig.manufacturer || "HOOBS");
        info.setCharacteristic(Characteristic.Model, bridgeConfig.model || "HOOBS");
        info.setCharacteristic(Characteristic.SerialNumber, bridgeConfig.username);
        info.setCharacteristic(Characteristic.FirmwareRevision, "1.2.3");

        this.bridge.on(AccessoryEventTypes.LISTENING, (port) => {
            log.info("Bridge is running on port %s.", port);

            process.send({ event: "setup_uri", data: this.bridge.setupURI() });
            process.send({ event: "running" });
        });

        const publishInfo = {
            username: bridgeConfig.username,
            port: bridgeConfig.port,
            pincode: bridgeConfig.pin,
            category: Categories.BRIDGE,
            mdns: this.config.mdns,
        };

        if (bridgeConfig.setupID && bridgeConfig.setupID.length === 4) {
            publishInfo.setupID = bridgeConfig.setupID;
        }

        this.bridge.publish(publishInfo, this.allowInsecureAccess);

        process.send({ event: "api_launched" });
    }

    loadCachedPlatformAccessoriesFromDisk() {
        const cachedAccessories = accessoryStorage.getItem("cachedAccessories");

        if (cachedAccessories) {
            this.cachedPlatformAccessories = cachedAccessories.map(serialized => {
                return PlatformAccessory.deserialize(serialized);
            });

            this.cachedAccessoriesFileCreated = true;
        }
    }

    restoreCachedPlatformAccessories() {
        this.cachedPlatformAccessories = (this.cachedPlatformAccessories || []).filter(accessory => {
            let plugin = this.pluginManager.getPlugin(accessory._associatedPlugin);

            if (!plugin) {
                try {
                    plugin = this.pluginManager.getPluginByActiveDynamicPlatform(accessory._associatedPlatform);

                    if (plugin) {
                        log.info("When searching for the associated plugin of the accessory '" + accessory.displayName + "' " +
                            "it seems like the plugin name changed from '" + accessory._associatedPlugin + "' to '" +
                            plugin.getPluginIdentifier() + "'. Plugin association is now being transformed!");

                        accessory._associatedPlugin = plugin.getPluginIdentifier();
                    }
                } catch (error) {
                    log.info("Could not find the associated plugin for the accessory '" + accessory.displayName + "'. " +
                        "Tried to find the plugin by the platform name but " + error.message);
                }
            }

            const platformPlugins = plugin && plugin.getActiveDynamicPlatform(accessory._associatedPlatform);

            if (!platformPlugins) {
                log.info(`Failed to find plugin to handle accessory ${accessory._associatedHAPAccessory.displayName}`);

                if (!this.keepOrphanedCachedAccessories) {
                    log.info(`Removing orphaned accessory ${accessory._associatedHAPAccessory.displayName}`);
                    return false;
                }
            } else {
                const service = accessory.getService(Service.AccessoryInformation);

                if (service) {
                    service.setCharacteristic(Characteristic.FirmwareRevision, plugin.version);
                }

                platformPlugins.configureAccessory(accessory);
            }

            this.bridge.addBridgedAccessory(accessory._associatedHAPAccessory);

            return true;
        });
    }

    saveCachedPlatformAccessoriesOnDisk() {
        if ((this.cachedPlatformAccessories || []).length > 0) {
            this.cachedAccessoriesFileCreated = true;

            const serializedAccessories = this.cachedPlatformAccessories.map(accessory => PlatformAccessory.serialize(accessory));

            accessoryStorage.setItemSync("cachedAccessories", serializedAccessories);
        } else if (this.cachedAccessoriesFileCreated) {
            this.cachedAccessoriesFileCreated = false;

            accessoryStorage.removeItemSync("cachedAccessories");
        }
    }

    _loadAccessories() {
        log.info("Loading " + this.config.accessories.length + " accessories...");

        this.config.accessories.forEach((accessoryConfig, index) => {
            if (!accessoryConfig.accessory) {
                log.warn("Your config.json contains an illegal accessory configuration object at position %d. " +
                    "Missing property 'accessory'. Skipping entry...", index + 1);
                return;
            }

            const accessoryIdentifier = accessoryConfig.accessory;
            const displayName = accessoryConfig.name;

            if (!displayName) {
                log.warn("Could not load accessory %s at position %d as it is missing the required 'name' property!", accessoryIdentifier, index + 1);
                return;
            }

            let plugin;
            let constructor;

            try {
                plugin = this.pluginManager.getPluginForAccessory(accessoryIdentifier);
                constructor = plugin.getAccessoryConstructor(accessoryIdentifier);
            } catch (error) {
                log.warn("Error loading accessory requested in your config.json at position %d", index + 1);

                throw error;
            }

            const logger = Console.withPrefix(displayName);

            logger("Initializing %s accessory...", accessoryIdentifier);

            const accessoryInstance = new constructor(logger, accessoryConfig, this.api);
            const accessory = this.createHAPAccessory(plugin, accessoryInstance, displayName, accessoryIdentifier, accessoryConfig.uuid_base);

            if (accessory) {
                this.bridge.addBridgedAccessory(accessory);
            } else {
                logger("Accessory %s returned empty set of services. Won't adding it to the bridge!", accessoryIdentifier);
            }
        });
    }

    loadPlatforms() {
        log.info("Loading " + this.config.platforms.length + " platforms...");

        const promises = [];

        this.config.platforms.forEach((platformConfig, index) => {
            if (!platformConfig.platform) {
                log.warn("Your config.json contains an illegal platform configuration object at position %d. " +
                    "Missing property 'platform'. Skipping entry...", index + 1);
                return;
            }

            const platformIdentifier = platformConfig.platform;
            const displayName = platformConfig.name || platformIdentifier;

            let plugin;
            let constructor;

            try {
                plugin = this.pluginManager.getPluginForPlatform(platformIdentifier);
                constructor = plugin.getPlatformConstructor(platformIdentifier);
            } catch (error) {
                log.warn("Error loading platform requested in your config.json at position %d", index + 1);

                throw error;
            }

            const logger = Console.withPrefix(displayName);

            logger("Initializing %s platform...", platformIdentifier);

            const platform = new constructor(logger, platformConfig, this.api);

            if (HomebridgeAPI.isDynamicPlatformPlugin(platform)) {
                plugin.assignDynamicPlatform(platformIdentifier, platform);
            } else if (HomebridgeAPI.isStaticPlatformPlugin(platform)) {
                promises.push(this.loadPlatformAccessories(plugin, platform, platformIdentifier, logger));
            }
        });

        return promises;
    }

    async loadPlatformAccessories(plugin, platformInstance, platformType, logger) {
        return new Promise(resolve => {
            platformInstance.accessories(once((accessories) => {
                accessories.forEach((accessoryInstance, index) => {
                    const accessoryName = accessoryInstance.name;
                    const uuidBase = accessoryInstance.uuid_base;

                    log.info("Initializing platform accessory '%s'...", accessoryName);

                    const accessory = this.createHAPAccessory(plugin, accessoryInstance, accessoryName, platformType, uuidBase);

                    if (accessory) {
                        this.bridge.addBridgedAccessory(accessory);
                    } else {
                        logger("Platform %s returned an accessory at index %d with an empty set of services. Won't adding it to the bridge!", platformType, index);
                    }
                });

                resolve();
            }));
        });
    }

    createHAPAccessory(plugin, accessoryInstance, displayName, accessoryType, uuidBase) {
        const services = (accessoryInstance.getServices() || [])
            .filter(service => !!service);

        const controllers = (accessoryInstance.getControllers && accessoryInstance.getControllers() || [])
            .filter(controller => !!controller);

        if (services.length === 0 && controllers.length === 0) {
            return undefined;
        }

        if (!(services[0] instanceof Service)) {
            return AccessoryLoader.parseAccessoryJSON({
                displayName: displayName,
                services: services,
            });
        } else {
            const accessoryUUID = uuid.generate(accessoryType + ":" + (uuidBase || displayName));
            const accessory = new Accessory(displayName, accessoryUUID);

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

            if (accessoryInstance.identify) {
                accessory.on(AccessoryEventTypes.IDENTIFY, (paired, callback) => {
                    accessoryInstance.identify(() => { });

                    callback();
                });
            }

            const informationService = accessory.getService(Service.AccessoryInformation);

            services.forEach(service => {
                if (service instanceof Service.AccessoryInformation) {
                    service.setCharacteristic(Characteristic.Name, displayName);
                    service.getCharacteristic(Characteristic.Identify).removeAllListeners(CharacteristicEventTypes.SET);

                    informationService.replaceCharacteristicsFromService(service);
                } else {
                    accessory.addService(service);
                }
            });

            if (informationService.getCharacteristic(Characteristic.FirmwareRevision).value === "0.0.0") {
                informationService.setCharacteristic(Characteristic.FirmwareRevision, plugin.version);
            }

            controllers.forEach(controller => {
                accessory.configureController(controller);
            });

            return accessory;
        }
    }

    handleRegisterPlatformAccessories(accessories) {
        const hapAccessories = accessories.map(accessory => {
            this.cachedPlatformAccessories.push(accessory);

            const plugin = this.pluginManager.getPlugin(accessory._associatedPlugin);

            if (plugin) {
                const informationService = accessory.getService(Service.AccessoryInformation);

                if (informationService && informationService.getCharacteristic(Characteristic.FirmwareRevision).value === "0.0.0") {
                    informationService.setCharacteristic(Characteristic.FirmwareRevision, plugin.version);
                }

                const platforms = plugin.getActiveDynamicPlatform(accessory._associatedPlatform);

                if (!platforms) {
                    log.warn("The plugin '%s' registered a new accessory for the platform '%s'. The platform couldn't be found though!", accessory._associatedPlugin, accessory._associatedPlatform);
                }
            } else {
                log.warn("A platform configured a new accessory under the plugin name '%s'. However no loaded plugin could be found for the name!", accessory._associatedPlugin);
            }

            return accessory._associatedHAPAccessory;
        });

        this.bridge.addBridgedAccessories(hapAccessories);
        this.saveCachedPlatformAccessoriesOnDisk();
    }

    handleUpdatePlatformAccessories(accessories) {
        this.saveCachedPlatformAccessoriesOnDisk();
    }

    handleUnregisterPlatformAccessories(accessories) {
        const hapAccessories = accessories.map(accessory => {
            const index = this.cachedPlatformAccessories.indexOf(accessory);
            if (index >= 0) {
                this.cachedPlatformAccessories.splice(index, 1);
            }

            return accessory._associatedHAPAccessory;
        });

        this.bridge.removeBridgedAccessories(hapAccessories);
        this.saveCachedPlatformAccessoriesOnDisk();
    }

    handlePublishExternalAccessories(accessories) {
        const accessoryPin = this.config.bridge.pin;

        accessories.forEach(accessory => {
            let accessoryPort = 0;

            if (this.externalPorts) {
                if (this.nextExternalPort === undefined) {
                    this.nextExternalPort = this.externalPorts.start;
                }

                if (this.nextExternalPort <= this.externalPorts.end) {
                    accessoryPort = this.nextExternalPort++;
                } else {
                    log.warn("External port pool ran out of ports. Fallback to random assign.");
                }
            }

            const hapAccessory = accessory._associatedHAPAccessory;
            const advertiseAddress = mac.generate(hapAccessory.UUID);

            if (this.publishedExternalAccessories.has(advertiseAddress)) {
                throw new Error(`Accessory ${hapAccessory.displayName} experienced an address collision.`);
            } else {
                this.publishedExternalAccessories.set(advertiseAddress, accessory);
            }

            const plugin = this.pluginManager.getPlugin(accessory._associatedPlugin);

            if (plugin) {
                const informationService = hapAccessory.getService(Service.AccessoryInformation);

                if (informationService && informationService.getCharacteristic(Characteristic.FirmwareRevision).value === "0.0.0") {
                    informationService.setCharacteristic(Characteristic.FirmwareRevision, plugin.version);
                }
            } else if (PluginManager.isQualifiedPluginIdentifier(accessory._associatedPlugin)) {
                log.warn("A platform configured a external accessory under the plugin name '%s'. However no loaded plugin could be found for the name!", accessory._associatedPlugin);
            }

            hapAccessory.on(AccessoryEventTypes.LISTENING, (port) => {
                log.info("%s is running on port %s.", hapAccessory.displayName, port);
                log.info("Please add [%s] manually in Home app. Setup Code: %s", hapAccessory.displayName, accessoryPin);
            });

            hapAccessory.publish({
                username: advertiseAddress,
                pincode: accessoryPin,
                category: accessory.category,
                port: accessoryPort,
                mdns: this.config.mdns,
            }, this.allowInsecureAccess);
        });
    }

    teardown() {
        this.saveCachedPlatformAccessoriesOnDisk();
        this.bridge.unpublish();

        for (const accessory of this.publishedExternalAccessories.values()) {
            accessory._associatedHAPAccessory.unpublish();
        }

        this.api.signalShutdown();
    }
}
