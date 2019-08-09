const { execSync } = require("child_process");

module.exports = class NetworkController {
    constructor() {
        global.app.get("/network", (request, response) => this.status(request, response));
        global.app.post("/network/list", (request, response) => this.scan(request, response));
    }

    status(request, response) {
        if (!this.nmcli()) {
            return response.send({
                error: "Network command utility not available"
            });
        }

        return response.send({
            results: execSync("nmcli connection show --active")
        });
    }

    scan(request, response) {
        if (!this.nmcli()) {
            return response.send({
                error: "Network command utility not available"
            });
        }

        return response.send({
            success: true
        });
    }

    nmcli() {
        try {
            return !!execSync("command -v nmcli 2>/dev/null && { echo >&1 nmcli; exit 0; }");
          } catch (error) {
            return false;
          }
    }
}
