module.exports = (socket) => {
    socket.app.ws("/monitor", (ws) => {
        ws.on("connection", () => {
            log("info", `[${new Date().toLocaleString()}] Log client connected`);
        });
    });

    const log = (type, message) => {
        const connection = socket.getWss("/monitor");

        connection.clients.forEach((client) => {
            client.send(JSON.stringify({
                event: "log",
                data: message
            }));

            client.send(JSON.stringify({
                event: type,
                data: message
            }));
        });

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
            const connection = socket.getWss("/monitor");

            connection.clients.forEach((client) => {
                client.send(JSON.stringify({
                    event: "push",
                    data: {
                        name,
                        data
                    }
                }));
            });
        },
        monitor: (name, data) => {
            const connection = socket.getWss("/monitor");

            connection.clients.forEach((client) => {
                client.send(JSON.stringify({
                    event: "monitor",
                    data: {
                        name,
                        data
                    }
                }));
            });
        }
    };
};
