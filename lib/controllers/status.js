const Server = require("../server");

const { join } = require("path");

module.exports = class StatusController {
    constructor() {
        global.app.get("/status", (request, response) => this.info(request, response));
        global.app.put("/reboot", (request, response) => this.reboot(request, response));
        global.app.put("/update", (request, response) => this.update(request, response));
    }

    reboot(request, response) {
        if (!global.admin) {
            return response.status(403).json({
                error: "unauthorized"
            });
        }

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
        if (!global.admin) {
            return response.send({
                bridge_name: config.bridge.name || "",
                hoobs_version: global.application.version,
                homebridge_version: server.version,
                home_setup_pin: config.bridge.pin || ""
            });
        }

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
