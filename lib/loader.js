const File = require("fs-extra");
const API = require("./api");
const Server = require("./server");
const Interface = require("./interface");
const Program = require("commander");

const { join } = require("path");

DEBUG = false;
PLUGINS = null;

module.exports = () => {
    mode = "default";
    socketClient = false;

    const application = JSON.parse(File.readFileSync(join(Server.paths.application, "/package.json")));
    const root = join(__filename, "../../");

    const options = [
        "-Q",
        "-I"
    ];

    Program.version(application.version, "-v, --version");

    Program.option("-C, --socket-client", "don't start a socket server", () => {
                socketClient = true;
            })
           .option("-D, --debug", "turn on debug level logging", () => {
                DEBUG = true;

                options.push("-D");
            })
           .option("-I, --insecure", "allow unauthenticated requests (for easier hacking)", () => {
                options.push("-I");
            })
           .option("-P, --plugin-path [path]", "look for plugins installed at [path] as well as the default locations ([path] can also point to a single plugin)", (path) => {
                PLUGINS = File.realpathSync(join(root, path));
            })
           .option("-R, --remove-orphans", "remove cached accessories for which plugin is not loaded", () => {
                options.push("-R");
            })
           .action((command) => {
                if(typeof command === "string") {
                    mode = command;
                }
            });

    Program.parse(process.argv);

    config = Server.configure();

    switch (mode) {
        case "server":
            if (socketClient) {
                log = require("./logger-client")();
            } else {
                log = require("./logger")();
            }

            server = new Server(options);
            api = new API();

            server.on("start", () => {
                config = Server.configure();
            });

            server.start();        
            api.start();

            break;

        case "client":
            config = Server.configure();

            ui = new Interface();
            ui.start();

            break;

        case "log":
            log = require("./logger")();
            break;

        default:
            log = require("./logger")();

            server = new Server(options);
            ui = new Interface();
            api = new API();
        
            server.on("start", () => {
                config = Server.configure();
            });
        
            if (config.server.autostart) {
                server.start();
            }
        
            api.start();
            ui.start();

            break;
    }
};
