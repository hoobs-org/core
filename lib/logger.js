const HTTP = require("http");
const Socket = require("socket.io");

module.exports = () => {
    const http = HTTP.createServer();
    const socket = Socket(http);

    socket.origins("*:*");

    socket.on("connection", (client) => {
        log("info", `[${new Date().toLocaleString()}] Log client connected`);

        client.on("info", (message) => {
            log("info", message);
        });

        client.on("debug", (message) => {
            log("debug", message);
        });

        client.on("error", (message) => {
            log("error", message);
        });

        client.on("fatal", (message) => {
            log("fatal", message);
        });

        client.on("push", (data) => {
            socket.emit("push", data);
        });

        client.on("monitor", (data) => {
            socket.emit("monitor", data);
        });

        client.on("disconnect", () => {
            log("info", `[${new Date().toLocaleString()}] Log client disconnected`);
        });
    });

    const log = (type, message) => {
        socket.emit("log", message);
        socket.emit(type, message);

        console.log(message);
    };

    http.listen(config.server.socket || 51828);

    console.log(`[${new Date().toLocaleString()}] Log server running on port ${config.server.socket || 51828}`);

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
