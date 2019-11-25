const System = require("@hoobs/systeminfo");

const HBS = require("./instance");

const Monitor = async function Monitor() {
    HBS.log.monitor("status", {
        version: HBS.server.version,
        running: HBS.server.running,
        status: HBS.server.running ? "running" : "stopped",
        uptime: new Date() - HBS.server.time
    });

    HBS.log.monitor("load", {
        cpu: await System.currentLoad(),
        memory: await System.mem(),
        temp: await System.cpuTemperature()
    });

    if ((HBS.config.server.polling_seconds || 10) > 0) {
        setTimeout(() => {
            Monitor();
        }, (HBS.config.server.polling_seconds || 10) * 1000);
    }
}

module.exports = Monitor;
