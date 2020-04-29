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

const HBS = require("../server/instance");

module.exports = class ServiceController {
    constructor() {
        HBS.app.get("/api/service", (request, response) => this.status(request, response));
        HBS.app.post("/api/service/:action", (request, response) => this.control(request, response));
    }

    status(_request, response) {
        response.send({
            version: HBS.server.version,
            running: HBS.server.running,
            status: HBS.server.running ? "running" : "stopped",
            uptime: new Date() - HBS.server.time
        });
    }

    control(request, response) {
        switch (request.params.action) {
            case "start":
                HBS.server.start().then(() => {
                    return response.send({
                        success: true
                    });
                });

                break;

            case "stop":
                HBS.server.stop().then(() => {
                    return response.send({
                        success: true
                    });
                });

                break;

            case "restart":
                HBS.server.restart().then(() => {
                    return response.send({
                        success: true
                    });
                });

                break;
            
            case "clean":
                HBS.server.clean().then(() => {
                    HBS.log.info(`Persist directory removed.`);

                    return response.send({
                        success: true
                    });
                });

                break;
            
            default:
                response.status(404);

                return response.send({
                    error: "invalid request"
                });
        }
    }
}
