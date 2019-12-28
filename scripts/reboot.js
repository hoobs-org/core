const File = require("fs");
const Process = require("child_process");

module.exports = (install) => {
    return new Promise(async (resolve) => {
        const pms = getPms();

        if (pms) {
            if (install) {
                console.log("---------------------------------------------------------");
                console.log("HOOBS is Installed");
                console.log("Please redirect your browser to http://hoobs.local");
                console.log("---------------------------------------------------------");
                console.log("The HOOBS interface should apear in 5 - 10 minutes");
                console.log("depending on how many plugins you have installed.");
                console.log("---------------------------------------------------------");
            }

            if (File.existsSync("/etc/systemd/system/homebridge.service")) {
                Process.execSync("systemctl stop homebridge.service");
                Process.execSync("systemctl disable homebridge.service");
            }

            Process.execSync("systemctl restart nginx.service");
            Process.execSync("systemctl enable hoobs.service");
            Process.execSync("systemctl restart hoobs.service");
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
