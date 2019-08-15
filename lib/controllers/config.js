const _ = require("lodash");
const File = require("fs-extra");
const Server = require("../server");

const { join } = require("path");

module.exports = class ConfigController {
    constructor(client) {
        this.client = client || false;

        global.app.get("/config", (request, response) => this.get(request, response));
        global.app.post("/config", (request, response) => this.save(request, response));
        global.app.post("/config/backup", (request, response) => this.backup(request, response));

        if (!this.client) {
            global.app.get("/config/generate", (request, response) => this.generate(request, response));
        }
    }

    get(request, response) {
        if (this.client) {
            return response.send({
                client: config.client || {}
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

        let data = {};

        if (this.client) {
            data = {
                server: {},
                client: {},
                bridge: {},
                description: "",
                ports: {},
                plugins: [],
                interfaces: [],
                accessories: [],
                platforms: []
            };
        } else {
            data = {
                client: {}
            };
        }

        data = _.extend(data, config, request.body);

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
