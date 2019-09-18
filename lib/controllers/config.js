const _ = require("lodash");
const File = require("fs-extra");
const Server = require("../server");
const User = require("../user");

const { join } = require("path");

module.exports = class ConfigController {
    constructor(client) {
        this.client = client || false;

        global.app.get("/api/config", (request, response) => this.get(request, response));
        global.app.get("/api/config/client", (request, response) => this.interface(request, response));
        global.app.post("/api/config", (request, response) => this.save(request, response));
        global.app.post("/api/config/backup", (request, response) => this.backup(request, response));

        if (!this.client) {
            global.app.get("/api/config/generate", (request, response) => this.generate(request, response));
        }
    }

    async get(request, response) {
        if (this.client) {
            return response.send({
                client: config.client || {}
            });
        }

        if (!await User.validateToken(request.headers.authorization)) {
            return response.send({
                server: config.server || {},
                client: config.client || {},
                bridge: config.bridge || {}
            });
        }

        return response.send({
            server: config.server || {},
            client: config.client || {},
            bridge: config.bridge || {},
            description: config.description || "",
            ports: config.ports || {},
            accessories: config.accessories || [],
            platforms: config.platforms || []
        });
    }

    interface(request, response) {
        let current = {
            client: {}
        };

        let contents = {};

        try {
            contents = JSON.parse(File.readFileSync(join(Server.paths.config, global.INSTANCE || "", "config.json")));
        } catch {
            contents = {};
        }

        current = _.extend(current, contents);

        return response.send(current.client || {});
    }

    generate(request, response) {
        if (!global.admin) {
            return response.status(403).json({
                error: "unauthorized"
            });
        }

        return response.send({
            username: Server.generateUsername()
        });
    }

    async save(request, response) {
        if (!global.admin) {
            return response.status(403).json({
                error: "unauthorized"
            });
        }

        const data = JSON.parse(File.readFileSync(join(Server.paths.config, global.INSTANCE || "", "config.json")));

        if (request.body.client) {
            data.client = request.body.client;
        }

        if (!this.client) {
            if (request.body.bridge) {
                data.bridge = request.body.bridge;
            }

            if (request.body.description) {
                data.description = request.body.description;
            }

            if (request.body.accessories) {
                data.accessories = request.body.accessories;
            }

            if (request.body.platforms) {
                data.platforms = request.body.platforms;
            }
        }

        Server.saveConfig(data);

        global.config = await Server.configure();

        return response.send({
            success: true
        });
    }

    backup(request, response) {
        if (!global.admin) {
            return response.status(403).json({
                error: "unauthorized"
            });
        }

        File.copyFileSync(join(Server.paths.config, global.INSTANCE || "", "config.json"), join(Server.paths.config, global.INSTANCE || "", `/config-${new Date().getTime()}.json`));

        return response.send({
            success: true,
            config
        });
    }
}
