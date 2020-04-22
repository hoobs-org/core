/**************************************************************************************************
 * hoobs-core                                                                                     *
 * Copyright (C) 2020 HOOBS                                                                       *
 * Copyright (C) 2020 Khaos Tian                                                                  *
 * Copyright (C) 2020 Oznu                                                                        *
 *                                                                                                *
 * This program is free software: you can redistribute it and/or modify                           *
 * it under the terms of the GNU General Public License as published by                           *
 * the Free Software Foundation, either version 3 of the License, or                              *
 * (at your option) any later version.                                                            *
 *                                                                                                *
 * This program is distributed in the hope that it will be useful,                                *
 * but WITHOUT ANY WARRANTY; without even the implied warranty of                                 *
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the                                  *
 * GNU General Public License for more details.                                                   *
 *                                                                                                *
 * You should have received a copy of the GNU General Public License                              *
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.                          *
 **************************************************************************************************/

const Request = require("axios");

const HBS = require("./instance");
const types = require("./types");

module.exports = class HapClient {
    accessories(aid) {
        return new Promise((resolve, reject) => {
            const key = "hap/accessories";
            const cached = HBS.cache.get(key);

            if (cached) {
                resolve(aid ? this.process(cached).find(a => a.aid === aid) : this.process(cached));
            } else {
                Request.get(`http://127.0.0.1:${HBS.config.bridge.port}/accessories`).then((response) => {
                    HBS.cache.set(key, response.data.accessories, 30);

                    resolve(aid ? this.process(response.data.accessories).find(a => a.aid === aid) : this.process(response.data.accessories));
                }).catch((error) => {
                    reject(error);
                });
            }
        });
    }

    serviceDetails(accessory) {
        const information = accessory.services.find(s => s.type === "3E");
        const results = {};

        if (information && information.characteristics) {
            for (let i = 0; i < information.characteristics.length; i++) {
                results[this.decamel(information.characteristics[i].description)] = information.characteristics[i].value;
            }
        }

        return results;
    }

    characteristicDetails(accessory, service, name) {
        const results = [];

        for (let i = 0; i < service.characteristics.length; i++) {
            if (service.characteristics[i].type !== "23" && types.characteristics[service.characteristics[i].type]) {
                results.push({
                    aid: accessory.aid,
                    iid: service.characteristics[i].iid,
                    uuid: service.characteristics[i].type,
                    type: types.characteristics[service.characteristics[i].type],
                    service_type: types.services[service.type],
                    service_name: name.value.toString(),
                    description: service.characteristics[i].description,
                    value: service.characteristics[i].value,
                    format: service.characteristics[i].format,
                    perms: service.characteristics[i].perms,
                    unit: service.characteristics[i].unit,
                    max_value: service.characteristics[i].maxValue,
                    min_value: service.characteristics[i].minValue,
                    min_step: service.characteristics[i].minStep,
                    read: service.characteristics[i].perms.includes("pr"),
                    write: service.characteristics[i].perms.includes("pw")
                })
            }
        }

        return results;
    }

    process(accessories) {
        const results = [];

        for (let i = 0; i < accessories.length; i++) {
            const information = this.serviceDetails(accessories[i]);

            for (let j = 0; j < accessories[i].services.length; j++) {
                if (accessories[i].services[j].type !== "3E" && types.services[accessories[i].services[j].type]) {
                    const name = accessories[i].services[j].characteristics.find(c => c.type === "23") || {
                        iid: 0,
                        uuid: "23",
                        type: types.services["23"],
                        description: "Name",
                        format: "string",
                        value: this.humanize(types.services[accessories[i].services[j].type]),
                        perms: ["pr"]
                    };

                    const characteristics = this.characteristicDetails(accessories[i], accessories[i].services[j], name);

                    const service = {
                        aid: accessories[i].aid,
                        uuid: accessories[i].services[j].type,
                        type: types.services[accessories[i].services[j].type],
                        type_name: this.humanize(types.services[accessories[i].services[j].type]),
                        service_name: name.value.toString(),
                        linked: accessories[i].services[j].linked,
                        characteristics,
                        values: {}
                    };

                    const keys = Object.keys(information);

                    for (let k = 0; k < keys.length; k++) {
                        service[keys[k]] = information[keys[k]];
                    }

                    service.refresh = () => {
                        return new Promise((resolve, reject) => {
                            this.refresh(service).then((results) => {
                                resolve(results);
                            }).catch((error) => {
                                reject(error);
                            });
                        });
                    };

                    service.set = (iid, value) => {
                        return new Promise((resolve, reject) => {
                            this.set(service, iid, value).then((results) => {
                                resolve(results);
                            }).catch((error) => {
                                reject(error);
                            });
                        });
                    };

                    for (let k = 0; k < service.characteristics.length; k++) {
                        service.characteristics[k].set = (value) => {
                            return new Promise((resolve, reject) => {
                                this.set(service, service.characteristics[k].iid, value).then((results) => {
                                    resolve(results);
                                }).catch((error) => {
                                    reject(error);
                                });
                            });
                        };
    
                        service.characteristics[k].get = () => {
                            return new Promise((resolve, reject) => {
                                this.get.bind(this)(service, service.characteristics[k].iid).then((results) => {
                                    resolve(results);
                                }).catch((error) => {
                                    reject(error);
                                });
                            });
                        };
    
                        service.values[service.characteristics[k].type] = service.characteristics[k].value;
                    }

                    results.push(service);
                }
            }
        }

        return results;
    }

    refresh(service) {
        return new Promise((resolve, reject) => {
            Request.get(`http://127.0.0.1:${HBS.config.bridge.port}/characteristics?id=${service.characteristics.map(c => `${service.aid}.${c.iid}`).join(",")}`).then((response) => {
                for (let i = 0; i < response.data.characteristics.length; i++) {
                    const index = service.characteristics.findIndex(x => x.iid === response.data.characteristics[i].iid && x.aid === service.aid);

                    service.characteristics[index].value = response.data.characteristics[i].value;
                    service.values[service.characteristics[index].type] = response.data.characteristics[i].value;
                }

                resolve(service);
            }).catch((error) => {
                reject(error);
            });
        });
    }

    get(service, iid) {
        return new Promise((resolve, reject) => {
            Request.get(`http://127.0.0.1:${HBS.config.bridge.port}/characteristics?id=${service.aid}.${iid}`).then((response) => {
                const idx = service.characteristics.findIndex(item => item.iid === response.data.characteristics[0].iid && item.aid === service.aid);

                service.characteristics[idx].value = response.data.characteristics[0].value;
                service.values[service.characteristics[idx].type] = c.value;

                resolve(characteristic);
            }).catch((error) => {
                reject(error);
            });
        });
    }

    set(service, iid, value) {
        return new Promise((resolve, reject) => {
            Request.defaults.headers.put["Authorization"] = HBS.config.bridge.pin;

            Request.put(`http://127.0.0.1:${HBS.config.bridge.port}/characteristics`, {
                characteristics: [{
                    aid: service.aid,
                    iid: iid,
                    value: value
                }]
            },{
                headers: {
                    "'Authorization'": HBS.config.bridge.pin
                }
            }).then(() => {
                this.accessories(service.aid).then((results) => {
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
        string = string.replace(/_/gi, " ");
        string = string.replace(/-/gi, " ");

        return string.toLowerCase().split(" ").map(word => word.replace(word[0], word[0].toUpperCase())).join(" ");
    }

    decamel(string) {
        string = string.replace(/ /gi, "_");
        string = string.replace(/-/gi, "_");
        string = string.replace(/,/gi, "");
        string = string.replace(/'/gi, "");
        string = string.replace(/"/gi, "");
        string = string.replace(/!/gi, "");
        string = string.replace(/\./gi, "");
        string = string.replace(/\[/gi, "");
        string = string.replace(/\]/gi, "");
        string = string.replace(/\\/gi, "");
        string = string.replace(/\//gi, "");
        string = string.replace(/\^/gi, "");
        string = string.replace(/\$/gi, "");
        string = string.replace(/\|/gi, "");
        string = string.replace(/\?/gi, "");
        string = string.replace(/\*/gi, "");
        string = string.replace(/\+/gi, "");
        string = string.replace(/\(/gi, "");
        string = string.replace(/\)/gi, "");

        return string.toLowerCase();
    }
}
