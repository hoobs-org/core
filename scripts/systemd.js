/**************************************************************************************************
 * hoobs-core                                                                                     *
 * Copyright (C) 2020 HOOBS                                                                       *
 *                                                                                                *
 * This program is free software: you can redistribute it and/or modify                           *
 * it under the terms of the GNU General Public License as published by                           *
 * the Free Software Foundation, either version 3 of the License, or                              *
 * (at your option) any later version.                                                            *
 *                                                                                                *
 * This program is distributed in the hope that it will be useful,                                *
 * but WITHOUT ANY WARRANTY; without even the implied warranty of                                 *
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the                                  *
 * GNU General Public License for more details.                                                   *
 *                                                                                                *
 * You should have received a copy of the GNU General Public License                              *
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.                          *
 **************************************************************************************************/

const File = require("fs");
const Path = require("path");
const Process = require("child_process");

module.exports = (install, type, name, service, port, bridge) => {
    return new Promise(async (resolve) => {
        const pms = getPms();

        if (pms) {
            if (!File.existsSync("/etc/systemd/system/hoobs.service") && !(await checkUser("hoobs"))) {
                Process.execSync("useradd -s /bin/bash -m -d /home/hoobs -p $(perl -e 'print crypt($ARGV[0], \"password\")' \"hoobsadmin\") hoobs");

                if (pms === "yum" || pms === "dnf") {
                    Process.execSync("usermod -a -G wheel hoobs");
                } else {
                    Process.execSync("usermod -a -G sudo hoobs");
                }
            }

            let content = "";

            switch (type) {
                case "client":
                    if (!File.existsSync("/etc/systemd/system/hoobs.service")) {
                        if (!File.existsSync("/etc/systemd/system")) {
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
                    }

                    if (install && File.existsSync("/usr/bin/firewall-cmd")) {
                        const zone = await getDefaultZone();

                        if (zone && zone !== "") {
                            Process.execSync(`firewall-cmd --zone=${zone} --add-port=80/tcp --permanent`);
                            Process.execSync("firewall-cmd --reload");
                        }
                    }

                    break;

                case "instance":
                    if (!File.existsSync(Path.join("/etc/systemd/system", service))) {
                        if (!File.existsSync("/etc/systemd/system")) {
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
                        content += `ExecStart=${Path.join(findNode(), "hoobs")} server --instance '${name}'\n`;
                        content += "Restart=on-failure\n";
                        content += "RestartSec=3\n";
                        content += "KillMode=process\n";
                        content += "\n";
                        content += "[Install]\n";
                        content += "WantedBy=multi-user.target\n";

                        File.appendFileSync(Path.join("/etc/systemd/system", service), content);

                        Process.execSync(`chmod 755 ${Path.join("/etc/systemd/system", service)}`);
                        Process.execSync("systemctl daemon-reload");
                    }

                    if (install && File.existsSync("/usr/bin/firewall-cmd")) {
                        const zone = await getDefaultZone();

                        if (zone && zone !== "") {
                            Process.execSync(`firewall-cmd --zone=${zone} --add-port=${port}/tcp --permanent`);
                            Process.execSync(`firewall-cmd --zone=${zone} --add-port=${bridge}/tcp --permanent`);
                            Process.execSync("firewall-cmd --reload");
                        }
                    }

                    break;

                default:
                    if (!File.existsSync("/etc/systemd/system/hoobs.service")) {
                        if (!File.existsSync("/etc/systemd/system")) {
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
                    }

                    if (install && File.existsSync("/usr/bin/firewall-cmd")) {
                        const zone = await getDefaultZone();

                        if (zone && zone !== "") {
                            Process.execSync(`firewall-cmd --zone=${zone} --add-port=80/tcp --permanent`);
                            Process.execSync(`firewall-cmd --zone=${zone} --add-port=51826/tcp --permanent`);
                            Process.execSync("firewall-cmd --reload");
                        }
                    }

                    break;
            }
        }

        resolve();
    });
};

const getPms = function () {
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

const findNode = function () {
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

const checkUser = function (username) {
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
