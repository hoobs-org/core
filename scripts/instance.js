const File = require("fs-extra");
const Prompt = require("prompt");
const Sanitize = require("sanitize-filename");

const { dirname, join } = require("path");

module.exports = () => {
    const root = dirname(File.realpathSync(__filename));

    const questions = {
        properties: {
            name: {
                description: "Enter a name for the instance",
                message: "Instance name is required",
                required: true,
                before: (value) => {
                    return Sanitize(value);
                }
            },
            port: {
                description: "Enter the port this will run on",
                pattern: /^\d+$/,
                default: "52827",
                required: true,
                before: (value) => {
                    return parseInt(value, 10);
                }
            },
            username: {
                description: "Enter your HOOBS username",
                message: "Username is required",
                required: true
            },
            password: {
                description: "Enter your HOOBS password",
                message: "Password is required",
                required: true,
                hidden: true
            },
            bridge: {
                description: "Enter the port for Homebridge",
                pattern: /^\d+$/,
                default: "52826",
                required: true,
                before: (value) => {
                    return parseInt(value, 10);
                }
            },
            client: {
                description: "Enter the URL of the client",
                pattern: /^(http(s)?:\/\/)[-a-zA-Z0-9@:%_\+.~]*$/,
                message: "Invalid URL",
                default: "http://hoobs.local:8080",
                required: true
            }
        }
    };

    Prompt.start();

    Prompt.get(questions, async (error, result) => {
        if (!error) {
            result.service = `hoobs.${result.name.replace(/[^a-zA-Z0-9]/gi, "").toLowerCase()}.service`;

            writeJson("config.json", result);

            await (require(join(root, "../scripts/prerequisites")))();
            await (require(join(root, "../scripts/systemd")))(true, "instance", result.name, result.service, result.port, result.bridge);
            await (require(join(root, "../scripts/reboot")))(false, result.service);
        }
    });
};

const writeJson = function (filename, data) {
    if (!File.existsSync("/var/hoobs")) {
        File.mkdirSync("/var/hoobs");
        File.chmodSync("/var/hoobs", 0755);
    }

    if (!File.existsSync("/var/hoobs/.instance")) {
        File.mkdirSync("/var/hoobs/.instance");
        File.chmodSync("/var/hoobs/.instance", 0755);
    }

    if (File.existsSync(Path.join("/var/hoobs/.instance/", filename))) {
        File.unlinkSync(Path.join("/var/hoobs/.instance/", filename));
    }

    File.appendFileSync(Path.join("/var/hoobs/.instance/", filename), JSON.stringify(data, null, 4));
    File.chmodSync(Path.join("/var/hoobs/.instance/", filename), 0755);
};
