const HBS = require("../instance");
const Plugins = require("../plugins");

module.exports = class PluginsController {
    constructor() {
        HBS.app.get("/api/plugins", (request, response) => this.installed(request, response));
        HBS.app.get("/api/plugins/:name", (request, response) => this.package(request, response));
        HBS.app.post("/api/plugins/:query/:limit", (request, response) => this.search(request, response));
        HBS.app.get("/api/plugins/certified/categories", (request, response) => this.categories(request, response));
        HBS.app.get("/api/plugins/certified/lookup/:name", (request, response) => this.lookup(request, response));
        HBS.app.get("/api/plugins/certified/:category", (request, response) => this.certified(request, response));
        HBS.app.put("/api/plugins/:name", (request, response) => this.install(request, response));
        HBS.app.post("/api/plugins/:name", (request, response) => this.update(request, response));
        HBS.app.delete("/api/plugins/:name", (request, response) => this.uninstall(request, response));
    }

    installed(request, response) {
        Plugins.installed().then((results) => {
            return response.send(results);
        });
    }

    package(request, response) {
        const name = decodeURIComponent(request.params.name);
        const installed = Plugins.list();
        const version = installed[name] ? installed[name].version : null

        Plugins.package(name, version).then((results) => {
            return response.send(results);
        });
    }

    search(request, response) {
        let hoobs = [];
        let homebridge = [];

        const queue = [];

        queue.push(true);

        Plugins.search(decodeURIComponent(request.params.query), "hoobs-plugin", request.params.limit).then((results) => {
            hoobs = results;
        }).finally(() => {
            queue.pop();

            if (queue.length === 0) {
                response.send(hoobs.concat(homebridge));
            }
        });

        queue.push(true);

        Plugins.search(decodeURIComponent(request.params.query), "homebridge-plugin", request.params.limit).then((results) => {
            homebridge = results;
        }).finally(() => {
            queue.pop();

            if (queue.length === 0) {
                response.send(hoobs.concat(homebridge));
            }
        });

        if (queue.length === 0) {
            response.send(hoobs.concat(homebridge));
        }
    }

    categories(request, response) {
        Plugins.categories().then((results) => {
            response.send(results);
        });
    }

    lookup(request, response) {
        const name = decodeURIComponent(request.params.name);

        const results = {
            certified: false
        }

        Plugins.lookup().then((data) => {
            if (data.lookup[name]) {
                results.certified = false;
                results.package = data.lookup[name];
                results.base = name;
            } else if (data.certified[name]) {
                results.certified = true;
                results.package = name;
                results.base = data.certified[name];
            }

            response.send(results);
        }).catch((error) => {
            response.send({
                error: error.message
            });
        });
    }

    certified(request, response) {
        Plugins.certified(request.params.category).then((results) => {
            response.send(results);
        });
    }

    install(request, response) {
        let name = decodeURIComponent(request.params.name) || "";
        let tag = "latest";
        let parts = [];

        if (name.startsWith("@")) {
            parts = name.substr(1).split("@");
            name = `@${parts[0]}`;

            if (parts.length > 1) {
                tag = parts[1];
            }
        } else {
            parts = name.split("@");
            name = parts[0];

            if (parts.length > 1) {
                tag = parts[1];
            }
        }

        if (Plugins.list()[name]) {
            return response.send({
                error: "package already installed"
            });
        }

        Plugins.install(name, tag).then(() => {
            HBS.log.info(`[${new Date().toLocaleString()}] Installed "${name}" package.`);
            HBS.log.push.info(name, "Plugin successfully installed");

            const installed = Plugins.list();
            const version = installed[name] ? installed[name].version : null
            const details = Plugins.getPluginType(name);

            Plugins.package(name, version).then((plugin) => {
                return response.send({
                    success: true,
                    details,
                    plugin
                });
            });
        }).catch(() => {
            HBS.log.push.error(name, "Plugin install failed");

            return response.send({
                error: "plugin can not be installed"
            });
        });
    }

    uninstall(request, response) {
        let name = decodeURIComponent(request.params.name) || "";
        let parts = [];

        if (name.startsWith("@")) {
            parts = name.substr(1).split("@");
            name = `@${parts[0]}`;
        } else {
            parts = name.split("@");
            name = parts[0];
        }

        if (!Plugins.list()[name]) {
            return response.send({
                error: "package not installed"
            });
        }

        Plugins.uninstall(name).then(() => {
            HBS.log.info(`[${new Date().toLocaleString()}] "${name}" package removed.`);
            HBS.log.push.warning(name, "Plugin successfully removed");

            return response.send({
                success: true
            });
        }).catch(() => {
            HBS.log.push.error(name, "Plugin remove failed");

            return response.send({
                error: "plugin can not be uninstalled"
            });
        });
    }

    update(request, response) {
        let name = decodeURIComponent(request.params.name) || "";
        let tag = "latest";
        let parts = [];

        if (name.startsWith("@")) {
            parts = name.substr(1).split("@");
            name = `@${parts[0]}`;

            if (parts.length > 1) {
                tag = parts[1];
            }
        } else {
            parts = name.split("@");
            name = parts[0];

            if (parts.length > 1) {
                tag = parts[1];
            }
        }

        if (!Plugins.list()[name]) {
            HBS.log.push.warning(name, "Plugin not installed");

            return response.send({
                error: "package not installed"
            });
        }

        Plugins.update(name, tag).finally(() => {
            HBS.log.info(`[${new Date().toLocaleString()}] "${name}" package updated.`);
            HBS.log.push.info(name, "Plugin successfully updated");

            return response.send({
                success: true
            });
        });
    }
}
