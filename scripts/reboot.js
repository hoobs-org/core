const File = require("fs");
const Process = require("child_process");

module.exports = (reboot, service) => {
    return new Promise(async (resolve) => {
        service = service || "hoobs.service";

        const pms = getPms(service);

        if (pms) {
            const services = getServices();

            Process.execSync(`systemctl enable ${service}`);

            if (services.homebridge) {
                Process.execSync("systemctl disable homebridge.service");
            }

            if (services.config) {
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

            if (reboot) {
                Process.exec("shutdown -r now");
            } else {
                if (services.homebridge) {
                    Process.execSync("systemctl stop homebridge.service");
                }
    
                if (services.config) {
                    Process.execSync("systemctl stop homebridge-config-ui-x.service");
                }

                Process.execSync(`systemctl restart nginx.service`);
                Process.execSync(`systemctl restart ${service}`);
            }
        }

        resolve();
    });
}

const getServices = function() {
    const results = {
        homebridge: false,
        config: false,
        nginx: false
    };

    if (File.existsSync("/lib/systemd/system/nginx.service")) {
        results.nginx = true;
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
