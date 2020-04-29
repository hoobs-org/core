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

const Forms = require("formidable");

const HBS = require("../server/instance");
const Server = require("../server/server");

const { join } = require("path");

module.exports = class StatusController {
    constructor(client) {
        this.client = client || false;

        HBS.app.get("/api/status", (request, response) => this.info(request, response));
        HBS.app.put("/api/reboot", (request, response) => this.reboot(request, response));
        HBS.app.put("/api/shutdown", (request, response) => this.shutdown(request, response));

        if (!this.client) {
            HBS.app.post("/api/backup", (request, response) => this.backup(request, response));
            HBS.app.post("/api/restore", (request, response) => this.restore(request, response));
            HBS.app.put("/api/update", (request, response) => this.update(request, response))        
            HBS.app.put("/api/reset", (request, response) => this.reset(request, response));
        }
    }

    reboot(_request, response) {
        Server.reboot();

        return response.send({
            success: true
        });
    }

    shutdown(_request, response) {
        Server.shutdown();

        return response.send({
            success: true
        });
    }

    async update(_request, response) {	
        if (!HBS.admin) {	
            return response.status(403).json({	
                error: "unauthorized"	
            });
        }

        if (HBS.docker) {
            return response.send({
                error: "Update is not supported on Docker images"
            });
        }

        await Server.update();

        return response.send({
            success: true
        });
    }

    backup(_request, response) {
        Server.backup();

        return response.send({
            success: true
        });
    }

    restore(request, response) {
        if (!HBS.admin) {	
            return response.status(403).json({	
                error: "unauthorized"	
            });	
        }

        const form = new Forms.IncomingForm({
            maxFileSize: 5 * 1024 * 1024 * 1024
        });

        form.parse(request, (_error, _fields, files) => {
            Server.restore(files.file);

            return response.send({
                success: true
            });
        });
    }

    reset(_request, response) {
        if (!HBS.admin) {	
            return response.status(403).json({	
                error: "unauthorized"	
            });	
        }

        Server.reset();

        return response.send({
            success: true
        });
    }

    info(_request, response) {
        const data = {};

        if (this.client) {
            data.hoobs_version = HBS.application.version;
            data.node_version = (process.version || "").replace(/v/gi, "");
        } else {
            data.bridge_name = HBS.config.bridge.name || "";
            data.hoobs_version = HBS.application.version;
            data.node_version = (process.version || "").replace(/v/gi, "");
            data.username = HBS.config.bridge.username || "";
            data.homebridge_port = HBS.config.bridge.port || 51826;
            data.home_setup_pin = HBS.config.bridge.pin || "";
            data.home_setup_id = HBS.config.server.home_setup_id;    
        }

        if (HBS.admin) {
            data.application_path = Server.paths.application;
            data.configuration_path = join(Server.paths.config, HBS.name || "");
            data.local_modules_path = `${Server.paths.modules.local}${HBS.config.package_manager === "yarn" ? " (yarn)" : ""}`;
            data.global_modules_path = Server.paths.modules.global;
        }

        return response.send(data);
    }
}
