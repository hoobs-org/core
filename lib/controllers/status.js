const Server = require("../server");

const { join } = require("path");

module.exports = class StatusController {
    constructor() {
        global.app.get("/api/status", (request, response) => this.info(request, response));
        global.app.put("/api/reboot", (request, response) => this.reboot(request, response));
        global.app.put("/api/update", (request, response) => this.update(request, response));
    }

    reboot(request, response) {
        Server.reboot();

        return response.send({
            success: true
        });
    }

    async update(request, response) {
        if (!global.admin) {
            return response.status(403).json({
                error: "unauthorized"
            });
        }

        await Server.update();

        this.reboot();
    }

    info(request, response) {
        return response.send({
            bridge_name: config.bridge.name || "",
            hoobs_version: global.application.version,
            homebridge_version: server.version,
            username: config.bridge.username || "",
            homebridge_port: config.bridge.port || 51826,
            home_setup_pin: config.bridge.pin || "",
            home_setup_id: config.server.home_setup_id,
            application_path: Server.paths.application,
            configuration_path: join(Server.paths.config, global.INSTANCE || ""),
            local_modules_path: Server.paths.modules.local,
            global_modules_path: Server.paths.modules.global,
            homebridge_path: Server.paths.homebridge
        });
    }
}
