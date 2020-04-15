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

import Request from "axios";
import Cookies from "./cookies";

export default class Config {
    constructor () {
        this._index = 0;

        this._ui = {};
        this._configuration = {};
    }

    get server() {
        return this._configuration.server || {};
    }

    get client() {
        return this._ui || {};
    }

    get cluster() {
        return this._cluster;
    }

    get bridge() {
        return this._configuration.bridge || {};
    }

    get description() {
        return this._configuration.description || "";
    }

    get ports() {
        return this._configuration.ports || {};
    }

    get accessories() {
        return this._configuration.accessories || [];
    }

    get platforms() {
        return this._configuration.platforms || [];
    }

    get instance() {
        return this._instances[this._index];
    }

    get count() {
        return this._instances.length;
    }

    list() {
        return new Promise(async (resolve) => {
            this._instances = (await Request.get("/api/config")).data.client.instances || [""];

            if (!Array.isArray(this._instances)) {
                this._instances = [this._instances];
            }

            Request.defaults.headers.get["Authorization"] = Cookies.get("token");

            const queue = [];
            const names = []

            for (let i = 0; i < this._instances.length; i++) {
                names.push("Unavailable");
            }

            for (let i = 0; i < this._instances.length; i++) {
                queue.push(true);

                Request.get(`${this._instances[i]}/api/config`).then((response) => {
                    names[i] = (response.data.bridge || {}).name || "Unavailable";
                }).catch(() => {
                    names[i] = "Unavailable";
                }).finally(() => {
                    queue.pop();

                    if (queue.length === 0) {
                        resolve(names);
                    }
                });
            }

            if (queue.length === 0) {
                resolve(names);
            }
        });
    }

    async active(index) {
        if (!index || index === undefined) {
            index = 0;
        }

        if (index < 0) {
            index = 0;
        }

        if (index >= this._instances.length) {
            index = this._instances.length - 1;
        }

        this._index = index;

        await this.configure();
    }

    async configure() {
        Request.defaults.headers.get["Authorization"] = Cookies.get("token");

        const config = (await Request.get("/api/config")).data;

        this._ui = config.client;
        this._cluster = config.mode === "cluster";
        this._configuration = (await Request.get(`${this.instance}/api/config`)).data;
    }
}
