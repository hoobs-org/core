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

const path = require("path");

module.exports = {
    User: User
}

let config;
let customStoragePath;

function User() { }

User.config = function () {
    return config || (config = Config.load(User.configPath()));
}

User.storagePath = function () {
    return customStoragePath;
}

User.configPath = function () {
    return path.join(User.storagePath(), "config.json");
}

User.persistPath = function () {
    return path.join(User.storagePath(), "persist");
}

User.cachedAccessoryPath = function () {
    return path.join(User.storagePath(), "accessories");
}

User.setStoragePath = function (storagePath) {
    customStoragePath = path.resolve(storagePath);
}
