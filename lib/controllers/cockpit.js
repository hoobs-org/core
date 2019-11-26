const HBS = require("../instance");
const Cockpit = require("../cockpit");

module.exports = class CockpitController {
    constructor() {
        this.client = null;

        HBS.app.get("/api/cockpit/start", (request, response) => this.start(request, response));
        HBS.app.get("/api/cockpit/disconnect", (request, response) => this.disconnect(request, response));
    }

    start(request, response) {
        this.client = new Cockpit();

        this.client.start(false).then((registration) => {
            return response.send({
                registration
            });
        }).catch(() => {
            return response.send({
                error: "Unable to Connect"
            });
        });
    }

    disconnect(request, response) {
        if (this.client) {
            this.client.disconnect();
        }

        return response.send({
            success: true
        });
    }
}
