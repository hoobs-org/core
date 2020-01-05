const Socket = require("ws");
const Pty = require("node-pty");

const HBS = require("./instance");

module.exports = class Cockpit {
    constructor() {
        this.socket = null;
        this.standalone = false;
        this.registration = null;
    }

    register() {
        return new Promise((resolve, reject) => {
            const handshake = new Socket("wss://cockpit.hoobs.org/handshake");

            handshake.on("open", () => {
                handshake.send("connect");

                handshake.onmessage = (results) => {
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

        if (this.shell) {
            this.shell.write('exit\r');
            this.shell.destroy();
        }

        this.shell = null;

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

                this.shell = Pty.fork(process.env.SHELL || "sh", [], {
                    name: "xterm-color",
                    cwd: process.env.HOME
                });
    
                this.socket = new Socket(`wss://cockpit.hoobs.org/${this.registration}`, {
                    binary: true
                });
    
                this.socket.on("open", () => {
                    if (!this.standalone && HBS.log) {
                        HBS.log.push.info("Cockpit", "Remote support session started");
                    }

                    this.shell.on("data", (data) => {
                        this.socket.send(data);
                    });
        
                    this.socket.onmessage = (message) => {
                        if (message.data === "{EXIT}") {
                            if (!this.standalone && HBS.log) {
                                HBS.log.push.warning("Cockpit", "Remote support session stopped");
                            }

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
