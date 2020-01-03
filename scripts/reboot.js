const File = require("fs");
const Process = require("child_process");

module.exports = (reboot, service) => {
    return new Promise(async (resolve) => {
        service = service || "hoobs.service";

        if (getPms()) {
            Process.execSync(`systemctl enable ${service}`);

            if (File.existsSync("/etc/systemd/system/multi-user.target.wants/homebridge.service")) {
                Process.execSync("systemctl disable homebridge.service");
            }

            if (File.existsSync("/etc/systemd/system/multi-user.target.wants/homebridge-config-ui-x.service")) {
                Process.execSync("systemctl disable homebridge-config-ui-x.service");
            }
        
            if (reboot) {
                console.log("---------------------------------------------------------");
                console.log("HOOBS is Installed");
                console.log("Please redirect your browser to http://hoobs.local");
                console.log("---------------------------------------------------------");
                console.log("The HOOBS interface should apear in 5 - 10 minutes");
                console.log("depending on how many plugins you have installed.");
                console.log("---------------------------------------------------------");
            }

            if (!reboot) {
                if (File.existsSync("/etc/systemd/system/multi-user.target.wants/homebridge.service")) {
                    Process.execSync("systemctl stop homebridge.service");
                }
    
                if (File.existsSync("/etc/systemd/system/multi-user.target.wants/homebridge-config-ui-x.service")) {
                    Process.execSync("systemctl stop homebridge-config-ui-x.service");
                }

                Process.execSync(`systemctl restart ${service}`);
            }
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
