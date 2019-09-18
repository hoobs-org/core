const ServerCache = require("node-cache");

module.exports = class Cache {
    constructor() {
        this.client = new ServerCache();
    }

    get(key) {
        return new Promise((resolve) => {
            this.client.get(key, (error, value) => {
                if (!error) {
                    if(value === undefined){
                        resolve(null);
                    } else {
                        resolve(value);
                    }
                } else {
                    resolve(null);
                }
            });
        });
    }

    set(key, value, age) {
        return new Promise((resolve) => {
            this.client.set(key, value, (age || 30) * 60, () => {
                resolve();
            });
        });
    }
}
