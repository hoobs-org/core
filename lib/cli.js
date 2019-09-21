const File = require("fs-extra");
const API = require("./api");
const Client = require("./client");
const Server = require("./server");
const Interface = require("./interface");
const Program = require("commander");

const { join, resolve } = require("path");

DEBUG = false;
INSTANCE = null;
STORAGE = null;
SUDO_PWD = null;

module.exports = async () => {
    mode = "default";
    socketClient = false;
    application = JSON.parse(File.readFileSync(join(Server.paths.application, "/package.json")));

    const root = join(__filename, "../../");

    const options = [
        "-R"
    ];

    Program.version(application.version, "-v, --version");

    Program.option("-S, --socket-client", "don't start a socket server", () => {
                socketClient = true;
            })
           .option("-D, --debug", "turn on debug level logging", () => {
                DEBUG = true;

                options.push("-D");
            })
           .option("-N, --instance [name]", "start homebridge as a named instance", (name) => {
                INSTANCE = name;

                socketClient = true;
                mode = "server";
            })
           .option("-p, --sudo-pwd [password]", "password to use for sudo commands", (password) => {
                SUDO_PWD = password;
            })
           .option("-U, --user-storage-path [path]", "look for homebridge user files at [path] instead of the default location (~/.homebridge)", (path) => {
                STORAGE = resolve(path);
            })
           .option("-P, --plugin-path [path]", "look for plugins installed at [path] as well as the default locations ([path] can also point to a single plugin)")
           .option("-R, --remove-orphans", "remove cached accessories for which plugin is not loaded")
           .option("-C, --color", "force color in logging")
           .option("-I, --insecure", "allow unauthenticated requests")
           .option("-Q, --no-qrcode", "do not issue QRcode in logging")
           .option("-T, --no-timestamp", "do not issue timestamps in logging")
           .action((command) => {
                if(typeof command === "string") {
                    mode = command;
                }
            });        

    Program.parse(process.argv);

    config = await Server.configure();

    switch (mode) {
        case "server":
            if (socketClient) {
                log = require("./logger-client")();
            } else {
                log = require("./logger")();
            }

            server = new Server(options);
            api = new API();
        
            process.once("SIGINT", async () => {
                await server.stop();

                process.exit();
            });

            process.once("SIGTERM", async () => {
                await server.stop();

                process.exit();
            });
        
            process.once("uncaughtException", async (error) => {
                console.log(error.stack);
        
                await server.stop();

                process.exit(1);
            });

            server.start();        
            api.start();

            break;

        case "client":
            log = require("./logger-client")();

            ui = new Interface();
            client = new Client();

            client.start();
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

            process.once("SIGINT", async () => {
                await server.stop();

                process.exit();
            });

            process.once("SIGTERM", async () => {
                await server.stop();

                process.exit();
            });
        
            process.once("uncaughtException", async (error) => {
                console.log(error.stack);
        
                await server.stop();

                process.exit(1);
            });
        
            if (config.server.autostart) {
                server.start();
            }

            api.start();
            ui.start();

            break;
    }
};
