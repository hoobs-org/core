const _ = require("lodash");

const File = require("fs-extra");
const Forms = require("formidable");

const HBS = require("../instance");
const Server = require("../server");
const User = require("../user");

const { join } = require("path");

module.exports = class ConfigController {
    constructor(client) {
        this.client = client || false;

        HBS.app.get("/api/config", (request, response) => this.get(request, response));
        HBS.app.get("/api/config/client", (request, response) => this.interface(request, response));
        HBS.app.post("/api/config", (request, response) => this.save(request, response));
        HBS.app.post("/api/config/backup", (request, response) => this.backup(request, response));
        HBS.app.post("/api/config/restore", (request, response) => this.restore(request, response));

        if (this.client) {
            HBS.app.put("/api/config/register", (request, response) => this.register(request, response));
        }

        if (!this.client) {
            HBS.app.get("/api/config/generate", (request, response) => this.generate(request, response));
        }
    }

    async register(request, response) {
        if (!(await User.validateToken(request.headers.authorization))) {
            return response.send({
                error: "Unauthorized."
            });
        }

        const data = HBS.JSON.load(join(Server.paths.config, "config.json"), {});

        if (!data.client.instances) {
            data.client.instances = [];
        }

        if (data.client.instances.indexOf(request.body.instance) === -1) {
            data.client.instances.push(request.body.instance);
        }

        Server.saveConfig(data);

        HBS.config = await Server.configure();

        return response.send({
            success: true
        });
    }

    async get(request, response) {
        if (this.client) {
            if (!HBS.config.client.instances || HBS.config.client.instances.length === 0) {
                return response.send({
                    system: HBS.config.system || "hoobs",
                    client: HBS.config.client || {},
                    mode: "cluster"
                });
            } else {
                return response.send({
                    system: HBS.config.system || "hoobs",
                    client: HBS.config.client || {}
                });
            }
        }

        if (!await User.validateToken(request.headers.authorization)) {
            return response.send({
                system: HBS.config.system || "hoobs",
                server: HBS.config.server || {},
                client: HBS.config.client || {},
                bridge: HBS.config.bridge || {}
            });
        }

        return response.send({
            system: HBS.config.system || "hoobs",
            server: HBS.config.server || {},
            client: HBS.config.client || {},
            bridge: HBS.config.bridge || {},
            description: HBS.config.description || "",
            ports: HBS.config.ports || {},
            accessories: HBS.config.accessories || [],
            platforms: HBS.config.platforms || []
        });
    }

    interface(request, response) {
        let current = {
            client: {}
        };

        current = _.extend(current, HBS.JSON.load(join(Server.paths.config, HBS.name || "", "config.json"), current));

        return response.send(current.client || {});
    }

    generate(request, response) {
        return response.send({
            username: Server.generateUsername()
        });
    }

    async save(request, response) {
        const data = HBS.JSON.load(join(Server.paths.config, HBS.name || "", "config.json"), {});

        if (request.body.client) {
            data.client = request.body.client;
        }

        if (!this.client) {
            if (request.body.server) {
                const setupId = data.server.home_setup_id;

                data.server = request.body.server;
                data.server.home_setup_id = setupId;
            }

            if (request.body.bridge) {
                data.bridge = request.body.bridge;
            }

            data.ports = request.body.ports;
            data.description = request.body.description;
            data.accessories = request.body.accessories;
            data.platforms = request.body.platforms;
        }

        Server.saveConfig(data);

        HBS.config = await Server.configure();

        return response.send({
            success: true
        });
    }

    backup(request, response) {
        File.copyFileSync(join(Server.paths.config, HBS.name || "", "config.json"), join(Server.paths.config, HBS.name || "", `/config-${new Date().getTime()}.json`));

        return response.send({
            success: true,
            config: HBS.config
        });
    }

    restore(request, response) {
        if (!HBS.admin) {	
            return response.status(403).json({	
                error: "unauthorized"	
            });	
        }

        const form = new Forms.IncomingForm();

        form.parse(request, async (error, fields, files) => {
            HBS.log.info("[Restore Configuration] Reading Recovery Configuration");

            const contents = HBS.JSON.load(files.file.path);

            if (contents) {
                Server.saveConfig(contents);

                HBS.log.info("[Restore Configuration] Saving Recovery Configuration");

                HBS.config = await Server.configure();

                File.unlinkSync(files.file.path);

                HBS.log.info("[Restore Configuration] Rebooting");

                Server.reboot();

                return response.send({
                    success: true
                });
            }

            return response.send({
                error: "Coult not load the restore file.",
                success: false
            });
        });
    }
}
