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

const fs = require("fs");
const uuid = require("hap-nodejs").uuid;
const accessoryStorage = require("node-persist").create();
const Bridge = require("hap-nodejs").Bridge;
const Accessory = require("hap-nodejs").Accessory;
const Service = require("hap-nodejs").Service;
const Characteristic = require("hap-nodejs").Characteristic;
const AccessoryLoader = require("hap-nodejs").AccessoryLoader;
const once = require("hap-nodejs/lib/util/once").once;
const Plugin = require("./plugin").Plugin;
const User = require("./user").User;
const API = require("./api").API;
const PlatformAccessory = require("./accessory").PlatformAccessory;
const BridgeSetupManager = require("./bridge").BridgeSetupManager;
const log = require("./logger")._system;
const Logger = require("./logger").Logger;
const mac = require("./mac");

module.exports = {
    Server: Server
}

function Server(opts) {
    opts = opts || {};

    accessoryStorage.initSync({ dir: User.cachedAccessoryPath() });

    this._api = new API();

    this._api.on("registerPlatformAccessories", function (accessories) {
        this._handleRegisterPlatformAccessories(accessories);
    }.bind(this));

    this._api.on("updatePlatformAccessories", function (accessories) {
        this._handleUpdatePlatformAccessories(accessories);
    }.bind(this));

    this._api.on("unregisterPlatformAccessories", function (accessories) {
        this._handleUnregisterPlatformAccessories(accessories);
    }.bind(this));

    this._api.on("publishExternalAccessories", function (accessories) {
        this._handlePublishExternalAccessories(accessories);
    }.bind(this));

    this._config = opts.config || this._loadConfig();
    this._plugins = this._loadPlugins();
    this._cachedPlatformAccessories = this._loadCachedPlatformAccessories();
    this._bridge = this._createBridge();
    this._cleanCachedAccessories = opts.cleanCachedAccessories || false;
    this._hideQRCode = opts.hideQRCode || false;

    this._externalPorts = this._config.ports;
    this._nextExternalPort = undefined;

    this._activeDynamicPlugins = {};
    this._configurablePlatformPlugins = {};
    this._publishedAccessories = {};
    this._setupManager = new BridgeSetupManager();
    this._setupManager.on("newConfig", this._handleNewConfig.bind(this));

    this._setupManager.on("requestCurrentConfig", function (callback) {
        callback(this._config);
    }.bind(this));

    this._allowInsecureAccess = opts.insecureAccess || false;
}

Server.prototype.run = function () {
    this._asyncCalls = 0;
    this._asyncWait = true;

    if (this._config.platforms) {
        this._loadPlatforms();
    }

    if (this._config.accessories) {
        this._loadAccessories();
    }

    this._loadDynamicPlatforms();
    this._configCachedPlatformAccessories();
    this._setupManager.configurablePlatformPlugins = this._configurablePlatformPlugins;
    this._bridge.addService(this._setupManager.service);

    this._asyncWait = false;

    if (this._asyncCalls == 0) {
        this._publish();
    }

    this._api.emit("didFinishLaunching");

    process.send({ event: "api_launched" });
}

Server.prototype._publish = function () {
    const bridgeConfig = this._config.bridge || {};
    const info = this._bridge.getService(Service.AccessoryInformation);

    info.setCharacteristic(Characteristic.Manufacturer, bridgeConfig.manufacturer || "HOOBS");
    info.setCharacteristic(Characteristic.Model, bridgeConfig.model || "HOOBS");
    info.setCharacteristic(Characteristic.SerialNumber, bridgeConfig.username);
    info.setCharacteristic(Characteristic.FirmwareRevision, require("../../package.json").version);

    this._bridge.on("listening", function (port) {
        log.info(`Homebridge is running on port ${port}.`);
    });

    const publishInfo = {
        username: bridgeConfig.username || "CC:22:3D:E3:CE:30",
        port: bridgeConfig.port || 0,
        pincode: bridgeConfig.pin || "031-45-154",
        category: Accessory.Categories.BRIDGE,
        mdns: this._config.mdns
    };

    if (bridgeConfig.setupID && bridgeConfig.setupID.length === 4) {
        publishInfo["setupID"] = bridgeConfig.setupID;
    }

    this._bridge.publish(publishInfo, this._allowInsecureAccess);
    this._printSetupInfo();

    process.send({ event: "running" });
}

