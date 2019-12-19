const File = require("fs");
const Path = require("path");
const Process = require("child_process");
const Ora = require("ora");

module.exports = () => {
    return new Promise(async (resolve) => {
        let throbber = null;

        const pms = getPms();
        const root = Path.dirname(File.realpathSync(Path.join(__filename, "../")));

        if (pms) {
            if (!(await checkUser("hoobs"))) {
                throbber = Ora("Creating HOOBS User").start();

                Process.execSync("useradd -s /bin/bash -m -d /home/hoobs -p $(perl -e 'print crypt($ARGV[0], \"password\")' \"hoobsadmin\") hoobs");

                if (pms === "yum" || pms === "dnf") {
                    Process.execSync("usermod -a -G wheel hoobs");
                } else {
                    Process.execSync("usermod -a -G sudo hoobs");
                }

                throbber.stopAndPersist();
            }

            if (File.existsSync("/etc/systemd/system/homebridge-config-ui-x.service")) {
                throbber = Ora("Removing UI-X Service").start();

                Process.execSync("systemctl disable homebridge-config-ui-x.service");
                File.unlinkSync("/etc/systemd/system/homebridge-config-ui-x.service");

                throbber.stopAndPersist();
            }

            if (!File.existsSync("/etc/systemd/system/hoobs.service")) {
                throbber = Ora("Installing HOOBS Service").start();

                if (!File.existsSync("/etc/systemd/system")){
                    File.mkdirSync("/etc/systemd/system");
                }

                let args = process.env.HOMEBRIDGE_OPTS || "";

                if (args !== "") {
                    args = ` ${args}`;
                }

                let service = "";

                service += "[Unit]\n";
                service += "Description=HOOBS\n";
                service += "After=network-online.target\n";
                service += "\n";
                service += "[Service]\n";
                service += "Type=simple\n";
                service += "User=hoobs\n";
                service += `ExecStart=${Path.join(findNode(), "hoobs")}${args}\n`;
                service += "Restart=on-failure\n";
                service += "RestartSec=3\n";
                service += "KillMode=process\n";
                service += "\n";
                service += "[Install]\n";
                service += "WantedBy=multi-user.target\n";

                File.appendFileSync("/etc/systemd/system/hoobs.service", service);

                Process.execSync("chmod 755 /etc/systemd/system/hoobs.service");
                Process.execSync("systemctl daemon-reload");
                Process.execSync("systemctl enable hoobs.service");

                throbber.stopAndPersist();
            }

            if (File.existsSync("/usr/bin/firewall-cmd")) {
                throbber = Ora("Fetching Default Firewall Zone").start();

                const zone = await getDefaultZone();

                throbber.stopAndPersist();

                if (zone && zone !== "") {
                    throbber = Ora("Configuring Firewall").start();

                    Process.execSync(`firewall-cmd --zone=${zone} --add-port=8080/tcp --permanent`);
                    Process.execSync(`firewall-cmd --zone=${zone} --add-port=51826/tcp --permanent`);

                    Process.execSync("firewall-cmd --reload");

                    throbber.stopAndPersist();
                }
            }

            if (pms === "yum" || pms === "dnf") {
                throbber = Ora("Configuring SELinux").start();

                Process.execSync("setsebool -P httpd_can_network_connect 1");

                throbber.stopAndPersist();
            }
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

const findNode = function() {
    const paths = (process.env.PATH || "").split(":");

    for (let i = 0; i < paths.length; i++) {
        if (File.existsSync(Path.join(paths[i], "hoobs"))) {
            return paths[i];
        }
    }

    return "/usr/local/bin";
}

const getDefaultZone = function () {
    return new Promise((resolve) => {
        Process.exec("firewall-cmd --get-default-zone", (error, stdout) => {
            if (error) {
                resolve(null);
            } else {
                resolve((stdout || "").trim());
            }
        });
    });
}

const checkUser = function(username) {
    return new Promise((resolve) => {
        Process.exec(`grep -o '^${username}[^:]*' /etc/passwd`, (error, stdout) => {
            if (error) {
                resolve(false);
            } else {
                resolve((stdout || "").trim() === username);
            }
        });
    });
}
