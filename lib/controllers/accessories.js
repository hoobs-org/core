const HapClient = require("../hap-client");

module.exports = class AccessoriesController {
    constructor() {
        this.hap = new HapClient(`http://127.0.0.1:${config.bridge.port}`, config.bridge.pin);

        this.rooms = [];
        this.accessories = [];

        global.app.get("/accessories", (request, response) => this.listRooms(request, response));
        global.app.get("/accessories/list", (request, response) => this.listAccessories(request, response));
        global.app.get("/accessory/:id", (request, response) => this.getAccessory(request, response));
        global.app.put("/accessory/:id/:service", (request, response) => this.updateAccessory(request, response));
    }

    listRooms(request, response) {
        this.fetchServices().then((accessories) => {
            this.rooms = accessories;
        }).catch((error) => {
            global.log.error(`[List Rooms] ${error.message}`);
        }).finally(() => {
            const lookup = {};
            const current = JSON.parse(JSON.stringify(global.layout));
            const placed = global.layout.hidden.slice(0);

            for (let i = 0; i < this.rooms.length; i++) {
                if (!lookup[this.rooms[i].aid]) {
                    lookup[this.rooms[i].aid] = [];
                }

                lookup[this.rooms[i].aid].push(i);
            }

            for (let i = 0; i < current.rooms.length; i++) {
                current.rooms[i].services = [];

                for (let j = 0; j < current.rooms[i].accessories.length; j++) {
                    const aid = current.rooms[i].accessories[j];

                    if (placed.indexOf(parseInt(aid, 10)) === -1 && lookup[aid]) {
                        for (let k = 0; k < lookup[aid].length; k++) {
                            current.rooms[i].services.push(this.rooms[lookup[aid][k]]);
                        }

                        placed.push(parseInt(aid, 10));
                    }
                }

                current.rooms[i].accessories = current.rooms[i].services;

                delete current.rooms[i].services;
            }

            const unassigned = {
                name: "Unassigned",
                accessories: []
            };

            const keys = Object.keys(lookup);

            for (let i = 0; i < keys.length; i++) {
                const aid = keys[i];

                if (placed.indexOf(parseInt(aid, 10)) === -1 && lookup[aid]) {
                    for (let j = 0; j < lookup[aid].length; j++) {
                        unassigned.accessories.push(this.rooms[lookup[aid][j]]);
                    }
                }
            }

            current.rooms.push(unassigned);
            response.send(current);
        });
    }

    listAccessories(request, response) {
        this.fetchServices().then((accessories) => {
            this.accessories = accessories;
        }).catch((error) => {
            global.log.error(`[List Accessories] ${error.message}`);
        }).finally(() => {
            response.send(this.accessories);
        });
    }

    getAccessory(request, response) {
        let results = {};

        this.fetchService(parseInt(request.params.id, 10)).then((response) => {
            results = response;
        }).catch((error) => {
            global.log.error(`[Get Accessory] ${error.message}`);
        }).finally(() => {
            response.send(results);
        });
    }

    updateAccessory(request, response) {
        let results = {};

        this.fetchService(parseInt(request.params.id, 10)).then((service) => {
            let value = request.body.value;

            if (typeof request.body.value === "boolean") {
                value = request.body.value ? 1 : 0;
            }

            global.log.debug(`Update - ${request.params.service}: ${value} (${typeof value})`);

            service.set(parseInt(request.params.service, 10), value).then((response) => {
                results = response;
            }).catch((error) => {
                global.log.error(`[Update Accessory] ${error.message}`);
            }).finally(() => {
                response.send(results);
            });
        }).catch(() => {
            response.send(results);
        });
    }

    fetchService(id) {
        return new Promise((resolve, reject) => {
            this.hap.service(id).then((service) => {
                service.refresh().catch().finally(() => {
                    resolve(service);
                });
            }).catch((error) => {
                reject(error);
            });
        });
    }

    fetchServices() {
        return new Promise((resolve, reject) => {
            this.hap.services().then((services) => {
                if (!services || !services.forEach) {
                    return resolve([]);
                }

                const queue = [];

                services.forEach((service) => {
                    queue.push(true);

                    service.refresh().catch().finally(() => {
                        queue.pop();

                        if (queue.length === 0) {
                            return resolve(services);
                        }
                    });
                });

                if (queue.length === 0) {
                    return resolve(services);
                }
            }).catch((error) => {
                return reject(error);
            });
        });
    }
}