Server.prototype._loadPlugins = function (accessories, platforms) {
    const plugins = {};
    const activePlugins = this._computeActivePluginList();

    let foundOnePlugin = false;

    Plugin.installed().forEach(function (plugin) {
        if (activePlugins !== undefined && activePlugins[plugin.name()] !== true) {
            return;
        }

        try {
            plugin.load();
        } catch (err) {
            log.error(`Error loading plugin "${plugin.name()}".`);
            log.error(err.stack);

            plugin.loadError = err;
        }

        if (!plugin.loadError) {
            plugins[plugin.name()] = plugin;

            log.info(`Loaded plugin "${plugin.name()}".`);

            plugin.initializer(this._api);

            foundOnePlugin = true;
        }
    }.bind(this));

    if (!foundOnePlugin) {
        log.warn("No plugins found.");
    }

    return plugins;
}

Server.prototype._loadConfig = function () {
    const configPath = User.configPath();

    if (!fs.existsSync(configPath)) {
        log.warn(`config.json "${configPath}" not found.`);

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
        config = JSON.parse(fs.readFileSync(configPath));
    } catch (err) {
        log.error("There was a problem reading your config.json file.");

        throw err;
    }

    if (config.ports !== undefined) {
        if (config.ports.start > config.ports.end) {
            log.error("Invalid port pool configuration. End should be greater than or equal to start.");

            config.ports = undefined;
        }
    }

    if (!/^([0-9A-F]{2}:){5}([0-9A-F]{2})$/.test(config.bridge.username)) {
        throw new Error(`Not a valid username: "${config.bridge.username}".`);
    }

    log.info(`Loaded config.json with ${(config.accessories && config.accessories.length) || 0} accessories and ${(config.platforms && config.platforms.length) || 0} platforms.`);

    return config;
}

Server.prototype._loadCachedPlatformAccessories = function () {
    const cachedAccessories = accessoryStorage.getItem("cachedAccessories");
    const platformAccessories = [];

    if (cachedAccessories) {
        for (let index in cachedAccessories) {
            const serializedAccessory = cachedAccessories[index];
            const platformAccessory = new PlatformAccessory(serializedAccessory.displayName, serializedAccessory.UUID, serializedAccessory.category);

            platformAccessory._configFromData(serializedAccessory);

            platformAccessories.push(platformAccessory);
        }
    }

    return platformAccessories;
}

Server.prototype._computeActivePluginList = function () {
    if (this._config.plugins === undefined) {
        return undefined;
    }

    const activePlugins = {};

    for (let i = 0; i < this._config.plugins.length; i++) {
        activePlugins[this._config.plugins[i]] = true;
    }

    return activePlugins;
}

Server.prototype._createBridge = function () {
    return new Bridge((this._config.bridge || {}).name || "HOOBS", uuid.generate("HomeBridge"));
}

Server.prototype._loadAccessories = function () {
    log.info(`Loading ${this._config.accessories.length} accessories...`);

    for (let i = 0; i < this._config.accessories.length; i++) {
        const accessoryConfig = this._config.accessories[i];
        const accessoryType = accessoryConfig["accessory"];
        const accessoryConstructor = this._api.accessory(accessoryType);

        if (!accessoryConstructor) {
            throw new Error(`Your config.json is requesting the accessory "${accessoryType}" which has not been published by any installed plugins.`);
        }

        const accessoryLogger = Logger.withPrefix(accessoryConfig["name"]);

        accessoryLogger(`Initializing ${accessoryType} accessory...`);

        const accessoryInstance = new accessoryConstructor(accessoryLogger, accessoryConfig);

        this._bridge.addBridgedAccessory(this._createAccessory(accessoryInstance, accessoryConfig["name"], accessoryType, accessoryConfig.uuid_base));
    }
}

Server.prototype._loadPlatforms = function () {
    log.info(`Loading ${this._config.platforms.length} platforms...`);

    for (let i = 0; i < this._config.platforms.length; i++) {
        const platformConfig = this._config.platforms[i];
        const platformType = platformConfig["platform"];
        const platformConstructor = this._api.platform(platformType);

        if (!platformConstructor) {
            throw new Error(`Your config.json is requesting the platform "${platformType}" which has not been published by any installed plugins.`);
        }

        const platformLogger = Logger.withPrefix(platformConfig["name"] || platformType);

        platformLogger(`Initializing ${platformType} platform...`);

        const platformInstance = new platformConstructor(platformLogger, platformConfig, this._api);

        if (platformInstance.configureAccessory == undefined) {
            this._loadPlatformAccessories(platformInstance, platformLogger, platformType);
        } else {
            this._activeDynamicPlugins[platformType] = platformInstance;
        }

        if (platformInstance.configurationRequestHandler != undefined) {
            this._configurablePlatformPlugins[platformType] = platformInstance;
        }
    }
}

