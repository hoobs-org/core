const System = require("systeminformation");

const HBS = require("../instance");
const Plugins = require("../plugins");

module.exports = class SystemController {
    constructor() {
        HBS.app.get("/api/system", (request, response) => this.info(request, response));
        HBS.app.get("/api/system/cpu", (request, response) => this.cpu(request, response));
        HBS.app.get("/api/system/memory", (request, response) => this.memory(request, response));
        HBS.app.get("/api/system/filesystem", (request, response) => this.filesystem(request, response));
        HBS.app.get("/api/system/activity", (request, response) => this.activity(request, response));
        HBS.app.get("/api/system/releases", (request, response) => this.releases(request, response));
        HBS.app.get("/api/system/updates", (request, response) => this.updates(request, response));
        HBS.app.get("/api/system/temp", (request, response) => this.temp(request, response));
    }

    async info(_request, response) {
        const data = {
            system: await System.system(),
            operating_system: await System.osInfo()
        };

        switch (HBS.config.system) {
            case "rocket":
                data.system.manufacturer = "Rocket Smart Home";
                data.system.model = "RFLM-1";
                data.system.sku = "7-45114-12418-0";
                break;

            case "hoobs-box":
                data.system.manufacturer = "HOOBS.org";
                data.system.model = "HSLF-1";
                data.system.sku = "7-45114-12419-7";
                break;
        }
    
        return response.send(data);
    }

    async temp(_request, response) {
        return response.send(await System.cpuTemperature());
    }

    async cpu(_request, response) {
        return response.send({
            information: await System.cpu(),
            speed: await System.cpuCurrentspeed(),
            load: await System.currentLoad(),
            cache: await System.cpuCache()
        });
    }

    async memory(_request, response) {
        return response.send({
            information: await System.memLayout(),
            load: await System.mem()
        });
    }

    async activity(_request, response) {
        return response.send(await System.currentLoad());
    }

    async filesystem(_request, response) {
        return response.send(await System.fsSize());
    }

    releases(_request, response) {
        Plugins.releases().then((results) => {
            return response.send(results);
        }).catch((error) => {
            return response.status(500).json({
                error
            });
        });
    }

    updates(_request, response) {
        Plugins.releases().then((results) => {
            return response.send(results.filter((r) => {
                return Plugins.checkVersion(HBS.application.version, r.version);
            }));
        }).catch((error) => {
            return response.status(500).json({
                error
            });
        });
   }
}
