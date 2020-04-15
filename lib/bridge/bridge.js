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
const Service = require("hap-nodejs").Service;
const Characteristic = require("hap-nodejs").Characteristic;
const SetupSession = require("./session").SetupSession;

module.exports = {
    BridgeSetupManager: BridgeSetupManager
}

function BridgeSetupManager() {
    this.session;
    this.service = new Service(null, "49FB9D4D-0FEA-4BF1-8FA6-E7B18AB86DCE");

    this.stateCharacteristic = new Characteristic("State", "77474A2F-FA98-485E-97BE-4762458774D8", {
        format: Characteristic.Formats.UINT8,
        minValue: 0,
        maxValue: 1,
        minStep: 1,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });

    this.stateCharacteristic.value = 0;
    this.service.addCharacteristic(this.stateCharacteristic);

    this.versionCharacteristic = new Characteristic("Version", "FD9FE4CC-D06F-4FFE-96C6-595D464E1026", {
        format: Characteristic.Formats.STRING,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });

    this.versionCharacteristic.value = "1.0";
    this.service.addCharacteristic(this.versionCharacteristic);

    this.controlPointCharacteristic = new Characteristic("Control Point", "5819A4C2-E1B0-4C9D-B761-3EB1AFF43073", {
        format: Characteristic.Formats.DATA,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE, Characteristic.Perms.NOTIFY]
    })

    this.controlPointCharacteristic.on("get", function (callback, context) {
        this.handleReadRequest(callback, context);
    }.bind(this));

    this.controlPointCharacteristic.on("set", function (newValue, callback, context) {
        this.handleWriteRequest(newValue, callback, context);
    }.bind(this));

    this.controlPointCharacteristic.value = null;
    this.service.addCharacteristic(this.controlPointCharacteristic);
}

inherits(BridgeSetupManager, EventEmitter);

BridgeSetupManager.prototype.handleReadRequest = function (callback, context) {
    if (!context) {
        return;
    }

    if (!this.session) {
        callback(null, null);
    } else {
        this.session.handleReadRequest(callback);
    }
}

BridgeSetupManager.prototype.handleWriteRequest = function (value, callback, context) {
    if (!context) {
        callback();

        return;
    }

    const request = JSON.parse(new Buffer(value, "base64").toString());

    callback();

    if (!this.session || this.session.sessionUUID !== request.sid) {
        if (this.session) {
            this.session.removeAllListeners();
            this.session.validSession = false;
        }

        this.session = new SetupSession(this.stateCharacteristic, this.controlPointCharacteristic);
        this.session.configurablePlatformPlugins = this.configurablePlatformPlugins;

        this.session.on("newConfig", function (type, name, replace, config) {
            this.emit("newConfig", type, name, replace, config);

            process.send({ event: "create_config", data: { type, name, replace, config } });
        }.bind(this));

        this.session.on("requestCurrentConfig", function (callback) {
            this.emit("requestCurrentConfig", callback);

            process.send({ event: "request_config" });
        }.bind(this));

        this.session.on("end", function () {
            this.session = null;
        }.bind(this));
    }

    this.session.handleWriteRequest(request);
}
