const Server = require("../server");

module.exports = class StatusController {
    constructor() {
        global.app.get("/", (request, response) => this.info(request, response));
    }

    info(request, response) {
        if (!global.admin) {
            return response.send({
                bridge_name: config.bridge.name || "Homebridge",
                homebridge_version: server.version,
                home_setup_pin: config.bridge.pin || "031-45-154"
            });
        }

        return response.send({
            bridge_name: config.bridge.name || "Homebridge",
            homebridge_version: server.version,
            username: config.bridge.username || "CC:22:3D:E3:CE:30",
            homebridge_port: config.bridge.port || 51826,
            home_setup_pin: config.bridge.pin || "031-45-154",
            home_setup_id: config.server.home_setup_id,
            application_path: Server.paths.application,
            configuration_path: Server.paths.config.path,
            local_modules_path: Server.paths.modules.local,
            global_modules_path: Server.paths.modules.global,
            homebridge_path: Server.paths.homebridge
        });
    }
}
