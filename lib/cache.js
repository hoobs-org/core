const ServerCache = require("node-cache");

module.exports = class Cache {
    constructor() {
        this.client = new ServerCache();
    }

    get(key) {
        const value = this.client.get(key);

        if(value === undefined){
            return null;
        }

        return value;
    }

    set(key, value, age) {
        return this.client.set(key, value, (age || 30) * 60);
    }

    remove(key) {
        this.client.del(key);
    }
}
