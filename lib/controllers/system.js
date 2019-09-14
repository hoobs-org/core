const System = require("@hoobs/systeminfo");
const Plugins = require("../plugins");

module.exports = class SystemController {
    constructor() {
        global.app.get("/api/system", (request, response) => this.info(request, response));
        global.app.get("/api/system/cpu", (request, response) => this.cpu(request, response));
        global.app.get("/api/system/memory", (request, response) => this.memory(request, response));
        global.app.get("/api/system/filesystem", (request, response) => this.filesystem(request, response));
        global.app.get("/api/system/activity", (request, response) => this.activity(request, response));
        global.app.get("/api/system/releases", (request, response) => this.releases(request, response));
        global.app.get("/api/system/updates", (request, response) => this.updates(request, response));
        global.app.get("/api/system/temp", (request, response) => this.temp(request, response));
    }

    async info(request, response) {
        if (!global.admin) {
            return response.status(403).json({
                error: "unauthorized"
            });
        }

        return response.send({
            system: await System.system(),
            operating_system: await System.osInfo()
        });
    }

    async temp(request, response) {
        if (!global.admin) {
            return response.status(403).json({
                error: "unauthorized"
            });
        }

        return response.send(await System.cpuTemperature());
    }

    async cpu(request, response) {
        if (!global.admin) {
            return response.status(403).json({
                error: "unauthorized"
            });
        }

        return response.send({
            information: await System.cpu(),
            speed: await System.cpuCurrentspeed(),
            load: await System.currentLoad(),
            cache: await System.cpuCache()
        });
    }

    async memory(request, response) {
        if (!global.admin) {
            return response.status(403).json({
                error: "unauthorized"
            });
        }

        return response.send({
            information: await System.memLayout(),
            load: await System.mem()
        });
    }

    async activity(request, response) {
        if (!global.admin) {
            return response.status(403).json({
                error: "unauthorized"
            });
        }

        return response.send(await System.currentLoad());
    }

    async filesystem(request, response) {
        if (!global.admin) {
            return response.status(403).json({
                error: "unauthorized"
            });
        }

        return response.send(await System.fsSize());
    }

    releases(request, response) {
        if (!global.admin) {
            return response.status(403).json({
                error: "unauthorized"
            });
        }

        Plugins.releases().then((results) => {
            return response.send(results);
        }).catch((error) => {
            return response.status(500).json({
                error
            });
        });
    }

    updates(request, response) {
        if (!global.admin) {
            return response.status(403).json({
                error: "unauthorized"
            });
        }

        Plugins.releases().then((results) => {
            return response.send(results.filter((r) => {
                return Plugins.checkVersion(global.application.version, r.version);
            }));
        }).catch((error) => {
            return response.status(500).json({
                error
            });
        });
   }
}
