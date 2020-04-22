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

const { join, resolve } = require("path");

let config;
let path;

module.exports = class User {
    static config() {
        return config || (config = Config.load(User.configPath()));
    }
    
    static storagePath() {
        return path;
    }
    
    static configPath() {
        return join(User.storagePath(), "config.json");
    }
    
    static persistPath() {
        return join(User.storagePath(), "persist");
    }
    
    static cachedAccessoryPath() {
        return join(User.storagePath(), "accessories");
    }
    
    static setStoragePath(storagePath) {
        path = resolve(storagePath);
    }
}
