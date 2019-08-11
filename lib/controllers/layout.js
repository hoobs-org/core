const File = require("fs-extra");
const HapClient = require("../hap-client");
const Server = require("../server");

const { join } = require("path");

module.exports = class LayoutController {
    constructor() {
        this.hap = new HapClient(`http://127.0.0.1:${config.bridge.port}`, config.bridge.pin);
        this.accessories = [];

        global.app.get("/layout", (request, response) => this.info(request, response));
        global.app.post("/layout", (request, response) => this.save(request, response));
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
                            resolve(services);
                        }
                    });
                });

                if (queue.length === 0) {
                    resolve(services);
                }
            }).catch((error) => {
                reject(error);
            });
        });
    }
}
