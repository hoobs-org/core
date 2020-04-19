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

const File = require("fs");
const Path = require("path");

module.exports = () => {
    return new Promise((resolve) => {
        if (File.existsSync("/home")) {
            const folders = File.readdirSync("/home").filter(file => File.lstatSync(Path.join("/home", file)).isDirectory());

            for (let i = 0; i < folders.length; i++) {
                if (File.existsSync(Path.join("/home", folders[i], ".hoobs/etc/config.json"))) {
                    reConfigure(Path.join("/home", folders[i], ".hoobs/etc/config.json"));
                }
            }
        }

        if (File.existsSync("/root/.hoobs/etc/config.json")) {
            reConfigure("/root/.hoobs/etc/config.json");
        }

        if (File.existsSync("/Users")) {
            const folders = File.readdirSync("/Users").filter(file => File.lstatSync(Path.join("/Users", file)).isDirectory());

            for (let i = 0; i < folders.length; i++) {
                if (File.existsSync(Path.join("/Users", folders[i], ".hoobs/etc/config.json"))) {
                    reConfigure(Path.join("/Users", folders[i], ".hoobs/etc/config.json"));
                }
            }
        }

        if (File.existsSync("/var/root/.hoobs/etc/config.json")) {
            reConfigure("/var/root/.hoobs/etc/config.json");
        }

        resolve();
    });
};

const reConfigure = function(filename) {
    const config = JSON.parse(File.readFileSync(filename));

    if (config.client.port) {
        config.server.port = config.client.port;
    }

    if (config.client.api) {
        if (!Array.isArray(config.client.api)) {
            config.client.api = [config.client.api];
        }

        const instances = [];

        for (let i = 0; i < config.client.api.length; i++) {
            if ((`${config.client.api[i]}`).indexOf("http://") === 0 || (`${config.client.api[i]}`).indexOf("https://") === 0) {
                instances.push(config.client.api[i]);
            }
        }

        if (instances.length > 0) {
            config.client.instances = instances;
        }
    }

    delete config.server.socket;

    delete config.client.domain;
    delete config.client.port;
    delete config.client.config;
    delete config.client.socket;
    delete config.client.api;

    delete config.server.socket;

    File.writeFileSync(filename, JSON.stringify(config, null, 4));
};
