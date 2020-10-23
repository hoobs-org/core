/**************************************************************************************************
 * hoobs-core                                                                                     *
 * Copyright (C) 2020 HOOBS                                                                       *
 *                                                                                                *
 * This program is free software: you can redistribute it and/or modify                           *
 * it under the terms of the GNU General Public License as published by                           *
 * the Free Software Foundation, either version 3 of the License, or                              *
 * (at your option) any later version.                                                            *
 *                                                                                                *
 * This program is distributed in the hope that it will be useful,                                *
 * but WITHOUT ANY WARRANTY; without even the implied warranty of                                 *
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the                                  *
 * GNU General Public License for more details.                                                   *
 *                                                                                                *
 * You should have received a copy of the GNU General Public License                              *
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.                          *
 **************************************************************************************************/

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
        data = {
            message: (`${message}`).replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, ""),
            time: new Date().getTime()
        }

        cache.push(data);

        while (cache.length >= 500) {
            cache.shift()
        }

        if (client && client.readyState === 1) {
            client.send(JSON.stringify({
                event: "log",
                data
            }));

            client.send(JSON.stringify({
                event: type,
                data: data.message
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

        command: (action, payload) => {
            if (client && client.readyState === 1) {
                client.send(JSON.stringify({
                    event: "command",
                    data: {
                        action,
                        payload
                    }
                }));
            }
        },

        push: {
            info: (title, message) => {
                if (client && client.readyState === 1) {
                    client.send(JSON.stringify({
                        event: "push",
                        data: {
                            id: `${new Date().getTime()}_${Math.random().toString(36).substr(4, 5)}`,
                            type: "info",
                            time: new Date().getTime(),
                            title,
                            message
                        }
                    }));
                }
            },

            warning: (title, message) => {
                if (client && client.readyState === 1) {
                    client.send(JSON.stringify({
                        event: "push",
                        data: {
                            type: "warning",
                            time: new Date().getTime(),
                            title,
                            message
                        }
                    }));
                }
            },

            error: (title, message) => {
                if (client && client.readyState === 1) {
                    client.send(JSON.stringify({
                        event: "push",
                        data: {
                            type: "error",
                            time: new Date().getTime(),
                            title,
                            message
                        }
                    }));
                }
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
