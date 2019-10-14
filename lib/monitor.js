const System = require("@hoobs/systeminfo");

const Monitor = async function Monitor() {
    global.log.monitor("status", {
        version: server.version,
        running: server.running,
        status: server.running ? "running" : "stopped",
        uptime: new Date() - server.time
    });

    global.log.monitor("load", {
        cpu: await System.currentLoad(),
        memory: await System.mem(),
        temp: await System.cpuTemperature()
    });

    if ((config.server.polling_seconds || 3) > 0) {
        setTimeout(() => {
            Monitor();
        }, (config.server.polling_seconds || 3) * 1000);
    }
}

module.exports = Monitor;
