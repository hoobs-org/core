const Socket = require("ws");
const Pty = require("node-pty");

module.exports = class Cockpit {
    constructor() {
        this.socket = null;
        this.standalone = false;
        this.server = new Socket("wss://cockpit.hoobs.org/handshake");
        this.registration = null;

        this.shell = Pty.fork(process.env.SHELL || "sh", [], {
            name: "xterm-color",
            cwd: process.env.HOME
        });
    }

    register() {
        return new Promise((resolve, reject) => {
            this.server.on("open", () => {
                this.server.send("connect");

                this.server.onmessage = (results) => {
                    const args = (results.data || "").split(" ");

                    if (args.length > 1) {
                        switch (args[0]) {
                            case "connected":
                                resolve(args[1]);
                                break;
                        }
                    } else {
                        reject(new Error("server error"));
                    }
                };
            });
        });
    }

    disconnect() {
        this.socket.close();
        this.shell.destroy();

        if (this.standalone) {
            console.log("disconnected");

            process.exit(1);
        }
    }

    start(standalone) {
        this.standalone = standalone;

        return new Promise((resolve, reject) => {
            this.register().then((registration) => {
                this.registration = registration;
    
                this.socket = new Socket(`wss://cockpit.hoobs.org/${this.registration}`, {
                    binary: true
                });
    
                this.socket.on("open", () => {
                    this.shell.on("data", (data) => {
                        this.socket.send(data);
                    });
        
                    this.socket.onmessage = (message) => {
                        if (message.data === "{EXIT}") {
                            this.disconnect();
                        } else {
                            this.shell.write(message.data);
                        }
                    };
                });

                resolve(this.registration.match(/.{1,3}/g).join("-"));
            }).catch((error) => {
                reject(error);
            });
        });
    }
}
