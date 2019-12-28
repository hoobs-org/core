const File = require("fs");
const Process = require("child_process");
const Ora = require("ora");

module.exports = () => {
    return new Promise(async (resolve) => {
        let throbber = null;

        const pms = getPms();

        if (pms) {
            console.log("---------------------------------------------------------");
            console.log("HOOBS is Installed");
            console.log("Please redirect your browser to http://hoobs.local");
            console.log("---------------------------------------------------------");
            console.log("The HOOBS interface should apear in 5 - 10 minutes");
            console.log("depending on how many plugins you have installed.");
            console.log("---------------------------------------------------------");

            throbber = Ora("Rebooting").start();

            if (File.existsSync("/etc/systemd/system/homebridge.service")) {
                Process.execSync("systemctl disable homebridge.service");
            }

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
