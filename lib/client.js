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
        this.port = port || HBS.config.server.port || 8080;

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
                HBS.log.debug(`[${new Date().toLocaleString()}] "${request.method}" ${request.url}`);
    
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
            auth: new (require("./controllers/auth"))(true),
            users: new (require("./controllers/users"))(true),
            status: new (require("./controllers/status"))(true),
            config: new (require("./controllers/config"))(true)
        }

        HBS.app.use(Express.static(Server.paths.dist));

        HBS.app.get("*", (request, response) => {
            response.sendFile(resolve(Server.paths.dist, "index.html"));
        });
    }

    start() {
        HBS.app.listen(this.port, () => {
            switch ((HBS.config.system || "").toLowerCase()) {
                case "rocket":
                    HBS.log.info(`[${new Date().toLocaleString()}] Rocket listning on port ${this.port || 8080}.`)
                    break;
        
                default:
                    HBS.log.info(`[${new Date().toLocaleString()}] HOOBS listning on port ${this.port || 8080}.`)
                    break;
            }
        });
    }
}
