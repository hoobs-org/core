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

const File = require("fs-extra");

module.exports = {
    admin: false,
    api: null,
    app: null,
    application: null,
    cache: null,
    client: null,
    config: null,
    controllers: null,
    debug: false,
    layout: null,
    log: null,
    mode: "default",
    name: null,

    options: [
        "-r"
    ],

    server: null,
    storage: null,
    sudo: null,
    user: null,
    users: null,
    cpmod: true,
    plugins: {},
    docker: false,
    active: [],

    JSON: {
        tryParse: function(value, replacement) {
            replacement = replacement || null;

            try {
                return JSON.parse(value);
            } catch {
                return replacement;
            }
        },

        load: function(filename, replacement) {
            replacement = replacement || null;
        
            try {
                return JSON.parse(File.readFileSync(filename));
            } catch {
                return replacement;
            }
        },

        validateFile: function(filename) {
            if (File.existsSync(filename)) {
                try {
                    if (typeof (JSON.parse(File.readFileSync(filename))) === "object") {
                        return true;
                    }

                    return false;
                } catch {
                    return false;
                }
            }

            return false;
        },

        equals: function(source, value) {
            if (JSON.stringify(source) === JSON.stringify(value)) {
                return true;
            }

            return false;
        },

        clone: function(object) {
            return JSON.parse(JSON.stringify(object));
        },

        toString: function(object) {
            return JSON.stringify(object, null, 4);
        }
    }
};
