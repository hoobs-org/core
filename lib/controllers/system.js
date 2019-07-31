var System = require("systeminformation");

module.exports = class SystemController {
    constructor() {
        global.app.get("/system", (request, response) => this.info(request, response));
        global.app.get("/system/cpu", (request, response) => this.cpu(request, response));
        global.app.get("/system/memory", (request, response) => this.memory(request, response));
        global.app.get("/system/activity", (request, response) => this.activity(request, response));
    }

    async info(request, response) {
        if (!global.admin) {
            return response.status(403).json({
                error: "unauthorized"
            });
        }

        return response.send({
            system: await System.system(),
            bios: await System.bios(),
            motherboard: await System.baseboard(),
            chassis: await System.chassis(),
            battery: await System.battery(),
            os: await System.osInfo()
        });
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
}
