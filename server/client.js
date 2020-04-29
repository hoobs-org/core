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

const CORS = require("cors");
const File = require("fs-extra");
const Express = require("express");
const Parser = require("body-parser");

const User = require("./user");
const Cache = require("./cache");
const HBS = require("./instance");
const Server = require("./server");

const { join, resolve } = require("path");

module.exports = class Client {
    constructor(port) {
        this.port = port || HBS.config.server.port || 80;

        HBS.user = -1;
        HBS.admin = false;
        HBS.cache = new Cache();
        HBS.users = HBS.JSON.load(join(Server.paths.config, "access.json"), []);
        HBS.log = require("./logger-client")();
        HBS.app = Express();

        HBS.app.use(CORS({
            origin: HBS.config.server.origin
        }));

        HBS.app.use(Parser.json());

        if (HBS.debug) {
            HBS.app.use((request, response, next) => {
                HBS.log.debug(`"${request.method}" ${request.url}`);
    
                next();
            });
        }

        const publicRoutes = [
            "/api/auth",
            "/api/auth/logon",
            "/api/auth/create",
            "/api/auth/validate",
            "/api/config"
        ];

        HBS.app.use(async function(request, response, next) {
            if (request.url.indexOf("/api") === 0 && publicRoutes.indexOf(request.url) === -1 && (!request.headers.authorization || !(await User.validateToken(request.headers.authorization)))) {
                return response.status(403).json({
                    error: "unauthorized"
                });
            }

            next();
        });

        if (!File.existsSync(join(Server.paths.config, HBS.name || "", "layout.json"))) {
            File.appendFileSync(join(Server.paths.config, HBS.name || "", "layout.json"), HBS.JSON.toString({}));
        }

        HBS.layout = HBS.JSON.load(join(Server.paths.config, HBS.name || "", "layout.json"), {});

        if (Object.keys(HBS.layout).indexOf("rooms") >= 0 && Object.keys(HBS.layout).indexOf("hidden") >= 0) {
            HBS.layout = {};

            for (let i = 0; i < HBS.users.length; i++) {
                HBS.layout[HBS.users[i].username] = HBS.JSON.clone(HBS.layout);
            }

            File.unlinkSync(join(Server.paths.config, HBS.name || "", "layout.json"));
            File.appendFileSync(join(Server.paths.config, HBS.name || "", "layout.json"), HBS.JSON.toString(HBS.layout));
        }

        HBS.controllers = {
            auth: new (require("../controllers/auth"))(true),
            users: new (require("../controllers/users"))(true),
            status: new (require("../controllers/status"))(true),
            config: new (require("../controllers/config"))(true)
        }

        HBS.app.use(Express.static(Server.paths.interface));

        HBS.app.get("*", (_request, response) => {
            response.sendFile(resolve(Server.paths.interface, "index.html"));
        });
    }

    start() {
        HBS.app.listen(this.port, () => {
            HBS.log.info(`HOOBS listening on port ${this.port || 80}.`);
        });
    }
}
