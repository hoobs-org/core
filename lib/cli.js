const File = require("fs-extra");
const Glob = require("glob");
const API = require("./api");
const Client = require("./client");
const Server = require("./server");
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

    process.on("unhandledRejection", (reason, promise) => {
        console.log(`[${new Date().toLocaleString()}] Unhandled Rejection "${reason} - ${promise}".`);
    });

    Server.proxyCheck();

    config = await Server.configure();

    switch ((config.system || "").toLowerCase()) {
        case "rocket":
            config.system = "rocket";
            break;

        case "hoobs-box":
            config.system = "hoobs-box";
            break;

        default:
            config.system = "hoobs";
            break;
    }

    const junk = (Glob.sync(join(Server.paths.application, "restore-*.zip"))).concat(Glob.sync(join(Server.paths.dist, "backup-*.hbf")));

    for (let i = 0; i < junk.length; i++) {
        File.unlinkSync(junk[i]);
    }

    switch (mode) {
        case "server":
            api = new API(null, false);
            server = new Server(options);
        
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

            api.start();
            
            if (!Number.isNaN(parseInt(config.server.autostart))) {
                setTimeout(() => {
                    server.start();
                }, config.server.autostart * 1000);
            }

            break;

        case "client":
            client = new Client();
            client.start();

            break;

        default:
            api = new API(null, true);
            server = new Server(options);

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

            api.start();

            if (!Number.isNaN(parseInt(config.server.autostart))) {
                setTimeout(() => {
                    server.start();
                }, config.server.autostart * 1000);
            }

            break;
    }
};
