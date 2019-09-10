const Express = require("express");
const Parser = require("body-parser");
const CORS = require("cors");
const File = require("fs-extra");
const Server = require("./server");
const User = require("./user");

const { join } = require("path");

module.exports = class Client {
    constructor(port) {
        this.port = port || config.server.port || 3000;

        global.user = -1;
        global.users = [];
        global.admin = false;

        if (File.existsSync(join(Server.paths.config, "access.json"))) {
            global.users.push(...JSON.parse(File.readFileSync(join(Server.paths.config, "access.json"))));
        }

        global.app = Express();

        global.app.use(CORS({
            origin: "*"
        }));

        global.app.use(Parser.json());

        if (DEBUG) {
            global.app.use((request, response, next) => {
                global.log.debug(`[${new Date().toLocaleString()}] "${request.method}" ${request.url}`);
    
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

        app.use(async function(request, response, next) {
            if (publicRoutes.indexOf(request.url) === -1 && (!request.headers.authorization || !(await User.validateToken(request.headers.authorization)))) {
                return response.status(403).json({
                    error: "unauthorized"
                });
            }

            next();
        });

        if (!File.existsSync(join(Server.paths.config, global.INSTANCE || "", "layout.json"))) {
            File.appendFileSync(join(Server.paths.config, global.INSTANCE || "", "layout.json"), JSON.stringify({
                rooms: [],
                favorites: [],
                hidden: []
            }, null, 4));
        }

        global.layout = JSON.parse(File.readFileSync(join(Server.paths.config, global.INSTANCE || "", "layout.json")));

        global.controllers = {
            auth: new (require("./controllers/auth"))(),
            users: new (require("./controllers/users"))(),
            config: new (require("./controllers/config"))(true)
        }

        global.app.use((request, response) => {
            response.status(404);

            response.send({
                error: "invalid request"
            });
        });
    }

    start() {
        global.app.listen(this.port, () => {
            global.log.info(`[${new Date().toLocaleString()}] API on http://hoobs.local:${this.port}.`)
        });
    }
}
