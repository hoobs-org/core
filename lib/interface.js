const Express = require("express");
const Server = require("./server");

const { join, resolve } = require("path");
const { spawn } = require("child_process");

module.exports = class Interface {
    constructor() {
        this.running = false;

        if (!DEBUG) {
            this.app = Express();

            this.app.use(Express.static(Server.paths.dist));

            this.app.get("*", (request, response) => {
                response.sendFile(resolve(Server.paths.dist, "index.html"));
            });
        }
    }

    build() {
        return new Promise((resolve) => {
            const env = Object.create(process.env);

            env.NODE_ENV = "production";

            const compiler = spawn("node", [
                join(Server.paths.modules.local, "/@vue/cli-service/bin/vue-cli-service.js"),
                "build",
                "--mode=production"
            ], {
                cwd: Server.paths.application,
                env
            });

            compiler.stdout.on("data", (data) => {
                const lines = `${data}`.split("\n");

                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i].trim();

                    if (line !== "") {
                        global.log.info(`[Compiler] ${line}`);
                    }
                }
            });

            compiler.stderr.on("data", (data) => {
                const lines = `${data}`.split("\n");

                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i].trim();

                    if (line !== "") {
                        global.log.error(`[Compiler] ${line}`);
                    }
                }
            });

            compiler.on("exit", () => {
                resolve();
            });
        });
    }

    start() {
        return new Promise((resolve) => {
            if (!this.running) {
                this.running = true;

                if (!DEBUG) {
                    this.build().finally(() => {
                        this.app.listen(config.client.port || 51825);

                        console.log(`[${new Date().toLocaleString()}] Interface running on port ${config.client.port || 51825}`);

                        resolve();
                    });
                } else {
                    const development = spawn("node", [
                        join(Server.paths.modules.local, "/@vue/cli-service/bin/vue-cli-service.js"),
                        "serve",
                        `--port=${config.client.port || 51825}`
                    ], {
                        cwd: Server.paths.application
                    });

                    development.stdout.on("data", (data) => {
                        const lines = `${data}`.split("\n");
        
                        for (let i = 0; i < lines.length; i++) {
                            const line = lines[i].trim();
        
                            if (line !== "") {
                                global.log.info(`[Interface] ${line}`);
                            }
                        }
                    });
        
                    development.stderr.on("data", (data) => {
                        const lines = `${data}`.split("\n");
        
                        for (let i = 0; i < lines.length; i++) {
                            const line = lines[i].trim();
        
                            if (line !== "") {
                                global.log.error(`[Interface] ${line}`);
                            }
                        }
                    });

                    resolve();
                }
            } else {
                resolve();
            }
        });
    }

    reload() {
        return new Promise((resolve) => {
            if (!DEBUG) {
                if (this.running) {
                    this.build().finally(() => {
                        resolve();
                    });
                } else {
                    this.start().finally(() => {
                        resolve();
                    });
                }
            } else {
                resolve();
            }
        });
    }
}
