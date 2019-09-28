const Express = require("express");
const Parser = require("body-parser");
const CORS = require("cors");
const File = require("fs-extra");
const Server = require("./server");
const User = require("./user");
const Cache = require("./cache");

const { join, resolve } = require("path");

module.exports = class Client {
    constructor(port) {
        this.port = port || config.server.port || 3000;

        global.user = -1;
        global.users = [];
        global.admin = false;

        global.cache = new Cache();

        if (File.existsSync(join(Server.paths.config, "access.json"))) {
            global.users.push(...JSON.parse(File.readFileSync(join(Server.paths.config, "access.json"))));
        }

        global.log = require("./logger-client")();
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
            if (request.url.indexOf("/api") === 0 && publicRoutes.indexOf(request.url) === -1 && (!request.headers.authorization || !(await User.validateToken(request.headers.authorization)))) {
                return response.status(403).json({
                    error: "unauthorized"
                });
            }

            next();
        });

        if (!File.existsSync(join(Server.paths.config, global.INSTANCE || "", "layout.json"))) {
            File.appendFileSync(join(Server.paths.config, global.INSTANCE || "", "layout.json"), JSON.stringify({}, null, 4));
        }

        global.layout = JSON.parse(File.readFileSync(join(Server.paths.config, global.INSTANCE || "", "layout.json")));

        if (Object.keys(global.layout).indexOf("rooms") >= 0 && Object.keys(global.layout).indexOf("hidden") >= 0) {
            global.layout = {};

            for (let i = 0; i < global.users.length; i++) {
                global.layout[global.users[i].username] = JSON.parse(JSON.stringify(global.layout));
            }

            File.unlinkSync(join(Server.paths.config, global.INSTANCE || "", "layout.json"));
            File.appendFileSync(join(Server.paths.config, global.INSTANCE || "", "layout.json"), JSON.stringify(global.layout, null, 4));
        }

        global.controllers = {
            auth: new (require("./controllers/auth"))(),
            users: new (require("./controllers/users"))(),
            config: new (require("./controllers/config"))(true)
        }

        global.app.use(Express.static(Server.paths.dist));

        global.app.get("*", (request, response) => {
            response.sendFile(resolve(Server.paths.dist, "index.html"));
        });

        global.app.use((request, response) => {
            response.status(404);

            response.send({
                error: "invalid request"
            });
        });
    }

    start() {
        global.app.listen(this.port, () => {
            global.log.info(`[${new Date().toLocaleString()}] HOOBS listning on port ${this.port || 8080}.`)
        });
    }
}
