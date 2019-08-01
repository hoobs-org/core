module.exports = class ServiceController {
    constructor() {
        global.app.get("/service", (request, response) => this.status(request, response));
        global.app.post("/service/:action", (request, response) => this.control(request, response));
    }

    status(request, response) {
        response.send({
            version: server.version,
            running: server.running,
            status: server.running ? "running" : "stopped",
            uptime: new Date() - server.time
        });
    }

    control(request, response) {
        if (!global.admin) {
            return response.status(403).json({
                error: "unauthorized"
            });
        }

        switch (request.params.action) {
            case "start":
                server.start().then(() => {
                    return response.send({
                        success: true
                    });
                });

                break;

            case "stop":
                server.stop().then(() => {
                    return response.send({
                        success: true
                    });
                });

                break;

            case "restart":
                server.restart().then(() => {
                    return response.send({
                        success: true
                    });
                });

                break;
            
            case "clean":
                server.clean().then(() => {
                    global.log.info(`[${new Date().toLocaleString()}] Persist directory removed.`);

                    return response.send({
                        success: true
                    });
                });

                break;

            case "reload":
                if (DEBUG) {
                    return response.send({
                        success: true
                    });
                }

                ui.reload().then(() => {
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
