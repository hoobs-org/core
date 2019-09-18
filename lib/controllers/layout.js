const File = require("fs-extra");
const HapClient = require("../hap-client");
const Server = require("../server");

const { join } = require("path");

module.exports = class LayoutController {
    constructor() {
        this.hap = new HapClient(`http://127.0.0.1:${config.bridge.port}`, config.bridge.pin);

        this.dashboard = [];
        this.accessories = [];

        global.app.get("/api/layout", (request, response) => this.info(request, response));
        global.app.post("/api/layout", (request, response) => this.save(request, response));
        global.app.get("/api/layout/dashboard", (request, response) => this.dashboardLayout(request, response));
        global.app.post("/api/layout/dashboard", (request, response) => this.saveDashboard(request, response));
    }

    dashboardLayout(request, response) {
        if (this.dashboard.length === 0) {
            if (!File.existsSync(join(Server.paths.config, "dashboard.json"))) {
                File.appendFileSync(join(Server.paths.config, "dashboard.json"), JSON.stringify([{
                    x: 0,
                    y: 0,
                    w: 2,
                    h: 7,
                    i: "0",
                    component: "setup-pin"
                },{
                    x: 2,
                    y: 0,
                    w: 10,
                    h: 7,
                    i: "1",
                    component: "system-load"
                },{
                    x: 0,
                    y: 7,
                    w: 7,
                    h: 7,
                    i: "2",
                    component: "weather",
                    units: "imperial"
                },{
                    x: 0,
                    y: 14,
                    w: 7,
                    h: 8,
                    i: "3",
                    component: "favorite-accessories"
                },{
                    x: 7,
                    y: 7,
                    w: 5,
                    h: 15,
                    i: "4",
                    component: "system-info"
                }], null, 4));
            }

            this.dashboard = JSON.parse(File.readFileSync(join(Server.paths.config, "dashboard.json")));
        }

        return response.send(this.dashboard);
    }

    saveDashboard(request, response) {
        const data = JSON.parse(JSON.stringify(request.body));

        this.dashboard = data;

        File.unlinkSync(join(Server.paths.config, "dashboard.json"));
        File.appendFileSync(join(Server.paths.config, "dashboard.json"), JSON.stringify(data, null, 4));

        return response.send({
            success: true
        });
    }

    save(request, response) {
        if (!global.admin) {
            return response.status(403).json({
                error: "unauthorized"
            });
        }

        const data = JSON.parse(JSON.stringify(request.body));
        const index = data.rooms.findIndex(r => r.name === "Unassigned");

        if (index > -1) {
            data.rooms.splice(index, 1);
        }

        File.unlinkSync(join(Server.paths.config, global.INSTANCE || "", "layout.json"));
        File.appendFileSync(join(Server.paths.config, global.INSTANCE || "", "layout.json"), JSON.stringify(data, null, 4));

        global.layout = data;

        return response.send({
            success: true
        });
    }

    info(request, response) {
        this.services().then((accessories) => {
            this.accessories = accessories;
        }).catch((error) => {
            global.log.error(error.message);
        }).finally(() => {
            const current = JSON.parse(JSON.stringify(global.layout));
            const placed = global.layout.hidden.slice(0);

            for (let i = 0; i < current.rooms.length; i++) {
                for (let j = 0; j < current.rooms[i].accessories.length; j++) {
                    placed.push(...current.rooms[i].accessories);
                }
            }

            const unassigned = {
                name: "Unassigned",
                accessories: []
            };

            for (let i = 0; i < this.accessories.length; i++) {
                const aid = this.accessories[i].aid;

                if (placed.indexOf(aid) === -1 && unassigned.accessories.indexOf(aid) === -1) {
                    unassigned.accessories.push(aid);
                }
            }

            current.rooms.push(unassigned);

            response.send(current);
        });
    }

    uniqieServices(services) {
        const lookup = {};

        for (let i = 0; i < services.length; i++) {
            const aid = services[i].aid;

            if (lookup[aid]) {
                services[i].aid = parseFloat(`${aid}.${lookup[aid]}`);
            }

            if (!lookup[aid]) {
                lookup[aid] = 1;
            } else {
                lookup[aid] = lookup[aid] + 1;
            }
        }

        return services;
    }

    services() {
        return new Promise((resolve, reject) => {
            this.hap.services().then((services) => {
                const queue = [];

                services.forEach((service) => {
                    queue.push(true);

                    service.refresh().catch((error) => {
                        global.log.error(error.message);
                    }).finally(() => {
                        queue.pop();

                        if (queue.length === 0) {
                            resolve(this.uniqieServices(services));
                        }
                    });
                });

                if (queue.length === 0) {
                    resolve(this.uniqieServices(services));
                }
            }).catch((error) => {
                reject(error);
            });
        });
    }
}
