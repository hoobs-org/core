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
        HBS.admin = false;
        HBS.cache = new Cache();
        HBS.users = HBS.JSON.load(join(Server.paths.config, HBS.name || "", "access.json"), []);
        HBS.app = Express();

        this.shell = null;
        this.socket = Socket(HBS.app);

        HBS.log = require("./logger")(this.socket);

        this.socket.app.ws("/shell", (ws, request) => {
            if (User.validateToken(request.query.a) && User.decode(request.query.a).admin) {
                if (!this.shell) {
                    try {
                        this.shell = Pty.spawn(process.env.SHELL || "sh", [], {
                            name: "xterm-color",
                            cwd: Server.paths.config,
                            env: process.env
                        });
                    } catch (error) {
                        this.shell = null;

                        HBS.log.push.error("Terminal", "Enable to start terminal");

                        HBS.log.error(error.message);
                        HBS.log.debug(error.stack);
                    }
                }

                if (this.shell) {
                    HBS.log.push.info("Terminal", "Terminal started");

                    this.shell.on("data", (data) => {
                        if (ws.readyState === 1) {
                            ws.send(data);
                        }
                    });

                    ws.on("message", (data) => {
                        switch (data) {
                            case "{CLEAR}":
                                this.shell.write("clear\r");
                                break;

                            case "{EXIT}":
                                HBS.log.push.warning("Terminal", "Terminal stopped");

                                this.shell.write('exit\r');
                                this.shell.destroy();
                                this.shell = null;
                                break;

                            default:
                                this.shell.write(data);
                                break;
                        }
                    });
                }
            }
        });

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
            File.appendFileSync(join(Server.paths.config, HBS.name || "", "layout.json"), HBS.JSON.toString({}));
        }

        HBS.layout = HBS.JSON.load(join(Server.paths.config, HBS.name || "", "layout.json"), {});

        if (Object.keys(HBS.layout).indexOf("rooms") >= 0 && Object.keys(HBS.layout).indexOf("hidden") >= 0) {
            const current = HBS.JSON.clone(HBS.layout);

            HBS.layout = {};

            for (let i = 0; i < HBS.users.length; i++) {
                HBS.layout[HBS.users[i].username] = HBS.JSON.clone(current);
            }

            File.unlinkSync(join(Server.paths.config, HBS.name || "", "layout.json"));
            File.appendFileSync(join(Server.paths.config, HBS.name || "", "layout.json"), HBS.JSON.toString(HBS.layout));
        }

        HBS.controllers = {
            auth: new (require("./controllers/auth"))(false),
            users: new (require("./controllers/users"))(false),
            status: new (require("./controllers/status"))(false),
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

        HBS.server.on("update", () => {
            setTimeout(() => {
                HBS.log.update();
            }, 250);
        });

        Monitor();
    }
}
