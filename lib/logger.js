const HBS = require("./instance");
const User = require("./user");

module.exports = (socket) => {
    const cache = [];

    let client = null;

    socket.app.ws("/monitor", (wss, request) => {
        if (User.validateToken(request.query.a)) {
            client = wss;
        }

        wss.on("message", (message) => {
            if (client) {
                switch (message) {
                    case "{HISTORY}":
                        client.send(JSON.stringify({
                            event: "log",
                            data: "{CLEAR}"
                        }));
            
                        for (let i = 0; i < cache.length; i++) {
                            client.send(JSON.stringify({
                                event: "log",
                                data: cache[i]
                            }));
                        }

                        break;
                }
            }
        });
    });

    const log = (type, message) => {
        cache.push(message);

        while (cache.length >= 500) {
            cache.shift()
        }

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
            if (HBS.debug) {
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
        },
        update: () => {
            if (client && client.readyState === 1) {
                client.send(JSON.stringify({
                    event: "update"
                }));
            }
        }
    };
};
