const Network = require("wifi-control");

module.exports = class NetworkController {
    constructor() {
        global.app.get("/network", (request, response) => this.current(request, response));
        global.app.get("/network/scan", (request, response) => this.scan(request, response));
    }

    current(request, response) {
        return response.send(Network.getIfaceState());
    }

    scan(request, response) {
        if (!global.admin) {
            return response.status(403).json({
                error: "unauthorized"
            });
        }

        Network.scanForWiFi((error, results) => {
            if (error) {
                return response.status(500).json({
                    error
                });
            }

            return response.send(results);
        });
    }
}