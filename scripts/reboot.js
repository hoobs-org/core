const File = require("fs");
const Process = require("child_process");

module.exports = (install) => {
    return new Promise(async (resolve) => {
        const pms = getPms();

        if (pms) {
            const services = getServices();

            if (services.hoobs) {
                Process.execSync("systemctl enable hoobs.service");
            }

            if (services.homebridge) {
                Process.execSync("systemctl disable homebridge.service");
            }

            if (services.config) {
                Process.execSync("systemctl disable homebridge-config-ui-x.service");
            }

            if (services.homebridge) {
                Process.execSync("systemctl stop homebridge.service &");
            }

            if (services.hoobs) {
                Process.execSync("systemctl restart hoobs.service &");
            }
        
            if (install) {
                console.log("---------------------------------------------------------");
                console.log("HOOBS is Installed");
                console.log("Please redirect your browser to http://hoobs.local");
                console.log("---------------------------------------------------------");
                console.log("The HOOBS interface should apear in 5 - 10 minutes");
                console.log("depending on how many plugins you have installed.");
                console.log("---------------------------------------------------------");
            }

            if (services.config) {
                Process.execSync("systemctl stop homebridge-config-ui-x.service &");
            }

            if (services.nginx) {
                Process.execSync("systemctl restart nginx.service &");
            }
        }

        resolve();
    });
}

const getServices = function() {
    const results = {
        homebridge: false,
        config: false,
        hoobs: false,
        nginx: false
    };

    if (File.existsSync("/lib/systemd/system/nginx.service")) {
        results.nginx = true;
    }

    if (File.existsSync("/etc/systemd/system/hoobs.service")) {
        results.hoobs = true;
    }

    if (File.existsSync("/etc/systemd/system/homebridge.service")) {
        results.homebridge = true;
    }

    if (File.existsSync("/etc/systemd/system/homebridge-config-ui-x.service")) {
        results.config = true;
    }

    return results;
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
}
