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
const Process = require("child_process");

module.exports = (reboot, service) => {
    return new Promise((resolve) => {
        service = service || "hoobs.service";

        if (getPms()) {
            Process.execSync(`systemctl enable ${service}`);

            if (reboot) {
                console.log("---------------------------------------------------------");
                console.log("HOOBS is Installed");
                console.log("Please redirect your browser to http://hoobs.local");
                console.log("---------------------------------------------------------");
                console.log("The HOOBS interface should apear in 5 - 10 minutes");
                console.log("depending on how many plugins you have installed.");
                console.log("---------------------------------------------------------");
            }

            if (!reboot) {
                Process.execSync(`systemctl restart ${service}`);
            }
        }

        resolve();
    });
};

const getPms = function() {
    if (File.existsSync("/usr/bin/dnf")) {
        return "dnf";
    }

    if (File.existsSync("/usr/bin/yum")) {
        return "yum";
    }

    if (File.existsSync("/usr/bin/apt-get")) {
        return "apt";
    }

    return null;
};
