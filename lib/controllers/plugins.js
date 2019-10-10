const Plugins = require("../plugins");

module.exports = class PluginsController {
    constructor() {
        global.app.get("/api/plugins", (request, response) => this.installed(request, response));
        global.app.get("/api/plugins/:name", (request, response) => this.package(request, response));
        global.app.post("/api/plugins/:query/:limit", (request, response) => this.search(request, response));
        global.app.get("/api/plugins/certified/categories", (request, response) => this.categories(request, response));
        global.app.get("/api/plugins/certified/lookup/:name", (request, response) => this.lookup(request, response));
        global.app.get("/api/plugins/certified/:category", (request, response) => this.certified(request, response));
        global.app.put("/api/plugins/:name", (request, response) => this.install(request, response));
        global.app.post("/api/plugins/:name", (request, response) => this.update(request, response));
        global.app.delete("/api/plugins/:name", (request, response) => this.uninstall(request, response));
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
        Plugins.search(decodeURIComponent(request.params.query), request.params.limit).then((results) => {
            response.send(results);
        });
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
        const name = decodeURIComponent(request.params.name);

        if (Plugins.list()[name]) {
            return response.send({
                error: "package already installed"
            });
        }

        Plugins.install(name).then((success) => {
            global.log.info(`[${new Date().toLocaleString()}] Installed "${name}" package.`);

            if (success) {
                const installed = Plugins.list();
                const version = installed[name] ? installed[name].version : null
                const details = Plugins.getPluginType(name);

                Plugins.package(name, version).then((plugin) => {
                    return response.send({
                        success,
                        details,
                        plugin
                    });
                });
            } else {
                return response.send({
                    error: "plugin can not be installed"
                });
            }
        });
    }

    uninstall(request, response) {
        const name = decodeURIComponent(request.params.name);

        if (!Plugins.list()[name]) {
            return response.send({
                error: "package not installed"
            });
        }

        Plugins.uninstall(name).finally(() => {
            global.log.info(`[${new Date().toLocaleString()}] "${name}" package removed.`);

            return response.send({
                success: true
            });
        });
    }

    update(request, response) {
        const name = decodeURIComponent(request.params.name);

        if (!Plugins.list()[name]) {
            return response.send({
                error: "package not installed"
            });
        }

        Plugins.update(name).finally(() => {
            global.log.info(`[${new Date().toLocaleString()}] "${name}" package updated.`);

            return response.send({
                success: true
            });
        });
    }
}