Server.prototype._loadDynamicPlatforms = function () {
    for (let dynamicPluginName in this._api._dynamicPlatforms) {
        if (!this._activeDynamicPlugins[dynamicPluginName] && !this._activeDynamicPlugins[dynamicPluginName.split(".")[1]]) {
            process.send({ event: "info_log", data: `Load ${dynamicPluginName}` });

            const platformConstructor = this._api._dynamicPlatforms[dynamicPluginName];
            const platformLogger = Logger.withPrefix(dynamicPluginName);
            const platformInstance = new platformConstructor(platformLogger, null, this._api);

            this._activeDynamicPlugins[dynamicPluginName] = platformInstance;

            if (platformInstance.configurationRequestHandler != undefined) {
                this._configurablePlatformPlugins[dynamicPluginName] = platformInstance;
            }
        }
    }
}

Server.prototype._configCachedPlatformAccessories = function () {
    const verifiedAccessories = [];

    for (let index in this._cachedPlatformAccessories) {
        const accessory = this._cachedPlatformAccessories[index];

        if (!(accessory instanceof PlatformAccessory)) {
            process.send({ event: "error_log", data: "Unexpected Accessory" });

            continue;
        }

        const platformInstance = this._activeDynamicPlugins[accessory._associatedPlugin + "." + accessory._associatedPlatform];

        if (!platformInstance) {
            platformInstance = this._activeDynamicPlugins[accessory._associatedPlatform];
        }

        if (platformInstance) {
            platformInstance.configureAccessory(accessory);
        } else {
            process.send({ event: "error_log", data: `Failed to find plugin to handle accessory ${accessory.displayName}` });

            if (this._cleanCachedAccessories) {
                process.send({ event: "info_log", data: `Removing orphaned accessory ${accessory.displayName}` });

                continue;
            }
        }
        verifiedAccessories.push(accessory);
        accessory._prepareAssociatedHAPAccessory();

        this._bridge.addBridgedAccessory(accessory._associatedHAPAccessory);
    }

    this._cachedPlatformAccessories = verifiedAccessories;
}

Server.prototype._loadPlatformAccessories = function (platformInstance, log, platformType) {
    this._asyncCalls++;

    platformInstance.accessories(once(function (foundAccessories) {
        this._asyncCalls--;

        for (let i = 0; i < foundAccessories.length; i++) {
            const accessoryInstance = foundAccessories[i];

            log(`Initializing platform accessory "${accessoryInstance.name}"...`);

            this._bridge.addBridgedAccessory(this._createAccessory(accessoryInstance, accessoryInstance.name, platformType, accessoryInstance.uuid_base));
        }

        if (this._asyncCalls === 0 && !this._asyncWait) {
            this._publish();
        }
    }.bind(this)));
}

