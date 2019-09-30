const File = require("fs");
const Path = require("path");
const Ora = require("ora");

module.exports = () => {
    let throbber;

    if (File.existsSync("/home")) {
        throbber = Ora("Checking Configuration").start();

        const folders = File.readdirSync("/home").filter(file => File.lstatSync(Path.join("/home", file)).isDirectory());

        for (let i = 0; i < folders.length; i++) {
            if (File.existsSync(Path.join("/home", folders[i], ".hoobs/etc/config.json"))) {
                reConfigure(Path.join("/home", folders[i], ".hoobs/etc/config.json"));
            }
        }

        throbber.stop();
    }

    if (File.existsSync("/root/.hoobs/etc/config.json")) {
        throbber = Ora("Checking Configuration").start();

        reConfigure("/root/.hoobs/etc/config.json");

        throbber.stop();
    }

    if (File.existsSync("/Users")) {
        throbber = Ora("Checking Configuration").start();

        const folders = File.readdirSync("/Users").filter(file => File.lstatSync(Path.join("/Users", file)).isDirectory());

        for (let i = 0; i < folders.length; i++) {
            if (File.existsSync(Path.join("/Users", folders[i], ".hoobs/etc/config.json"))) {
                reConfigure(Path.join("/Users", folders[i], ".hoobs/etc/config.json"));
            }
        }

        throbber.stop();
    }

    if (File.existsSync("/var/root/.hoobs/etc/config.json")) {
        throbber = Ora("Checking Configuration").start();

        reConfigure("/var/root/.hoobs/etc/config.json");

        throbber.stop();
    }
}

const reConfigure = function(filename) {
    const config = JSON.parse(File.readFileSync(filename));

    if (config.client.port) {
        config.server.port = config.client.port;
    }

    if (config.client.api) {
        if (!Array.isArray(config.client.api)) {
            config.client.api = [config.client.api];
        }

        const instances = [];

        for (let i = 0; i < config.client.api.length; i++) {
            if ((`${config.client.api[i]}`).indexOf("http://") === 0 || (`${config.client.api[i]}`).indexOf("https://") === 0) {
                instances.push(config.client.api[i]);
            }
        }

        if (instances.length > 0) {
            config.client.instances = instances;
        }
    }

    delete config.client.domain;
    delete config.client.port;
    delete config.client.config;
    delete config.client.socket;
    delete config.client.api;

    delete config.server.socket;

    File.writeFileSync(filename, JSON.stringify(config, null, 4));
}
