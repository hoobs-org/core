const File = require("fs");
const Process = require("child_process");
const Ora = require("ora");

module.exports = () => {
    return new Promise(async (resolve) => {
        let throbber = null;

        const pms = getPms();

        if (pms) {
            throbber = Ora("Rebooting").start();

            Process.exec("shutdown -r now", () => {
                throbber.stopAndPersist();
            });
        }

        resolve();
    });
}

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
}