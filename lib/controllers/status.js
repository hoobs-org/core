const Forms = require("formidable");

const HBS = require("../instance");
const Server = require("../server");

const { join } = require("path");

module.exports = class StatusController {
    constructor(client) {
        this.client = client || false;

        HBS.app.get("/api/status", (request, response) => this.info(request, response));
        HBS.app.put("/api/reboot", (request, response) => this.reboot(request, response));

        if (!this.client) {
            HBS.app.post("/api/backup", (request, response) => this.backup(request, response));
            HBS.app.post("/api/restore", (request, response) => this.restore(request, response));
            HBS.app.put("/api/update", (request, response) => this.update(request, response))        
            HBS.app.put("/api/reset", (request, response) => this.reset(request, response));
        }
    }

    reboot(request, response) {
        Server.reboot();

        return response.send({
            success: true
        });
    }

    async update(request, response) {	
        if (!HBS.admin) {	
            return response.status(403).json({	
                error: "unauthorized"	
            });
        }

        await Server.update();

        return response.send({
            success: true
        });
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
        if (!HBS.admin) {	
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
        if (!HBS.admin) {	
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

        if (this.client) {
            data.hoobs_version = HBS.application.version;
            data.node_version = (process.version || "").replace(/v/gi, "");
        } else {
            data.bridge_name = HBS.config.bridge.name || "";
            data.hoobs_version = HBS.application.version;
            data.homebridge_version = HBS.server.version;
            data.node_version = (process.version || "").replace(/v/gi, "");
            data.username = HBS.config.bridge.username || "";
            data.homebridge_port = HBS.config.bridge.port || 51826;
            data.home_setup_pin = HBS.config.bridge.pin || "";
            data.home_setup_id = HBS.config.server.home_setup_id;    
        }

        if (HBS.admin) {
            data.application_path = Server.paths.application;
            data.configuration_path = join(Server.paths.config, HBS.name || "");
            data.local_modules_path = `${Server.paths.modules.local}${HBS.config.package_manager === "yarn" ? " (yarn)" : ""}`;
            data.global_modules_path = Server.paths.modules.global;
        }

        return response.send(data);
    }
}
