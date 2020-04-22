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

const ServerCache = require("node-cache");

module.exports = class Cache {
    constructor() {
        this.client = new ServerCache();
    }

    get(key) {
        const value = this.client.get(key);

        if(value === undefined){
            return null;
        }

        return value;
    }

    set(key, value, age) {
        return this.client.set(key, value, (age || 30) * 60);
    }

    remove(key) {
        this.client.del(key);
    }
}
