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

const HBS = require("./instance");

const Monitor = async function Monitor() {
    HBS.log.monitor("status", {
        version: HBS.server.version,
        running: HBS.server.running,
        status: HBS.server.running ? "running" : "stopped",
        uptime: new Date() - HBS.server.time
    });

    HBS.log.monitor("load", {
        cpu: await System.currentLoad(),
        memory: await System.mem()
    });

    if ((HBS.config.server.polling_seconds || 10) > 0) {
        setTimeout(() => {
            Monitor();
        }, (HBS.config.server.polling_seconds || 10) * 1000);
    }
}

module.exports = Monitor;
