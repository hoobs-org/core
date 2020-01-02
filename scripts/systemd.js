const File = require("fs");
const Path = require("path");
const Process = require("child_process");
const Ora = require("ora");

module.exports = (install, type, name, service, port, bridge) => {
    return new Promise(async (resolve) => {
        let throbber = null;

        const pms = getPms();

        if (pms) {
            if (!File.existsSync("/etc/systemd/system/hoobs.service") && !(await checkUser("hoobs"))) {
                throbber = Ora("Creating HOOBS User").start();

                Process.execSync("useradd -s /bin/bash -m -d /home/hoobs -p $(perl -e 'print crypt($ARGV[0], \"password\")' \"hoobsadmin\") hoobs");

                if (pms === "yum" || pms === "dnf") {
                    Process.execSync("usermod -a -G wheel hoobs");
                } else {
                    Process.execSync("usermod -a -G sudo hoobs");
                }

                throbber.stopAndPersist();
            }

            let content = "";

            switch (type) {
                case "client":
                    if (!File.existsSync("/etc/systemd/system/hoobs.service")) {
                        throbber = Ora("Installing HOOBS Service").start();
        
                        if (!File.existsSync("/etc/systemd/system")){
                            File.mkdirSync("/etc/systemd/system");
                        }
        
                        content += "[Unit]\n";
                        content += "Description=HOOBS\n";
                        content += "After=network-online.target\n";
                        content += "\n";
                        content += "[Service]\n";
                        content += "Type=simple\n";
                        content += "User=hoobs\n";
                        content += `ExecStart=${Path.join(findNode(), "hoobs")} client\n`;
                        content += "Restart=on-failure\n";
                        content += "RestartSec=3\n";
                        content += "KillMode=process\n";
                        content += "\n";
                        content += "[Install]\n";
                        content += "WantedBy=multi-user.target\n";
        
                        File.appendFileSync("/etc/systemd/system/hoobs.service", content);
        
                        Process.execSync("chmod 755 /etc/systemd/system/hoobs.service");
                        Process.execSync("systemctl daemon-reload");
        
                        throbber.stopAndPersist();
                    }
        
                    if (install && File.existsSync("/usr/bin/firewall-cmd")) {
                        throbber = Ora("Fetching Default Firewall Zone").start();
        
                        const zone = await getDefaultZone();
        
                        throbber.stopAndPersist();
        
                        if (zone && zone !== "") {
                            throbber = Ora("Configuring Firewall").start();
        
                            Process.execSync(`firewall-cmd --zone=${zone} --add-port=8080/tcp --permanent`);        
                            Process.execSync("firewall-cmd --reload");
        
                            throbber.stopAndPersist();
                        }
                    }

                    break;

                case "instance":
                    if (!File.existsSync(Path.join("/etc/systemd/system", service))) {
                        throbber = Ora("Installing HOOBS Service").start();
        
                        if (!File.existsSync("/etc/systemd/system")){
                            File.mkdirSync("/etc/systemd/system");
                        }

                        const targets = [];

                        targets.push("network-online.target");

                        if (File.existsSync("/etc/systemd/system/hoobs.service")) {
                            targets.push("hoobs.service");
                        }
        
                        content += "[Unit]\n";
                        content += "Description=HOOBS\n";
                        content += `After=${targets.join(" ")}\n`;
                        content += "\n";
                        content += "[Service]\n";
                        content += "Type=simple\n";
                        content += "User=hoobs\n";
                        content += `ExecStart=${Path.join(findNode(), "hoobs")} server -instance '${name}'\n`;
                        content += "Restart=on-failure\n";
                        content += "RestartSec=3\n";
                        content += "KillMode=process\n";
                        content += "\n";
                        content += "[Install]\n";
                        content += "WantedBy=multi-user.target\n";
        
                        File.appendFileSync(Path.join("/etc/systemd/system", service), content);
        
                        Process.execSync(`chmod 755 ${Path.join("/etc/systemd/system", service)}`);
                        Process.execSync("systemctl daemon-reload");
        
                        throbber.stopAndPersist();
                    }
        
                    if (install && File.existsSync("/usr/bin/firewall-cmd")) {
                        throbber = Ora("Fetching Default Firewall Zone").start();
        
                        const zone = await getDefaultZone();
        
                        throbber.stopAndPersist();
        
                        if (zone && zone !== "") {
                            throbber = Ora("Configuring Firewall").start();
        
                            Process.execSync(`firewall-cmd --zone=${zone} --add-port=${port}/tcp --permanent`);
                            Process.execSync(`firewall-cmd --zone=${zone} --add-port=${bridge}/tcp --permanent`);
                            Process.execSync("firewall-cmd --reload");
        
                            throbber.stopAndPersist();
                        }
                    }

                    break;

                default:
                    if (!File.existsSync("/etc/systemd/system/hoobs.service")) {
                        throbber = Ora("Installing HOOBS Service").start();
        
                        if (!File.existsSync("/etc/systemd/system")){
                            File.mkdirSync("/etc/systemd/system");
                        }
        
                        content += "[Unit]\n";
                        content += "Description=HOOBS\n";
                        content += "After=network-online.target\n";
                        content += "\n";
                        content += "[Service]\n";
                        content += "Type=simple\n";
                        content += "User=hoobs\n";
                        content += `ExecStart=${Path.join(findNode(), "hoobs")}\n`;
                        content += "Restart=on-failure\n";
                        content += "RestartSec=3\n";
                        content += "KillMode=process\n";
                        content += "\n";
                        content += "[Install]\n";
                        content += "WantedBy=multi-user.target\n";
        
                        File.appendFileSync("/etc/systemd/system/hoobs.service", content);
        
                        Process.execSync("chmod 755 /etc/systemd/system/hoobs.service");
                        Process.execSync("systemctl daemon-reload");
        
                        throbber.stopAndPersist();
                    }
        
                    if (install && File.existsSync("/usr/bin/firewall-cmd")) {
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

                    break;
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

const findNode = function() {
    const paths = (process.env.PATH || "").split(":");

    for (let i = 0; i < paths.length; i++) {
        if (File.existsSync(Path.join(paths[i], "hoobs"))) {
            return paths[i];
        }
    }

    return "/usr/local/bin";
};

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
};

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
};
