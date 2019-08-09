const Express = require("express");
const Parser = require("body-parser");
const CORS = require("cors");
const File = require("fs-extra");
const Server = require("./server");
const Monitor = require("./monitor");
const User = require("./user");

module.exports = class API {
    constructor(port) {
        this.port = port || config.server.port || 3000;

        global.user = -1;
        global.users = [];
        global.admin = false;

        if (File.existsSync(Server.paths.config.access)) {
            global.users.push(...JSON.parse(File.readFileSync(Server.paths.config.access)));
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
            "/auth",
            "/auth/logon",
            "/auth/create"
        ];

        app.use(function(request, response, next) {
            if (publicRoutes.indexOf(request.url) === -1 && (!request.headers.authorization || !User.validateToken(request.headers.authorization))) {
                return response.status(403).json({
                    error: "unauthorized"
                });
            }

            next();
        });

        if (!File.existsSync(Server.paths.config.layout)) {
            File.appendFileSync(Server.paths.config.layout, JSON.stringify({
                rooms: [],
                hidden: []
            }, null, 4));
        }

        global.layout = JSON.parse(File.readFileSync(Server.paths.config.layout));

        global.controllers = {
            auth: new (require("./controllers/auth"))(),
            users: new (require("./controllers/users"))(),
            status: new (require("./controllers/status"))(),
            config: new (require("./controllers/config"))(),
            system: new (require("./controllers/system"))(),
            service: new (require("./controllers/service"))(),
            network: new (require("./controllers/network"))(),
            plugins: new (require("./controllers/plugins"))(),
            accessories: new (require("./controllers/accessories"))(),
            layout: new (require("./controllers/layout"))()
        }

        global.app.use((request, response) => {
            response.status(404);

            response.send({
                error: "invalid request"
            });
        });

        Monitor();
    }

    start() {
        global.app.listen(this.port, () => {
            global.log.info(`[${new Date().toLocaleString()}] API on http://hoobs.local:${this.port}.`)

            if (global.ui) {
                global.log.info(`[${new Date().toLocaleString()}] Client on http://hoobs.local:${config.client.port || 3002}.`);
            }

            if (!global.socketClient) {
                global.log.info(`[${new Date().toLocaleString()}] Logging on http://hoobs.local:${config.server.socket || 3001}.`);
            }
        });
    }
}
