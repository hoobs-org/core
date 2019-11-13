const Forms = require("formidable");
const Server = require("../server");

const { join } = require("path");

module.exports = class StatusController {
    constructor() {
        global.app.get("/api/status", (request, response) => this.info(request, response));
        global.app.post("/api/backup", (request, response) => this.backup(request, response));
        global.app.post("/api/restore", (request, response) => this.restore(request, response));
        global.app.put("/api/reboot", (request, response) => this.reboot(request, response));
        global.app.put("/api/update", (request, response) => this.update(request, response))        
        global.app.put("/api/reset", (request, response) => this.reset(request, response));
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

    backup(request, response) {
        Server.backup().then((filename) => {
            return response.send({
                success: true,
                filename: filename
            });
        }).catch((error) => {
            return response.send({	
                success: false,
                error: error.message || "Unable to create backup"	
            });
        });
    }

    restore(request, response) {
        if (!global.admin) {	
            return response.status(403).json({	
                error: "unauthorized"	
            });	
        }

        const form = new Forms.IncomingForm();

        form.parse(request, (error, fields, files) => {
            Server.restore(files.file.path);

            return response.send({
                success: true
            });
        });
    }

    reset(request, response) {
        if (!global.admin) {	
            return response.status(403).json({	
                error: "unauthorized"	
            });	
        }

        Server.reset();

        return response.send({
            success: true
        });
    }

    info(request, response) {
        const data = {};

        data.bridge_name = config.bridge.name || "";
        data[`${(global.config.system || "hoobs").split("-")[0]}_version`] = global.application.version;
        data.homebridge_version = server.version;
        data.username = config.bridge.username || "";
        data.homebridge_port = config.bridge.port || 51826;
        data.home_setup_pin = config.bridge.pin || "";
        data.home_setup_id = config.server.home_setup_id;

        if (global.admin) {
            data.application_path = Server.paths.application;
            data.configuration_path = join(Server.paths.config, global.INSTANCE || "");
            data.local_modules_path = `${Server.paths.modules.local}${global.config.package_manager === "yarn" ? " (yarn)" : ""}`;
            data.global_modules_path = Server.paths.modules.global;
            data.homebridge_path = Server.paths.homebridge;
        }

        return response.send(data);
    }
}
