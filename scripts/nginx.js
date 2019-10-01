const File = require("fs");
const Path = require("path");
const Process = require("child_process");
const Ora = require("ora");

module.exports = (install) => {
    return new Promise(async (resolve) => {
        let throbber = null;

        const pms = getPms();
        const root = Path.dirname(File.realpathSync(Path.join(__filename, "../")));

        if (install && pms) {
            switch (pms) {
                case "dnf":
                case "yum":
                    throbber = Ora("Installing NGINX").start();

                    Process.execSync(`${pms} install -y nginx`);

                    throbber.stopAndPersist();
                    break;

                case "apt":
                    throbber = Ora("Installing NGINX").start();

                    Process.execSync("apt-get install -y nginx");

                    throbber.stopAndPersist();
                    break;
            }
        }

        if ((install || File.existsSync("/etc/nginx/nginx.conf")) && pms) {
            throbber = Ora("Configuring NGINX").start();

            if (!File.existsSync("/etc/nginx")){
                File.mkdirSync("/etc/nginx");
            }

            if (install || !File.existsSync("/etc/nginx/nginx.conf")) {
                File.writeFileSync("/etc/nginx/nginx.conf", File.readFileSync(Path.join(root, "config", `nginx.${pms}.conf`)));
            }

            if (!File.existsSync("/etc/nginx/conf.d")){
                File.mkdirSync("/etc/nginx/conf.d");
            }

            File.writeFileSync("/etc/nginx/conf.d/hoobs.conf", File.readFileSync(Path.join(root, "config", "hoobs.conf")));

            if (!File.existsSync("/usr/share/hoobs")){
                File.mkdirSync("/usr/share/hoobs");
            }

            File.writeFileSync("/usr/share/hoobs/loader.html", File.readFileSync(Path.join(root, "config", "loader.html")));

            throbber.stopAndPersist();
        }

        if (install && File.existsSync("/usr/bin/firewall-cmd")) {
            throbber = Ora("Fetching Default Firewall Zone").start();

            const zone = await getDefaultZone();

            throbber.stopAndPersist();

            if (zone && zone !== "") {
                throbber = Ora("Configuring Firewall").start();

                Process.execSync(`firewall-cmd --zone=${zone} --add-port=80/tcp --permanent`);
                Process.execSync("firewall-cmd --reload");

                throbber.stopAndPersist();
            }
        }

        if (install && (pms === "yum" || pms === "dnf")) {
            throbber = Ora("Configuring SELinux").start();

            Process.execSync("setsebool -P httpd_can_network_connect 1");

            throbber.stopAndPersist();
        }

        if (install && pms) {
            throbber = Ora("Installing NGINX Service").start();

            Process.execSync("systemctl daemon-reload");
            Process.execSync("systemctl enable nginx.service");

            throbber.stopAndPersist();
        } else if (File.existsSync("/etc/nginx/nginx.conf") && pms) {
            throbber = Ora("Restarting NGINX Service").start();

            Process.execSync("systemctl stop nginx.service");
            Process.execSync("systemctl daemon-reload");
            Process.execSync("systemctl start nginx.service");

            throbber.stopAndPersist();
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
