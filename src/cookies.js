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

export default class Cookies {
    static set(name, value, minutes) {
        const date = new Date();

        date.setTime(date.getTime() + (minutes * 60000));

        document.cookie = `${name}=${value};expires=${date.toUTCString()};path=/`;
    }

    static get(name) {
        name = `${name}=`;

        const cookies = decodeURIComponent(document.cookie).split(";");

        for(var i = 0; i < cookies.length; i++) {
            var cookie = cookies[i];

            while (cookie.charAt(0) === " ") {
                cookie = cookie.substring(1);
            }
            
            if (cookie.indexOf(name) === 0) {
                const value = cookie.substring(name.length, cookie.length);

                if (!value || value === "" || value === "null") {
                    return null;
                } else {
                    return value;
                }
            }
        }
        
        return null;
    }

    static validate() {
        return new Promise((resolve) => {
            Request.defaults.headers.get["Authorization"] = Cookies.get("token");

            Request.get(`/api/auth/validate`).then((response) => {
                resolve(response.data.valid);
            }).catch(() => {
                resolve(false);
            });
        });
    }

    static decode(value) {
        return decodeURIComponent(Array.prototype.map.call(atob(value), function(c) {
            return `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`
        }).join(""))
    }
}
