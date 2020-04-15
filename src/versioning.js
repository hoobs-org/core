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

export default class Versioning {
    static checkVersion(version, latest) {
        const current = `${version}`.split(/[.-]+/);
        const release = `${latest}`.split(/[.-]+/);

        const length = Math.max(current.length, release.length);

        for (let i = 0; i < length; i++) {
            let a = 0;
            let b = 0;

            if (i < current.length) {
                a = parseInt(current[i], 10);
            }

            if (i < release.length) {
                b = parseInt(release[i], 10);
            }

            if (Number.isNaN(a) || Number.isNaN(b)) {
                a = "A";
                b = "A";

                if (i < current.length) {
                    a = current[i].toUpperCase();
                }
    
                if (i < release.length) {
                    b = release[i].toUpperCase();
                }
            }

            if (a > b) {
                return false;
            }

            if (b > a) {
                return true;
            }
        }

        return false;
    }
}
