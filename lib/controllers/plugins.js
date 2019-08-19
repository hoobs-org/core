const Plugins = require("../plugins");

module.exports = class PluginsController {
    constructor() {
        global.app.get("/plugins", (request, response) => this.installed(request, response));
        global.app.get("/plugins/:name", (request, response) => this.package(request, response));
        global.app.post("/plugins/:query/:limit", (request, response) => this.search(request, response));
        global.app.get("/plugins/certified/categories", (request, response) => this.categories(request, response));
        global.app.get("/plugins/certified/:category", (request, response) => this.certified(request, response));
        global.app.put("/plugins/:name", (request, response) => this.install(request, response));
        global.app.post("/plugins/:name", (request, response) => this.update(request, response));
        global.app.delete("/plugins/:name", (request, response) => this.uninstall(request, response));
    }

    installed(request, response) {
        if (!global.admin) {
            return response.status(403).json({
                error: "unauthorized"
            });
        }

        Plugins.installed().then((results) => {
            return response.send(results);
        });
    }

    package(request, response) {
        if (!global.admin) {
            return response.status(403).json({
                error: "unauthorized"
            });
        }

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

    certified(request, response) {
        Plugins.certified(request.params.category).then((results) => {
            response.send(results);
        });
    }

    install(request, response) {
        if (!global.admin) {
            return response.status(403).json({
                error: "unauthorized"
            });
        }

        const name = decodeURIComponent(request.params.name);

        if (Plugins.list()[name]) {
            return response.send({
                error: "package already installed"
            });
        }

        Plugins.install(name).then(() => {
            global.log.info(`[${new Date().toLocaleString()}] Installed "${name}" package.`);

            return response.send({
                success: true
            });
        });
    }

    uninstall(request, response) {
        if (!global.admin) {
            return response.status(403).json({
                error: "unauthorized"
            });
        }

        const name = decodeURIComponent(request.params.name);

        if (!Plugins.list()[name]) {
            return response.send({
                error: "package not installed"
            });
        }

        Plugins.uninstall(name).then(() => {
            global.log.info(`[${new Date().toLocaleString()}] "${name}" package removed.`);

            return response.send({
                success: true
            });
        });
    }

    update(request, response) {
        if (!global.admin) {
            return response.status(403).json({
                error: "unauthorized"
            });
        }

        const name = decodeURIComponent(request.params.name);

        if (!Plugins.list()[name]) {
            return response.send({
                error: "package not installed"
            });
        }

        Plugins.update(name).then(() => {
            global.log.info(`[${new Date().toLocaleString()}] "${name}" package updated.`);

            return response.send({
                success: true
            });
        });
    }
}