Server.prototype._createAccessory = function (accessoryInstance, displayName, accessoryType, uuid_base) {
    const services = accessoryInstance.getServices();

    if (!(services[0] instanceof Service)) {
        return AccessoryLoader.parseAccessoryJSON({
            displayName: displayName,
            services: services
        });
    } else {
        const accessory = new Accessory(displayName, uuid.generate(accessoryType + ":" + (uuid_base || displayName)));

        accessory.on("service-characteristic-change", () => {
            process.send({ event: "accessory_change" });
        });

        if (accessoryInstance.identify) {
            accessory.on("identify", function (_paired, callback) { accessoryInstance.identify(callback); });
        }

        services.forEach(function (service) {
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

Server.prototype._handleRegisterPlatformAccessories = function (accessories) {
    const hapAccessories = [];

    for (let index in accessories) {
        const accessory = accessories[index];

        accessory._prepareAssociatedHAPAccessory();
        hapAccessories.push(accessory._associatedHAPAccessory);

        this._cachedPlatformAccessories.push(accessory);
    }

    this._bridge.addBridgedAccessories(hapAccessories);
    this._updateCachedAccessories();
}

Server.prototype._handleUpdatePlatformAccessories = function (accessories) {
    this._updateCachedAccessories();
}

Server.prototype._handleUnregisterPlatformAccessories = function (accessories) {
    const hapAccessories = [];

    for (let index in accessories) {
        const accessory = accessories[index];

        if (accessory._associatedHAPAccessory) {
            hapAccessories.push(accessory._associatedHAPAccessory);
        }

        for (let targetIndex in this._cachedPlatformAccessories) {
            if (this._cachedPlatformAccessories[targetIndex].UUID === accessory.UUID) {
                this._cachedPlatformAccessories.splice(targetIndex, 1);

                break;
            }
        }
    }

    this._bridge.removeBridgedAccessories(hapAccessories);
    this._updateCachedAccessories();
}

Server.prototype._handlePublishExternalAccessories = function (accessories) {
    const accessoryPin = (this._config.bridge || {}).pin || "031-45-154";

    for (let index in accessories) {
        const accessory = accessories[index];

        let accessoryPort = 0;

        if (this._externalPorts) {
            if (this._nextExternalPort > this._externalPorts.end) {
                log.info("External port pool ran out of ports. Fallback to random assign.");

                accessoryPort = 0;
            } else {
                if (this._nextExternalPort !== undefined) {
                    accessoryPort = this._nextExternalPort;

                    this._nextExternalPort += 1;
                } else {
                    accessoryPort = this._externalPorts.start;

                    this._nextExternalPort = this._externalPorts.start + 1;
                }
            }
        }

        accessory._prepareAssociatedHAPAccessory();

        const hapAccessory = accessory._associatedHAPAccessory;
        const advertiseAddress = mac.generate(accessory.UUID);

        if (this._publishedAccessories[advertiseAddress]) {
            throw new Error("Accessory " + accessory.displayName + " experienced an address collision.");
        } else {
            this._publishedAccessories[advertiseAddress] = accessory;
        }

        (function (name) {
            hapAccessory.on("listening", function (port) {
                log.info(`${name} is running on port ${port}.`);
            });
        })(accessory.displayName);

        hapAccessory.publish({
            username: advertiseAddress,
            pincode: accessoryPin,
            category: accessory.category,
            port: accessoryPort,
            mdns: this._config.mdns
        }, this._allowInsecureAccess);
    }
}

Server.prototype._updateCachedAccessories = function () {
    const serializedAccessories = [];

    for (let index in this._cachedPlatformAccessories) {
        serializedAccessories.push(this._cachedPlatformAccessories[index]._dictionaryPresentation());
    }

    accessoryStorage.setItemSync("cachedAccessories", serializedAccessories);
}

Server.prototype._teardown = function () {
    const self = this;

    self._updateCachedAccessories();
    self._bridge.unpublish();

    Object.keys(self._publishedAccessories).forEach(function (advertiseAddress) {
        self._publishedAccessories[advertiseAddress]._associatedHAPAccessory.unpublish();
    });
}

Server.prototype._handleNewConfig = function (type, name, replace, config) {
    if (type === "accessory") {
        if (!this._config.accessories) {
            this._config.accessories = [];
        }

        if (!replace) {
            this._config.accessories.push(config);
        } else {
            let targetName;

            if (name.indexOf(".") !== -1) {
                targetName = name.split(".")[1];
            }

            let found = false;

            for (let index in this._config.accessories) {
                const accessoryConfig = this._config.accessories[index];

                if (accessoryConfig.accessory === name) {
                    this._config.accessories[index] = config;

                    found = true;

                    break;
                }

                if (targetName && (accessoryConfig.accessory === targetName)) {
                    this._config.accessories[index] = config;

                    found = true;

                    break;
                }
            }

            if (!found) {
                this._config.accessories.push(config);
            }
        }
    } else if (type === "platform") {
        if (!this._config.platforms) {
            this._config.platforms = [];
        }

        if (!replace) {
            this._config.platforms.push(config);
        } else {
            let targetName;

            if (name.indexOf(".") !== -1) {
                targetName = name.split(".")[1];
            }

            let found = false;

            for (let index in this._config.platforms) {
                const platformConfig = this._config.platforms[index];

                if (platformConfig.platform === name) {
                    this._config.platforms[index] = config;

                    found = true;

                    break;
                }

                if (targetName && (platformConfig.platform === targetName)) {
                    this._config.platforms[index] = config;

                    found = true;

                    break;
                }
            }

            if (!found) {
                this._config.platforms.push(config);
            }
        }
    }

    fs.writeFileSync(User.configPath(), JSON.stringify(this._config, null, 4), "utf8");
}

Server.prototype._printSetupInfo = function () {
    process.send({ event: "setup_uri", data: this._bridge.setupURI() });
}
