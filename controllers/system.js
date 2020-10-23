/**************************************************************************************************
 * hoobs-core                                                                                     *
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

const System = require("systeminformation");

const HBS = require("../server/instance");
const Plugins = require("../server/plugins");

module.exports = class SystemController {
    constructor() {
        HBS.app.get("/api/system", (request, response) => this.info(request, response));
        HBS.app.get("/api/system/cpu", (request, response) => this.cpu(request, response));
        HBS.app.get("/api/system/memory", (request, response) => this.memory(request, response));
        HBS.app.get("/api/system/filesystem", (request, response) => this.filesystem(request, response));
        HBS.app.get("/api/system/activity", (request, response) => this.activity(request, response));
        HBS.app.get("/api/system/releases", (request, response) => this.releases(request, response));
        HBS.app.get("/api/system/updates", (request, response) => this.updates(request, response));
    }

    async info(_request, response) {
        const data = {
            system: await System.system(),
            operating_system: await System.osInfo()
        };

        switch (HBS.config.system) {
            case "rocket":
                data.system.manufacturer = "Rocket Smart Home";
                data.system.model = "RFLM-1";
                data.system.sku = "7-45114-12418-0";
                break;

            case "hoobs-box":
                data.system.manufacturer = "HOOBS.org";
                data.system.model = "HSLF-1";
                data.system.sku = "7-45114-12419-7";
                break;
        }
    
        return response.send(data);
    }

    async cpu(_request, response) {
        return response.send({
            information: await System.cpu(),
            speed: await System.cpuCurrentspeed(),
            load: await System.currentLoad(),
            cache: await System.cpuCache()
        });
    }

    async memory(_request, response) {
        return response.send({
            information: await System.memLayout(),
            load: await System.mem()
        });
    }

    async activity(_request, response) {
        return response.send(await System.currentLoad());
    }

    async filesystem(_request, response) {
        return response.send(await System.fsSize());
    }

    releases(_request, response) {
        Plugins.releases().then((results) => {
            return response.send(results);
        }).catch((error) => {
            return response.status(500).json({
                error
            });
        });
    }

    updates(_request, response) {
        Plugins.releases().then((results) => {
            return response.send(results.filter((r) => {
                return Plugins.checkVersion(HBS.application.version, r.version);
            }));
        }).catch((error) => {
            return response.status(500).json({
                error
            });
        });
   }
}
