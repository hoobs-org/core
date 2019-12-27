const Express = require("express");
const Parser = require("body-parser");
const CORS = require("cors");
const File = require("fs-extra");
const Socket = require("express-ws");
const Pty = require("node-pty");

const User = require("./user");
const Cache = require("./cache");
const HBS = require("./instance");
const Server = require("./server");
const Monitor = require("./monitor");

const { join, resolve } = require("path");

module.exports = class API {
    constructor(port, client) {
        this.port = port || HBS.config.server.port || 8080;

        HBS.user = -1;
        HBS.users = [];
        HBS.admin = false;
        HBS.cache = new Cache();

        try {
            HBS.users = JSON.parse(File.readFileSync(join(Server.paths.config, "access.json")));
        } catch (error) {
            if (HBS.debug) {
                console.log(error.message);
                console.log(error.stack);
            }

            HBS.users = [];
        }

        HBS.app = Express();

        this.socket = Socket(HBS.app);

        try {
            this.shell = Pty.fork(process.env.SHELL || "sh", [], {
                name: "xterm-color",
                cwd: Server.paths.config,
                env: process.env
            });
        } catch {
            console.log("Unable to start the terminal");
        }

        this.socket.app.ws("/shell", (ws, request) => {
            if (this.shell && User.validateToken(request.query.a) && User.decode(request.query.a).admin) {
                this.shell.on("data", (data) => {
                    if (ws.readyState === 1) {
                        ws.send(data);
                    }
                });

                ws.on("message", (data) => {
                    this.shell.write(data);
                });
            }
        });

        HBS.log = require("./logger")(this.socket);

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
            "/api/status",
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
            File.appendFileSync(join(Server.paths.config, HBS.name || "", "layout.json"), JSON.stringify({}, null, 4));
        }

        try {
            HBS.layout = JSON.parse(File.readFileSync(join(Server.paths.config, HBS.name || "", "layout.json")));
        } catch (error) {
            if (HBS.debug) {
                console.log(error.message);
                console.log(error.stack);
            }

            HBS.layout = {};
        }

        if (Object.keys(HBS.layout).indexOf("rooms") >= 0 && Object.keys(HBS.layout).indexOf("hidden") >= 0) {
            const current = JSON.parse(JSON.stringify(HBS.layout));

            HBS.layout = {};

            for (let i = 0; i < HBS.users.length; i++) {
                HBS.layout[HBS.users[i].username] = JSON.parse(JSON.stringify(current));
            }

            File.unlinkSync(join(Server.paths.config, HBS.name || "", "layout.json"));
            File.appendFileSync(join(Server.paths.config, HBS.name || "", "layout.json"), JSON.stringify(HBS.layout, null, 4));
        }

        HBS.controllers = {
            auth: new (require("./controllers/auth"))(),
            users: new (require("./controllers/users"))(),
            status: new (require("./controllers/status"))(),
            config: new (require("./controllers/config"))(false),
            system: new (require("./controllers/system"))(),
            service: new (require("./controllers/service"))(),
            plugins: new (require("./controllers/plugins"))(),
            accessories: new (require("./controllers/accessories"))(),
            layout: new (require("./controllers/layout"))(),
            cockpit: new (require("./controllers/cockpit"))()
        }

        if (client) {
            HBS.app.use(Express.static(Server.paths.dist));

            HBS.app.get("*", (request, response) => {
                response.sendFile(resolve(Server.paths.dist, "index.html"));
            });
        }

        HBS.app.use((request, response) => {
            response.status(404);

            response.send({
                error: "invalid request"
            });
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

        Monitor();
    }
}
