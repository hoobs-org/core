module.exports = (socket) => {
    let client = null;

    socket.app.ws("/monitor", (ws) => {
        client = ws;

        ws.on("connection", () => {
            log("info", `[${new Date().toLocaleString()}] Log client connected`);
        });
    });

    const log = (type, message) => {
        if (client && client.readyState === 1) {
            client.send(JSON.stringify({
                event: "log",
                data: message
            }));

            client.send(JSON.stringify({
                event: type,
                data: message
            }));
        }

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
            if (client && client.readyState === 1) {
                client.send(JSON.stringify({
                    event: "push",
                    data: {
                        name,
                        data
                    }
                }));
            }
        },
        monitor: (name, data) => {
            if (client && client.readyState === 1) {
                client.send(JSON.stringify({
                    event: "monitor",
                    data: {
                        name,
                        data
                    }
                }));
            }
        }
    };
};
