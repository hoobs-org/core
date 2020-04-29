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

const HBS = require("../server/instance");
const HAP = require("hap-nodejs");
const File = require("fs-extra");
const User = require("./user");
const Server = require("./server");
const Plugin = require("./plugin");
const Program = require("commander");

const { dirname, join } = require("path");
const { internal } = require("./logger");

module.exports = () => {
    let removeOrphans = false
    let terminating = false;

    HBS.application = HBS.JSON.load(join(dirname(File.realpathSync(__filename)), "../package.json"));

    Program.version(HBS.application.version)
        .allowUnknownOption()
        .option("-d, --debug", "turn on debug level logging", function () { require("./logger").setDebug(true); })
        .option("-p, --plugin-path [path]", "look for plugins installed at [path] as well as the default locations ([path] can also point to a single plugin)", function (p) { Plugin.addPluginPath(p); })
        .option("-r, --remove-orphans", "remove cached accessories for which plugin is not loaded", function () { removeOrphans = true; })
        .option("-u, --user-storage-path [path]", "look for bridge user files at [path]", function (p) { User.setStoragePath(p); })
        .parse(process.argv);

    HAP.init(User.persistPath());

    const server = new Server({
        removeOrphans
    });

    const signals = {
        SIGINT: 2,
        SIGTERM: 15
    };

    Object.keys(signals).forEach(function (signal) {
        process.on(signal, function () {
            if (terminating) {
                return;
            }

            terminating = true;

            internal.info(`Got ${signal}, shutting down Bridge...`);
            server.teardown();

            setTimeout(function () {
                process.exit(128 + signals[signal]);
            }, 1000)

            server.api.emit("shutdown");
            process.send({ event: "shutdown" })
        });
    });

    process.on("uncaughtException", function (error) {
        internal.error(error.stack);

        if (!terminating) {
            process.kill(process.pid, "SIGTERM");
        }
    });

    server.run();
}
