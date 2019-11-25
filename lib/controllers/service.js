const HBS = require("../instance");

module.exports = class ServiceController {
    constructor() {
        HBS.app.get("/api/service", (request, response) => this.status(request, response));
        HBS.app.post("/api/service/:action", (request, response) => this.control(request, response));
    }

    status(request, response) {
        response.send({
            version: HBS.server.version,
            running: HBS.server.running,
            status: HBS.server.running ? "running" : "stopped",
            uptime: new Date() - HBS.server.time
        });
    }

    control(request, response) {
        switch (request.params.action) {
            case "start":
                HBS.server.start().then(() => {
                    return response.send({
                        success: true
                    });
                });

                break;

            case "stop":
                HBS.server.stop().then(() => {
                    return response.send({
                        success: true
                    });
                });

                break;

            case "restart":
                HBS.server.restart().then(() => {
                    return response.send({
                        success: true
                    });
                });

                break;
            
            case "clean":
                HBS.server.clean().then(() => {
                    HBS.log.info(`[${new Date().toLocaleString()}] Persist directory removed.`);

                    return response.send({
                        success: true
                    });
                });

                break;
            
            default:
                response.status(404);

                return response.send({
                    error: "invalid request"
                });
        }
    }
}
