const Socket = require("socket.io-client");

module.exports = () => {
    let url = config.server.socket || `http://${global.config.system}.local:5128`;

    if (!Number.isNaN(parseInt(url, 10))) {
        url = `http://${global.config.system}.local:${config.server.socket}`;
    }

    const socket = Socket(url, {
        reconnect: true
    });

    socket.on("connection", () => {
        log("info", `[${new Date().toLocaleString()}] Connected to log`);
    });

    socket.on("disconnect", () => {
        log("info", `[${new Date().toLocaleString()}] Disconnected from log`);
    });

    const log = (type, message) => {
        socket.emit("log", message);
        socket.emit(type, message);

        console.log(message);
    };

    return {
        info: (message) => {
            log("info", message);
        },
        debug: (message) => {
            if (DEBUG) {
                log("debug", message);
            }
        },
        error: (message) => {
            log("error", message);
        },
        fatal: (message) => {
            log("fatal", message);
        },
        push: (name, data) => {
            socket.emit("push", JSON.stringify({
                name,
                data
            }));
        },
        monitor: (name, data) => {
            socket.emit("monitor", JSON.stringify({
                name,
                data
            }));
        }
    };
};
