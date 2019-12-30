const File = require("fs-extra");

const HBS = require("../instance");
const HapClient = require("../hap-client");
const Server = require("../server");
const User = require("../user");

const { join } = require("path");

module.exports = class AccessoriesController {
    constructor() {
        this.hap = new HapClient(`http://127.0.0.1:${HBS.config.bridge.port}`, HBS.config.bridge.pin);

        this.rooms = [];
        this.accessories = [];

        HBS.app.get("/api/accessories", (request, response) => this.listRooms(request, response));
        HBS.app.get("/api/accessories/list", (request, response) => this.listAccessories(request, response));
        HBS.app.get("/api/accessories/available", (request, response) => this.available(request, response));
        HBS.app.get("/api/accessories/favorites", (request, response) => this.listFavorites(request, response));
        HBS.app.get("/api/accessory/:id", (request, response) => this.getAccessory(request, response));
        HBS.app.put("/api/accessory/:id/:service", (request, response) => this.controlAccessory(request, response));
        HBS.app.post("/api/accessory/:id/:item", (request, response) => this.updateAccessory(request, response));
    }

    listRooms(request, response) {
        this.fetchServices().then((accessories) => {
            this.rooms = accessories;
        }).catch((error) => {
            HBS.log.error(`[List Rooms] ${error.message}`);
        }).finally(() => {
            const lookup = {};
            const current = this.getCurrentUser(request);
            const placed = current.hidden.slice(0);

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

                    if (placed.indexOf(parseFloat(aid)) === -1 && lookup[aid]) {
                        for (let k = 0; k < lookup[aid].length; k++) {
                            if ((current.names || {})[aid] && (current.names || {})[aid] !== "") {
                                this.rooms[lookup[aid][k]].alias = current.names[aid];
                            }

                            current.rooms[i].services.push(this.rooms[lookup[aid][k]]);
                        }

                        placed.push(parseFloat(aid));
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

                if (placed.indexOf(parseFloat(aid)) === -1 && lookup[aid]) {
                    for (let j = 0; j < lookup[aid].length; j++) {
                        if ((current.names || {})[aid] && (current.names || {})[aid] !== "") {
                            this.rooms[lookup[aid][j]].alias = current.names[aid];
                        }

                        unassigned.accessories.push(this.rooms[lookup[aid][j]]);
                    }
                }
            }

            current.rooms.push(unassigned);
            response.send(current); // Getting 504 error here, Why?
        });
    }

    available(request, response) {
        let accessories = {};

        this.fetchServices().then((data) => {
            accessories = data;
        }).catch((error) => {
            HBS.log.error(`[Available Accessories] ${error.message}`);
        }).finally(() => {
            const lookup = {};
            const current = this.getCurrentUser(request);
            const placed = current.hidden.slice(0);
            const results = [];

            for (let i = 0; i < accessories.length; i++) {
                if (!lookup[accessories[i].aid]) {
                    lookup[accessories[i].aid] = [];
                }

                lookup[accessories[i].aid].push(i);
            }

            for (let i = 0; i < current.rooms.length; i++) {
                const room = {
                    name: current.rooms[i].name,
                    accessories: []
                }

                for (let j = 0; j < current.rooms[i].accessories.length; j++) {
                    const aid = current.rooms[i].accessories[j];

                    if (placed.indexOf(parseFloat(aid)) === -1 && lookup[aid]) {
                        for (let k = 0; k < lookup[aid].length; k++) {
                            const accessory = accessories[lookup[aid][k]];

                            if ((current.names || {})[aid] && (current.names || {})[aid] !== "") {
                                accessory.alias = current.names[aid];
                            }

                            accessory.hidden = false;
                            room.accessories.push(accessory);
                        }

                        placed.push(parseFloat(aid));
                    }
                }

                if (room.accessories.length > 0) {
                    results.push(room);
                }
            }

            const unassigned = {
                name: "Unassigned",
                accessories: []
            };

            const keys = Object.keys(lookup);

            for (let i = 0; i < keys.length; i++) {
                const aid = keys[i];

                if (placed.indexOf(parseFloat(aid)) === -1 && lookup[aid]) {
                    for (let j = 0; j < lookup[aid].length; j++) {
                        const accessory = accessories[lookup[aid][j]];

                        if ((current.names || {})[aid] && (current.names || {})[aid] !== "") {
                            accessory.alias = current.names[aid];
                        }

                        accessory.hidden = false;
                        unassigned.accessories.push(accessory);
                    }
                }
            }

            for (let i = 0; i < current.hidden.length; i++) {
                const aid = current.hidden[i];

                if (lookup[aid]) {
                    for (let j = 0; j < lookup[aid].length; j++) {
                        const accessory = accessories[lookup[aid][j]];

                        if ((current.names || {})[aid] && (current.names || {})[aid] !== "") {
                            accessory.alias = current.names[aid];
                        }

                        accessory.hidden = true;
                        unassigned.accessories.push(accessory);
                    }
                }
            }

            if (unassigned.accessories.length > 0) {
                results.unshift(unassigned);
            }

            response.send(results);
        });
    }

    listFavorites(request, response) {
        this.fetchServices().then((accessories) => {
            this.accessories = accessories;
        }).catch((error) => {
            HBS.log.error(`[List Accessories] ${error.message}`);
        }).finally(() => {
            const lookup = {};
            const current = this.getCurrentUser(request);

            for (let i = 0; i < this.accessories.length; i++) {
                if (!lookup[this.accessories[i].aid]) {
                    lookup[this.accessories[i].aid] = [];
                }

                lookup[this.accessories[i].aid].push(i);
            }

            const results = [];

            if (current.favorites && current.favorites.length > 0) {
                for (let i = 0; i < current.favorites.length; i++) {
                    const items = lookup[current.favorites[i]];

                    if (items) {
                        for (let j = 0; j < items.length; j++) {
                            const aid = this.accessories[items[j]].aid;

                            if ((current.names || {})[aid] && (current.names || {})[aid] !== "") {
                                this.accessories[items[j]].alias = current.names[aid];
                            }

                            results.push(this.accessories[items[j]]);
                        }
                    }
                }
            }

            response.send(results);
        });
    }

    listAccessories(request, response) {
        this.fetchServices().then((accessories) => {
            this.accessories = accessories;
        }).catch((error) => {
            HBS.log.error(`[List Accessories] ${error.message}`);
        }).finally(() => {
            for (let i = 0; i < this.accessories.length; i++) {
                const aid = this.accessories[i].aid;
                const current = this.getCurrentUser(request);

                if ((current.names || {})[aid] && (current.names || {})[aid] !== "") {
                    this.accessories[i].alias = current.names[aid];
                }
            }

            response.send(this.accessories);
        });
    }

    getAccessory(request, response) {
        let results = {};

        this.fetchService(parseInt((`${request.params.id}`).split(".")[0], 10)).then((response) => {
            results = response;
        }).catch((error) => {
            HBS.log.error(`[Get Accessory] ${error.message}`);
        }).finally(() => {
            response.send(results);
        });
    }

    controlAccessory(request, response) {
        let results = {};

        this.fetchService(parseInt((`${request.params.id}`).split(".")[0], 10)).then((service) => {
            let value = request.body.value;

            if (typeof request.body.value === "boolean") {
                value = request.body.value ? 1 : 0;
            }

            HBS.log.debug(`Update - ${request.params.service}: ${value} (${typeof value})`);

            service.set(parseInt(request.params.service, 10), value).then((response) => {
                results = response;
            }).catch((error) => {
                HBS.log.error(`[Update Accessory] ${error.message}`);
            }).finally(() => {
                response.send(results);
            });
        }).catch(() => {
            response.send(results);
        });
    }

    updateAccessory(request, response) {
        let value = request.body.value;

        switch (request.params.item) {
            case "alias":
                const data = HBS.JSON.clone(HBS.layout);
                const username = User.decode(request.headers.authorization).username;

                if (!data[username]) {
                    data[username] = {
                        rooms: [],
                        hidden: [],
                        names: {}
                    };
                }

                const index = data[username].rooms.findIndex(r => r.name === "Unassigned");

                if (index > -1) {
                    data[username].rooms.splice(index, 1);
                }

                if (!data[username].names) {
                    data[username].names = {};
                }

                if (value && value !== "") {
                    data[username].names[request.params.id] = value;
                } else {
                    delete data[username].names[request.params.id];
                }

                File.unlinkSync(join(Server.paths.config, HBS.name || "", "layout.json"));
                File.appendFileSync(join(Server.paths.config, HBS.name || "", "layout.json"), JSON.stringify(data, null, 4));

                HBS.layout = data;
                break;
        }

        return response.send({
            success: true
        });
    }

    getCurrentUser(request) {
        const username = User.decode(request.headers.authorization).username;

        const current = HBS.layout[username] || {
            rooms: [],
            hidden: [],
            names: {}
        };
        
        return HBS.JSON.clone(current);
    }

    fetchService(id) {
        return new Promise((resolve, reject) => {
            this.hap.service(id).then((service) => {
                service.refresh((results) => {
                    service.values = results.values;
                }).catch((error) => {
                    HBS.log.error(`[Fetch Service]: ${id} - ${error.message}`);
                    HBS.log.debug(error.stack);
                }).finally(() => {
                    resolve(service);
                });
            }).catch((error) => {
                reject(error);
            });
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

    fetchServices() {
        return new Promise((resolve, reject) => {
            let services = [];

            this.hap.services().then((results) => {
                services = results;
            }).finally(() => {
                if (!services) {
                    return resolve([]);
                }

                if (!Array.isArray(services)) {
                    services = [services];
                }

                const queue = [];

                for(let i = 0; i < services.length; i++) {
                    queue.push(true);

                    services[i].refresh((results) => {
                        services[i].values = results.values;
                    }).catch((error) => {
                        HBS.log.error(`[Refresh Services] ${error.message}`);
                        HBS.log.debug(error.stack);
                    }).finally(() => {
                        queue.pop();

                        if (queue.length === 0) {
                            return resolve(this.uniqieServices(services));
                        }
                    });
                }

                if (queue.length === 0) {
                    return resolve(this.uniqieServices(services));
                }
            }).catch((error) => {
                return reject(error);
            });
        });
    }
}
