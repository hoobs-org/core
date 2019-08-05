const _ = require("lodash");
const File = require("fs-extra");
const Server = require("../server");

const { join } = require("path");

module.exports = class ConfigController {
    constructor() {
        global.app.get("/config", (request, response) => this.get(request, response));
        global.app.post("/config", (request, response) => this.save(request, response));
        global.app.post("/config/backup", (request, response) => this.backup(request, response));
    }

    get(request, response) {
        if (!global.admin) {
            return response.status(403).json({
                error: "unauthorized"
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

    save(request, response) {
        if (!global.admin) {
            return response.status(403).json({
                error: "unauthorized"
            });
        }

        let data = {
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

        data = _.extend(data, config, request.body);

        Server.saveConfig(data);

        global.config = Server.configure();

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

        File.copyFileSync(Server.paths.config.main, join(Server.paths.config.path, `/config-${new Date().getTime()}.json`));

        return response.send({
            success: true,
            config
        });
    }
}
