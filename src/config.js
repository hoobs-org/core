import Request from "axios";
import Cookies from "./cookies";

export default class Config {
    constructor () {
        this._api = HOOBS_CONFIG.client.api;

        if (!Array.isArray(this._api)) {
            this.api = [this._api];
        }

        this._index = 0;

        this._configuration = {};
        this._ui = {};

        this._names = [];
    }

    get socket() {
        return (HOOBS_CONFIG.client || {}).socket || "http://hoobs.local:5128";
    }

    get control() {
        return HOOBS_CONFIG.client.config;
    }

    get server() {
        return this._configuration.server || {};
    }

    get client() {
        return this._ui || {};
    }

    get bridge() {
        return this._configuration.bridge || {};
    }

    get description() {
        return this._configuration.description || "";
    }

    get ports() {
        return this._configuration.ports || {};
    }

    get accessories() {
        return this._configuration.accessories || [];
    }

    get platforms() {
        return this._configuration.platforms || [];
    }

    get instance() {
        return this._api[this._index];
    }

    get count() {
        return this._api.length;
    }

    list() {
        return new Promise((resolve) => {
            if (this._names.length > 0) {
                return resolve(this._names);
            }

            Request.defaults.headers.get["Authorization"] = Cookies.get("token");
   
            const queue = [];

            for (let i = 0; i < this._api.length; i++) {
                queue.push(true);

                Request.get(`${this._api[i]}/config`).then((response) => {
                    this._names.push((response.data.bridge || {}).name || "Unavailable");
                }).catch(() => {
                    this._names.push("Unavailable");
                }).finally(() => {
                    queue.pop();

                    if (queue.length === 0) {
                        resolve(this._names);
                    }
                });
            }

            if (queue.length === 0) {
                resolve(this._names);
            }
        });
    }

    async active(index) {
        if (!index || index === undefined) {
            index = 0;
        }

        if (index < 0) {
            index = 0;
        }

        if (index >= this._api.length) {
            index = this._api.length - 1;
        }

        this._index = index;

        await this.configure();
    }

    async configure() {
        Request.defaults.headers.get["Authorization"] = Cookies.get("token");

        try {
            this._ui = (await Request.get(`${this._api}/config`)).data.client;
        } catch {
            this._ui = HOOBS_CONFIG.client;
        }

        try {
            this._configuration = (await Request.get(`${this.instance}/config`)).data;
        } catch {
            this._configuration = HOOBS_CONFIG;
        }
    }
}
