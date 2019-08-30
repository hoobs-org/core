const File = require("fs-extra");
const Express = require("express");
const Server = require("./server");

const { join, resolve } = require("path");

module.exports = class Interface {
    constructor() {
        this.running = false;

        if (File.existsSync(join(Server.paths.dist, "config.js"))) {
            File.unlinkSync(join(Server.paths.dist, "config.js"));
        }

        File.appendFileSync(join(Server.paths.dist, "config.js"), `HOOBS_CONFIG=${JSON.stringify(config)};`);

        this.app = Express();

        this.app.use(Express.static(Server.paths.dist));

        this.app.get("*", (request, response) => {
            response.sendFile(resolve(Server.paths.dist, "index.html"));
        });
    }

    start() {
        return new Promise((resolve) => {
            if (!this.running) {
                this.running = true;

                this.app.listen(config.client.port || 8080);

                console.log(`[${new Date().toLocaleString()}] Interface running on port ${config.client.port || 51825}`);

                resolve();
            } else {
                resolve();
            }
        });
    }
}
