const Glob = require("glob");
const File = require("fs-extra");
const Program = require("commander");

const HBS = require("./instance");
const API = require("./api");
const Client = require("./client");
const Server = require("./server");

const { join, resolve } = require("path");

const teardown = function teardown(status) {
    if (HBS) {
        if (HBS.log) {
            HBS.log.info("[HOOBS] Stopping server.");
        }

        HBS.api = null;
        HBS.app = null;
        HBS.application = null;
        HBS.cache = null;
        HBS.client = null;
        HBS.config = null;
        HBS.controllers = null;
        HBS.layout = null;
        HBS.log = null;
        HBS.options = null;
        HBS.server = null;
        HBS.user = null;
        HBS.users = null;
        HBS.cpmod = null;
    }

    process.exit(status || 0);
};

module.exports = async () => {
    HBS.application = HBS.JSON.load(join(Server.paths.application, "/package.json"));

    Program.version(HBS.application.version, "-v, --version");
    Program.allowUnknownOption();

    Program.option("-d, --debug", "turn on debug level logging", () => {
                HBS.debug = true;
                HBS.options.push("-D");
            })
           .option("-i, --instance [name]", "start homebridge as a named instance", (name) => {
                HBS.name = name;
                HBS.mode = "server";
            })
           .option("-p, --pass [password]", "password to use for elevated commands", (password) => {
                HBS.sudo = password;
            })
           .option("--ignore-modules", "don't coppy modules on start (development)", () => {
                HBS.cpmod = false;
            })
           .action((command) => {
                if(typeof command === "string") {
                    HBS.mode = command;
                }
            });        

    Program.parse(process.argv);

    process.on("unhandledRejection", (reason, promise) => {
        console.log(`[${new Date().toLocaleString()}] Unhandled Rejection "${reason}".`);

        promise.catch((error) => {
            if (HBS.debug) {
                console.log(error.stack);
            }
        });
    });

    HBS.config = await Server.configure();

    switch ((HBS.config.system || "").toLowerCase()) {
        case "rocket":
            HBS.config.system = "rocket";
            break;

        case "hoobs-box":
            HBS.config.system = "hoobs-box";
            break;

        default:
            HBS.config.system = "hoobs";
            break;
    }

    const junk = ((Glob.sync(join(Server.paths.application, "restore-*.zip"))) || []).concat((Glob.sync(join(Server.paths.dist, "backup-*.hbf"))) || []);

    for (let i = 0; i < junk.length; i++) {
        File.unlinkSync(junk[i]);
    }

    switch (HBS.mode) {
        case "server":
            HBS.api = new API(null, false);
            HBS.server = new Server(HBS.options);
        
            process.once("SIGINT", async () => {
                await HBS.server.stop();

                teardown();
            });

            process.once("SIGTERM", async () => {
                await HBS.server.stop();

                teardown();
            });
        
            process.once("uncaughtException", async (error) => {
                console.log(`[${new Date().toLocaleString()}] ${error.message}`);
                console.log(error.stack);

                await HBS.server.stop();

                teardown(1);
            });

            HBS.api.start();
            
            if (!Number.isNaN(parseInt(HBS.config.server.autostart))) {
                setTimeout(() => {
                    HBS.server.start();
                }, HBS.config.server.autostart * 1000);
            }

            break;

        case "client":
            HBS.client = new Client();
            HBS.client.start();

            break;

        default:
            HBS.api = new API(null, true);
            HBS.server = new Server(HBS.options);

            process.once("SIGINT", async () => {
                await HBS.server.stop();

                teardown();
            });

            process.once("SIGTERM", async () => {
                await HBS.server.stop();

                teardown();
            });
        
            process.once("uncaughtException", async (error) => {
                console.log(`[${new Date().toLocaleString()}] ${error.message}`);
                console.log(error.stack);

                await HBS.server.stop();

                teardown(1);
            });

            HBS.api.start();

            if (!Number.isNaN(parseInt(HBS.config.server.autostart))) {
                setTimeout(() => {
                    HBS.server.start();
                }, HBS.config.server.autostart * 1000);
            }

            break;
    }
};
