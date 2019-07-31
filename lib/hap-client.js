const Request = require("axios");
const Decamelize = require("decamelize");
const Inflection = require("inflection");

const types = require("./types");

module.exports = class HapClient {
    constructor(endpoint, pin) {
        this.endpoint = endpoint;
        this.pin = pin;
    }

    services() {
        return new Promise((resolve, reject) => {
            Request.get(`${this.endpoint}/accessories`).then((response) => {
                const services = [];

                response.data.accessories.forEach(accessory => {
                    const accessoryInformationService = accessory.services.find(x => x.type === "0000003E-0000-1000-8000-0026BB765291");
                    const accessoryInformation = {};

                    if (accessoryInformationService && accessoryInformationService.characteristics) {
                        accessoryInformationService.characteristics.forEach((c) => {
                            if (c.value) {
                                accessoryInformation[Decamelize(c.description.replace(/ /gi, ""))] = c.value;
                            }
                        });
                    }

                    accessory.services.filter((s) => s.type !== "0000003E-0000-1000-8000-0026BB765291" && types.services[s.type]).map((s) => {
                        let serviceName = s.characteristics.find(x => x.type === "00000023-0000-1000-8000-0026BB765291");

                        serviceName = serviceName ? serviceName : {
                            iid: 0,
                            type: "00000023-0000-1000-8000-0026BB765291",
                            description: 'Name',
                            format: 'string',
                            value: this.humanize(types.services[s.type]),
                            perms: ['pr']
                        };

                        const characteristics = s.characteristics.filter((c) => c.type !== "00000023-0000-1000-8000-0026BB765291" && types.characteristics[c.type]).map((c) => {
                            return {
                                aid: accessory.aid,
                                iid: c.iid,
                                uuid: c.type,
                                type: types.characteristics[c.type],
                                service_type: types.services[s.type],
                                service_name: serviceName.value.toString(),
                                description: c.description,
                                value: c.value,
                                format: c.format,
                                perms: c.perms,
                                unit: c.unit,
                                max_value: c.maxValue,
                                min_value: c.minValue,
                                min_step: c.minStep,
                                read: c.perms.includes('pr'),
                                write: c.perms.includes('pw')
                            };
                        });

                        const service = {
                            aid: accessory.aid,
                            uuid: s.type,
                            type: types.services[s.type],
                            type_name: this.humanize(types.services[s.type]),
                            service_name: serviceName.value.toString(),
                            linked: s.linked
                        };

                        const keys = Object.keys(accessoryInformation);

                        for (let i = 0; i < keys.length; i++) {
                            service[keys[i]] = accessoryInformation[keys[i]];
                        }

                        service.characteristics = characteristics;
                        service.values = {};

                        service.refresh = () => {
                            return new Promise((resolve, reject) => {
                                this.refresh.bind(this)(service).then((results) => {
                                    resolve(results);
                                }).catch((error) => {
                                    reject(error);
                                });
                            });
                        };

                        service.set = (iid, value) => {
                            return new Promise((resolve, reject) => {
                                this.set.bind(this)(service, iid, value).then((results) => {
                                    resolve(results);
                                }).catch((error) => {
                                    reject(error);
                                });
                            });
                        };

                        service.get = (type) => {
                            return service.characteristics.find(c => c.type === type);
                        };

                        service.characteristics.forEach((c) => {
                            c.set = (value) => {
                                return new Promise((resolve, reject) => {
                                    this.set.bind(this)(service, c.iid, value).then((results) => {
                                        resolve(results);
                                    }).catch((error) => {
                                        reject(error);
                                    });
                                });
                            };

                            c.get = () => {
                                return new Promise((resolve, reject) => {
                                    this.get.bind(this)(service, c.iid).then((results) => {
                                        resolve(results);
                                    }).catch((error) => {
                                        reject(error);
                                    });
                                });
                            };

                            service.values[c.type] = c.value;
                        });

                        services.push(service);
                    });
                });

                resolve(services);
            }).catch((error) => {
                reject(error);
            });
        });
    }

    service(aid) {
        return new Promise((resolve, reject) => {
            this.services().then((services) => {
                resolve(services.find(item => item.aid === aid));
            }).catch((error) => {
                reject(error);
            });
        });
    }

    refresh(service) {
        return new Promise((resolve, reject) => {
            const iids = service.characteristics.map(c => c.iid);

            Request.get(`${this.endpoint}/characteristics?id=${iids.map(iid => `${service.aid}.${iid}`).join(",")}`).then((response) => {
                response.data.characteristics.forEach((c) => {
                    const characteristic = service.characteristics.find(x => x.iid === c.iid && x.aid === service.aid);

                    characteristic.value = c.value;
                });

                resolve(service);
            }).catch((error) => {
                reject(error);
            });
        });
    }

    get(service, iid) {
        return new Promise((resolve, reject) => {
            Request.get(`${this.endpoint}/characteristics?id=${service.aid}.${iid}`).then((response) => {
                const characteristic = service.characteristics.find(item => item.iid === response.data.characteristics[0].iid && item.aid === service.aid);

                characteristic.value = response.data.characteristics[0].value;

                resolve(characteristic);
            }).catch((error) => {
                reject(error);
            });
        });
    }

    set(service, iid, value) {
        return new Promise((resolve, reject) => {
            Request.defaults.headers.put["Authorization"] = this.pin;

            Request.put(`${this.endpoint}/characteristics`, {
                characteristics: [{
                    aid: service.aid,
                    iid: iid,
                    value: value
                }]
            },{
                headers: {
                    "'Authorization'": this.pin
                }
            }).then(() => {
                this.service(service.aid).then((results) => {
                    resolve(results);
                }).catch((error) => {
                    reject(error);
                });
            }).catch((error) => {
                reject(error);
            });
        });
    }

    humanize(string) {
        return Inflection.titleize(Decamelize(string));
    }
}
