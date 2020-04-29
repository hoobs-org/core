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

const Program = require("commander");

const HBS = require("./instance");
const API = require("./api");
const Client = require("./client");
const Server = require("./server");

const { join } = require("path");

const teardown = function teardown(status) {
    if (HBS) {
        if (HBS.log) {
            HBS.log.info("[HOOBS] Stopping server.");
        }

        HBS.api = null;
        HBS.app = null;
        HBS.application = null;
        HBS.cache = null;
        HBS.client = null;
        HBS.config = null;
        HBS.controllers = null;
        HBS.layout = null;
        HBS.log = null;
        HBS.options = null;
        HBS.server = null;
        HBS.user = null;
        HBS.users = null;
        HBS.cpmod = null;
    }

    process.exit(status || 0);
};

module.exports = async (docker) => {
    HBS.docker = docker;
    HBS.application = HBS.JSON.load(join(Server.paths.application, "/package.json"));

    Program.version(HBS.application.version, "-v, --version");
    Program.allowUnknownOption();

    Program.option("-d, --debug", "turn on debug level logging", () => {
                HBS.debug = true;
                HBS.options.push("-d");
            })
           .option("-i, --instance [name]", "start HOOBS as a named instance", (name) => {
                HBS.name = name;
                HBS.mode = "server";
            })
           .option("-p, --pass [password]", "password to use for elevated commands", (password) => {
                HBS.sudo = password;
            })
           .option("-c, --container", "run in container mode", () => {
                HBS.docker = true;
            })
           .option("--ignore-modules", "don't coppy modules on start (development)", () => {
                HBS.cpmod = false;
            })
           .action((command) => {
                if(typeof command === "string") {
                    HBS.mode = command;
                }
            });        

    Program.parse(process.argv);

    process.on("unhandledRejection", (reason, promise) => {
        console.log(`Unhandled Rejection "${reason}".`);

        promise.catch((error) => {
            if (HBS.debug) {
                console.log(error.stack);
            }
        });
    });

    HBS.config = await Server.configure();

    switch ((HBS.config.system || "").toLowerCase()) {
        case "hoobs-box":
            HBS.config.system = "hoobs-box";
            break;

        default:
            HBS.config.system = "hoobs";
            break;
    }

    switch (HBS.mode) {
        case "server":
            HBS.api = new API(null, false);
            HBS.server = new Server(HBS.options);
        
            process.once("SIGINT", async () => {
                await HBS.server.stop();

                teardown();
            });

            process.once("SIGTERM", async () => {
                await HBS.server.stop();

                teardown();
            });
        
            process.once("uncaughtException", async (error) => {
                console.log(error.message);
                console.log(error.stack);

                await HBS.server.stop();

                teardown(1);
            });

            HBS.api.start();
            
            if (!Number.isNaN(parseInt(HBS.config.server.autostart))) {
                setTimeout(() => {
                    HBS.server.start();
                }, HBS.config.server.autostart * 1000);
            }

            break;

        case "client":
            HBS.client = new Client();
            HBS.client.start();

            break;

        default:
            HBS.api = new API(null, true);
            HBS.server = new Server(HBS.options);

            process.once("SIGINT", async () => {
                await HBS.server.stop();

                teardown();
            });

            process.once("SIGTERM", async () => {
                await HBS.server.stop();

                teardown();
            });
        
            process.once("uncaughtException", async (error) => {
                console.log(error.message);
                console.log(error.stack);

                await HBS.server.stop();

                teardown(1);
            });

            HBS.api.start();

            if (!Number.isNaN(parseInt(HBS.config.server.autostart))) {
                setTimeout(() => {
                    HBS.server.start();
                }, HBS.config.server.autostart * 1000);
            }

            break;
    }
};
