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
const Cockpit = require("../server/cockpit");

module.exports = class CockpitController {
    constructor() {
        this.client = null;

        HBS.app.get("/api/cockpit/start", (request, response) => this.start(request, response));
        HBS.app.get("/api/cockpit/disconnect", (request, response) => this.disconnect(request, response));
    }

    start(_request, response) {
        this.client = new Cockpit();

        this.client.start(false).then((registration) => {
            return response.send({
                registration
            });
        }).catch(() => {
            return response.send({
                error: "Unable to Connect"
            });
        });
    }

    disconnect(_request, response) {
        if (this.client) {
            this.client.disconnect();
        }

        return response.send({
            success: true
        });
    }
}
