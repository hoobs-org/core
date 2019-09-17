const Express = require("express");
const Parser = require("body-parser");
const CORS = require("cors");
const File = require("fs-extra");
const Socket = require("express-ws");
const Pty = require("node-pty-prebuilt-multiarch");
const Server = require("./server");
const Monitor = require("./monitor");
const User = require("./user");

const { join } = require("path");

module.exports = class API {
    constructor(port) {
        this.port = port || config.server.port || 3000;

        global.user = -1;
        global.users = [];
        global.admin = false;

        if (File.existsSync(join(Server.paths.config, "access.json"))) {
            global.users.push(...JSON.parse(File.readFileSync(join(Server.paths.config, "access.json"))));
        }

        global.app = Express();

        this.socket = Socket(global.app);

        this.socket.app.ws("/shell", (ws) => {
            const shell = Pty.fork(process.env.SHELL || "sh", [], {
                name: "xterm-color",
                cwd: process.env.HOME
            });

            shell.on("data", (data) => {
                ws.send(data);
            });

            ws.on("message", (data) => {
                shell.write(data);
            });
        });

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
            "/api/status",
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
                hidden: [],
                names: {}
            }, null, 4));
        }

        global.layout = JSON.parse(File.readFileSync(join(Server.paths.config, global.INSTANCE || "", "layout.json")));

        global.controllers = {
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
            global.log.info(`[${new Date().toLocaleString()}] API on port ${this.port || 51827}.`)

            if (global.ui) {
                global.log.info(`[${new Date().toLocaleString()}] Client on port ${config.client.port || 8080}.`);
            }

            if (!global.socketClient) {
                global.log.info(`[${new Date().toLocaleString()}] Logging on port ${config.server.socket || 51828}.`);
            }
        });
    }
}
