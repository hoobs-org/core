const File = require("fs");
const Process = require("child_process");
const Ora = require("ora");

module.exports = () => {
    return new Promise((resolve) => {
        let throbber = null;

        const pms = getPms();

        switch (pms) {
            case "dnf":
                throbber = Ora("Installing Prerequisites").start();

                Process.execSync("dnf install -y perl python make gcc curl avahi-compat-libdns_sd-devel");

                throbber.stopAndPersist();
                break;

            case "yum":
                throbber = Ora("Installing Prerequisites").start();

                Process.execSync("yum install -y perl python make gcc curl avahi-compat-libdns_sd-devel");

                throbber.stopAndPersist();
                break;

            case "apt":
                throbber = Ora("Installing Prerequisites").start();

                Process.execSync("apt-get update");
                Process.execSync("apt-get install -y perl python make gcc curl libavahi-compat-libdnssd-dev");

                throbber.stopAndPersist();
                break;
        }

        resolve();
    });
};

const getPms = function() {
    if (File.existsSync("/usr/bin/dnf")) {
        return "dnf";
    }

    if (File.existsSync("/usr/bin/yum")) {
        return "yum";
    }

    if (File.existsSync("/usr/bin/apt-get")) {
        return "apt";
    }

    return null;
};
