const Server = require("../server");

module.exports = class StatusController {
    constructor() {
        global.app.get("/", (request, response) => this.info(request, response));
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
            configuration_path: Server.paths.config.path,
            local_modules_path: Server.paths.modules.local,
            global_modules_path: Server.paths.modules.global,
            homebridge_path: Server.paths.homebridge
        });
    }
}
