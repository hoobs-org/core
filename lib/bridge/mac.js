/**************************************************************************************************
 * homebridge                                                                                     *
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

const crypto = require("crypto");

module.exports = {
    generate: generate
}

function generate(data) {
    const sha1sum = crypto.createHash("sha1");

    sha1sum.update(data);

    let s = sha1sum.digest("hex");
    let i = -1;

    return "xx:xx:xx:xx:xx:xx".replace(/[x]/g, function () {
        i += 1;

        return s[i];
    }).toUpperCase();
}
