const Express = require("express");
const Parser = require("body-parser");
const CORS = require("cors");
const File = require("fs-extra");
const Socket = require("express-ws");
const Pty = require("node-pty-prebuilt-multiarch");
const Server = require("./server");
const Monitor = require("./monitor");
const User = require("./user");
const Cache = require("./cache");

const { join, resolve } = require("path");

module.exports = class API {
    constructor(port, client) {
        this.port = port || config.server.port || 3000;

        global.user = -1;
        global.users = [];
        global.admin = false;

        global.cache = new Cache();

        if (File.existsSync(join(Server.paths.config, "access.json"))) {
            global.users.push(...JSON.parse(File.readFileSync(join(Server.paths.config, "access.json"))));
        }

        global.app = Express();

        this.socket = Socket(global.app);

        this.socket.app.ws("/shell", (ws) => {
            let shell = null;

            try {
                shell = Pty.fork(process.env.SHELL || "sh", [], {
                    name: "xterm-color",
                    cwd: join(process.env.HOME, ".hoobs/etc")
                });
            } catch {
                console.log("Unable to start the terminal");
            }

            if (shell) {
                shell.on("data", (data) => {
                    ws.send(data);
                });

                ws.on("message", (data) => {
                    shell.write(data);
                });
            }
        });

        global.log = require("./logger")(this.socket);

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
            const current = JSON.parse(JSON.stringify(global.layout));

            global.layout = {};

            for (let i = 0; i < global.users.length; i++) {
                global.layout[global.users[i].username] = JSON.parse(JSON.stringify(current));
            }

            File.unlinkSync(join(Server.paths.config, global.INSTANCE || "", "layout.json"));
            File.appendFileSync(join(Server.paths.config, global.INSTANCE || "", "layout.json"), JSON.stringify(global.layout, null, 4));
        }

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

        if (client) {
            global.app.use(Express.static(Server.paths.dist));

            global.app.get("*", (request, response) => {
                response.sendFile(resolve(Server.paths.dist, "index.html"));
            });
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
            global.log.info(`[${new Date().toLocaleString()}] HOOBS listning on port ${this.port || 8080}.`)
        });

        Monitor();
    }
}
