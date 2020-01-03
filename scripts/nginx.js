const File = require("fs");
const Process = require("child_process");
const Ora = require("ora");

module.exports = (install) => {
    return new Promise(async (resolve) => {
        let throbber = null;

        const pms = getPms();

        if (File.existsSync("/etc/nginx/nginx.conf")) {
            install = false;
        }

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
                let server = "";

                switch (pms) {
                    case "dnf":
                    case "yum":
                        server += "user nginx;\n";
                        server += "worker_processes auto;\n";
                        server += "error_log /var/log/nginx/error.log;\n";
                        server += "pid /run/nginx.pid;\n";
                        server += "\n";
                        server += "include /usr/share/nginx/modules/*.conf;\n";
                        server += "\n";
                        server += "events {\n";
                        server += "    worker_connections 1024;\n";
                        server += "}\n";
                        server += "\n";
                        server += "http {\n";
                        server += "    access_log  /var/log/nginx/access.log;\n";
                        server += "\n";
                        server += "    sendfile                     on;\n";
                        server += "    tcp_nopush                   on;\n";
                        server += "    tcp_nodelay                  on;\n";
                        server += "    keepalive_timeout            65;\n";
                        server += "    types_hash_max_size          4096;\n";
                        server += "\n";
                        server += "    include                      /etc/nginx/mime.types;\n";
                        server += "    default_type                 application/octet-stream;\n";
                        server += "    gzip                         on;\n";
                        server += "\n";
                        server += "    ssl_protocols                TLSv1 TLSv1.1 TLSv1.2;\n";
                        server += "    ssl_prefer_server_ciphers    on;\n";
                        server += "\n";
                        server += "    include /etc/nginx/conf.d/*.conf;\n";
                        server += "}\n";

                        break;
    
                    default:
                        server += "worker_processes auto;\n";
                        server += "error_log /var/log/nginx/error.log;\n";
                        server += "pid /run/nginx.pid;\n";
                        server += "\n";
                        server += "events {\n";
                        server += "    worker_connections 1024;\n";
                        server += "}\n";
                        server += "\n";
                        server += "http {\n";
                        server += "    access_log  /var/log/nginx/access.log;\n";
                        server += "\n";
                        server += "    sendfile                     on;\n";
                        server += "    tcp_nopush                   on;\n";
                        server += "    tcp_nodelay                  on;\n";
                        server += "    keepalive_timeout            65;\n";
                        server += "    types_hash_max_size          4096;\n";
                        server += "\n";
                        server += "    include                      mime.types;\n";
                        server += "    default_type                 application/octet-stream;\n";
                        server += "    gzip                         on;\n";
                        server += "\n";
                        server += "    ssl_protocols                TLSv1 TLSv1.1 TLSv1.2;\n";
                        server += "    ssl_prefer_server_ciphers    on;\n";
                        server += "\n";
                        server += "    include /etc/nginx/conf.d/*.conf;\n";
                        server += "}\n";

                        break;
                }

                writeFile("/etc/nginx/nginx.conf", server);
            }

            if (!File.existsSync("/etc/nginx/conf.d")){
                File.mkdirSync("/etc/nginx/conf.d");
            }

            const values = await getProxyConfig("/etc/nginx/conf.d/hoobs.conf");

            let conf = "";

            conf += "server {\n";
            conf += `    ${values.ports}\n`;
            conf += "    server_name hoobs;\n";
            conf += "    client_max_body_size 2048M;\n";
            conf += "\n";
            conf += "    error_page 502 /loader.html;\n";
            conf += "\n";
            conf += "    location / {\n";
            conf += `        proxy_pass            ${values.proxy};\n`;
            conf += "\n";
            conf += "        proxy_set_header      X-Real-IP $remote_addr;\n";
            conf += "        proxy_set_header      Upgrade $http_upgrade;\n";
            conf += "        proxy_set_header      Connection \"upgrade\";\n";
            conf += "\n";
            conf += "        add_header            Cache-Control \"no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0\";\n";
            conf += "\n";
            conf += "        if_modified_since     off;\n";
            conf += "        expires               off;\n";
            conf += "        etag                  off;\n";
            conf += "    }\n";
            conf += "\n";
            conf += "    location = /loader.html {\n";
            conf += "        root /usr/share/hoobs;\n";
            conf += "        internal;\n";
            conf += "    }\n";
            conf += "}\n";

            writeFile("/etc/nginx/conf.d/hoobs.conf", conf);

            if (!File.existsSync("/usr/share/hoobs")){
                File.mkdirSync("/usr/share/hoobs");
            }

            let loader = "";

            loader += "<!DOCTYPE html>\n";
            loader += "<html>\n";
            loader += "\n";
            loader += "<head>\n";
            loader += "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n";
            loader += "    <title>HOOBS</title>\n";
            loader += "    <style>\n";
            loader += "        body {\n";
            loader += "            margin: 0;\n";
            loader += "            background-color: #feb400;\n";
            loader += "        }\n";
            loader += "\n";
            loader += "        .content {\n";
            loader += "            display: flex;\n";
            loader += "            justify-content: center;\n";
            loader += "            align-items: center;\n";
            loader += "            flex-direction: column;\n";
            loader += "            height: 100vh;\n";
            loader += "        }\n";
            loader += "\n";
            loader += "        .logo {\n";
            loader += "            max-width: 90vw;\n";
            loader += "        }\n";
            loader += "\n";
            loader += "        .logo-fill {\n";
            loader += "            fill: #fff\n";
            loader += "        }\n";
            loader += "\n";
            loader += "        .logo-stroke {\n";
            loader += "            fill: none;\n";
            loader += "            stroke: #fff;\n";
            loader += "            stroke-width: 4;\n";
            loader += "            stroke-miterlimit: 10;\n";
            loader += "        }\n";
            loader += "\n";
            loader += "        .marquee {\n";
            loader += "            overflow: hidden;\n";
            loader += "            position: relative;\n";
            loader += "            width: 450px;\n";
            loader += "            max-width: 90vw;\n";
            loader += "            height: 3px;\n";
            loader += "            margin: 20px 0 50px 0;\n";
            loader += "            background: #ffffff42;\n";
            loader += "        }\n";
            loader += "    \n";
            loader += "        .marquee div {\n";
            loader += "            position: absolute;\n";
            loader += "            width: 40%;\n";
            loader += "            margin: 0;\n";
            loader += "            height: 3px;\n";
            loader += "            background: #fff;\n";
            loader += "            -moz-animation: loading-marquee 2s linear infinite alternate;\n";
            loader += "            -webkit-animation: loading-marquee 2s linear infinite alternate;\n";
            loader += "            animation: loading-marquee 2s linear infinite alternate;\n";
            loader += "        }\n";
            loader += "    \n";
            loader += "        @-moz-keyframes loading-marquee {\n";
            loader += "            0% {\n";
            loader += "                -moz-transform: translateX(280%);\n";
            loader += "            }\n";
            loader += "    \n";
            loader += "            100% {\n";
            loader += "                -moz-transform: translateX(-140%);\n";
            loader += "            }\n";
            loader += "        }\n";
            loader += "    \n";
            loader += "        @-webkit-keyframes loading-marquee {\n";
            loader += "            0% {\n";
            loader += "                -webkit-transform: translateX(280%);\n";
            loader += "            }\n";
            loader += "    \n";
            loader += "            100% {\n";
            loader += "                -webkit-transform: translateX(-140%);\n";
            loader += "            }\n";
            loader += "        }\n";
            loader += "    \n";
            loader += "        @keyframes loading-marquee {\n";
            loader += "            0% {\n";
            loader += "                -moz-transform: translateX(280%);\n";
            loader += "                -webkit-transform: translateX(280%);\n";
            loader += "                transform: translateX(280%);\n";
            loader += "            }\n";
            loader += "    \n";
            loader += "            100% {\n";
            loader += "                -moz-transform: translateX(-140%);\n";
            loader += "                -webkit-transform: translateX(-140%);\n";
            loader += "                transform: translateX(-140%);\n";
            loader += "            }\n";
            loader += "        }\n";
            loader += "    </style>\n";
            loader += "\n";
            loader += "    <script>\n";
            loader += "        (async function () {\n";
            loader += "            const check = setInterval(async () => {\n";
            loader += "                const response = await fetch(\"/\");\n";
            loader += "\n";
            loader += "                if (response.status === 200) {\n";
            loader += "                    clearInterval(check);\n";
            loader += "                    location.reload(true);\n";
            loader += "                }\n";
            loader += "            }, 4000);\n";
            loader += "        }());\n";
            loader += "    </script>\n";
            loader += "\n";
            loader += "</head>\n";
            loader += "\n";
            loader += "<body>\n";
            loader += "    <div class=\"content\">\n";
            loader += "        <div>\n";
            loader += "            <svg class=\"logo\" version=\"1.1\" width=\"467px\" height=\"100px\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 467 100\">\n";
            loader += "                <path class=\"logo-stroke\" d=\"M79.9,97H18.5c-9,0-16.3-7.3-16.3-16.3V19.3C2.2,10.3,9.6,3,18.5,3h61.4c9,0,16.3,7.3,16.3,16.3v61.4 C96.2,89.7,88.9,97,79.9,97z\" />\n";
            loader += "                <path class=\"logo-fill\" d=\"M21.2,55c2.1,1.9,4.7,1.8,6.8-0.2c3.8-3.6,7.5-7.3,11.3-10.9c2.8-2.8,5.7-5.5,8.5-8.3c1-1,1.9-0.9,2.9,0.1 c6.1,6.1,12.3,12.1,18.4,18.1c1.8,1.7,1.7,2,0,3.8c-2.1,2.1-2.3,2.1-4.1,0.4c-4.2-4-8.3-8-12.5-12.1c-2.6-2.5-5.1-2.5-7.7,0.1 c-4.1,4.1-8.2,8.2-12.3,12.3c-2.8,2.8-2.8,5.3,0,8.1c0.5,0.6,1.1,1.1,1.7,1.6c2.3,1.9,4.8,1.8,6.9-0.3c2.2-2.1,4.4-4.1,6.5-6.2 c0.8-0.8,1.6-1,2.5-0.2c2.2,2.2,4.4,4.3,6.5,6.5c0.7,0.7,0.7,1.4,0,2c-2.7,2.4-4.7,5.6-8.2,7.3c-1.2,0.6-1.5,1.7-1.3,2.9 c0.2,1.2,1.1,1.7,2.2,1.9c1.1,0.2,2.1-0.4,2.5-1.4c0.5-1.4,1.6-2.4,2.6-3.4c1.7-1.7,3.4-3.3,5-5c1.9-2,1.9-4.8,0-6.6 c-2.3-2.3-4.7-4.7-7.1-6.9c-2.2-2-4.8-1.9-6.9,0.2c-2.2,2.1-4.4,4.1-6.5,6.2c-1,1-1.9,1-2.9,0c-0.4-0.4-0.7-0.8-1.1-1.2 c-1.1-1-1.1-1.8,0-2.9c4.1-4,8.1-8,12.2-12.1c1.1-1.1,2-1.2,3.2-0.1c3.8,3.7,7.6,7.4,11.4,11.1c4.3,4.3,6,4.3,10.3,0 c2.8-2.8,2.8-5.2,0-7.9c-4.2-4.1-8.4-8.2-12.7-12.4c-2.3-2.2-4.5-4.5-6.8-6.8c-2.1-2-4.6-2-6.7,0c-1.1,1.1-2.3,2.1-3.4,3.2 c-5.3,5.2-10.5,10.6-16,15.7c-1.8,1.6-2,1.7-3.7,0c-0.3-0.3-0.5-0.5-0.8-0.8c-1.2-1-1.1-1.9,0-3c8.4-8.4,16.8-16.7,25.2-25.1 c1.1-1.1,2-1.2,3.2,0c3.8,3.7,7.7,7.3,11.5,10.9c0.4,0.4,0.7,1.2,1.4,0.9c0.6-0.3,0.3-1.1,0.3-1.7c0-1.7,0-3.5,0.1-5.2 c0.1-2.2,1.8-1.9,3.2-1.9c1.4,0,2.5,0.3,2.5,2c0,1.9,0,3.9,0,5.8c0,0,0,0,0,0c0,1.4,0.1,2.9,0,4.3c-0.2,2.3,0.6,4,2.3,5.6 c1.8,1.8,4,3.3,4.9,5.9c0.3,0.9,1.4,1.3,2.5,1.1c1.1-0.2,1.9-0.9,2.1-2c0.2-1.1-0.1-2.2-1.1-2.6c-2.5-1-3.9-3.3-5.9-5 c-1-0.8-1.3-1.8-1.2-3c0.1-3,0-6,0-9c0-5-1.8-6.7-6.8-6.6c-0.7,0-1.4,0.1-2.1,0.2c-1.8,0.3-3,1.3-3.5,3c-0.4,1.6-1,1.1-1.8,0.4 c-2-1.9-3.9-3.7-5.9-5.6c-2.8-2.7-5.3-2.7-8.1,0.1c-7.9,7.9-15.8,15.9-23.8,23.7C15.6,48.9,16.7,51,21.2,55z\" />\n";
            loader += "                <path class=\"logo-fill\" d=\"M175.6,4.1v64h-14.8V41.9h-29.1v26.2h-14.8v-64h14.8v25.2h29.1V4.1H175.6z M186.7,36.1c0-19,14.8-33.1,35-33.1 c20.1,0,35,14,35,33.1s-14.9,33.1-35,33.1C201.5,69.2,186.7,55.1,186.7,36.1z M241.8,36.1c0-12.2-8.6-20.5-20-20.5s-20,8.3-20,20.5 s8.6,20.5,20,20.5S241.8,48.3,241.8,36.1z M263.9,36.1c0-19,14.8-33.1,35-33.1c20.1,0,35,14,35,33.1s-14.9,33.1-35,33.1 C278.7,69.2,263.9,55.1,263.9,36.1z M318.9,36.1c0-12.2-8.6-20.5-20-20.5s-20,8.3-20,20.5s8.6,20.5,20,20.5S318.9,48.3,318.9,36.1z  M403.8,50.6c0,11.1-8.8,17.5-25.6,17.5h-33.1v-64h31.3c16,0,24.2,6.7,24.2,16.6c0,6.4-3.3,11.3-8.5,14.1 C399.2,37.1,403.8,42.6,403.8,50.6z M359.8,15.2v15.1h14.7c7.2,0,11.2-2.6,11.2-7.6c0-5-3.9-7.5-11.2-7.5H359.8z M388.9,49.1 c0-5.4-4.1-8-11.8-8h-17.3v15.8h17.3C384.7,56.9,388.9,54.6,388.9,49.1z M410,61.8l5-11.2c5.4,3.9,13.4,6.7,21.1,6.7 c8.8,0,12.3-2.9,12.3-6.9c0-12-37.2-3.7-37.2-27.5c0-10.9,8.8-19.9,27-19.9c8,0,16.3,1.9,22.2,5.7l-4.6,11.2c-5.9-3.4-12.1-5-17.7-5 c-8.8,0-12.2,3.3-12.2,7.3c0,11.8,37.2,3.7,37.2,27.2c0,10.7-8.9,19.8-27.2,19.8C425.9,69.2,415.6,66.2,410,61.8z\" />\n";
            loader += "                <path class=\"logo-fill\" d=\"M117.6,81.1h2.1V88h8.8v-6.9h2.1v15.4h-2.1v-6.6h-8.8v6.6h-2.1V81.1z M145.9,82c1.2,0.7,2.2,1.6,2.9,2.8 c0.7,1.2,1.1,2.5,1.1,4c0,1.4-0.4,2.8-1.1,4c-0.7,1.2-1.7,2.2-2.9,2.9c-1.2,0.7-2.6,1-4.1,1s-2.8-0.3-4.1-1 c-1.2-0.7-2.2-1.7-2.9-2.9c-0.7-1.2-1.1-2.5-1.1-4c0-1.4,0.4-2.8,1.1-4c0.7-1.2,1.7-2.1,2.9-2.8c1.2-0.7,2.6-1,4.1-1 C143.3,80.9,144.7,81.3,145.9,82z M138.9,83.6c-0.9,0.5-1.6,1.2-2.2,2.1c-0.5,0.9-0.8,1.9-0.8,3s0.3,2.1,0.8,3 c0.5,0.9,1.3,1.6,2.2,2.2c0.9,0.5,1.9,0.8,3,0.8c1.1,0,2.1-0.3,3-0.8c0.9-0.5,1.6-1.3,2.2-2.2c0.5-0.9,0.8-1.9,0.8-3s-0.3-2.1-0.8-3 c-0.5-0.9-1.3-1.6-2.2-2.1c-0.9-0.5-1.9-0.8-3-0.8C140.8,82.8,139.8,83.1,138.9,83.6z M153,81.1h2.5l5.6,10.8l5.6-10.8h2.5v15.4h-2 l0-12.3l-5.5,10.7h-1.3l-5.5-10.7v12.3h-2V81.1z M173.7,81.1h10.7V83h-8.6v4.8h7.7v1.9h-7.7v4.9h8.9v1.9h-11V81.1z M198.4,82.1 c0.9,0.7,1.4,1.6,1.4,2.8c0,0.9-0.2,1.6-0.7,2.2c-0.5,0.6-1.2,1-2.1,1.2c1.1,0.2,1.9,0.6,2.5,1.3c0.6,0.7,0.9,1.6,0.9,2.6 c0,1.3-0.5,2.4-1.5,3.1c-1,0.7-2.4,1.1-4.1,1.1h-6.7V81.1h6.6C196.2,81.1,197.5,81.4,198.4,82.1z M196.8,87c0.5-0.4,0.8-1,0.8-1.7 c0-0.7-0.3-1.3-0.8-1.7c-0.5-0.4-1.3-0.6-2.2-0.6h-4.4v4.6h4.4C195.5,87.6,196.2,87.4,196.8,87z M197.2,93.9c0.6-0.4,1-1.1,1-1.9 c0-0.8-0.3-1.4-1-1.8c-0.6-0.4-1.5-0.7-2.7-0.7h-4.4v5h4.4C195.7,94.6,196.6,94.4,197.2,93.9z M213.7,96.5l-3.1-4.8 c-0.4,0-0.6,0-0.9,0h-3.9v4.8h-2.1V81.1h6c2,0,3.5,0.5,4.5,1.4c1.1,0.9,1.6,2.2,1.6,3.8c0,1.3-0.3,2.3-0.9,3.2 c-0.6,0.9-1.4,1.5-2.5,1.9l3.6,5.2H213.7z M209.8,89.8c1.3,0,2.3-0.3,3-0.9c0.7-0.6,1.1-1.4,1.1-2.6c0-1.1-0.4-1.9-1.1-2.5 c-0.7-0.6-1.7-0.9-3-0.9h-3.9v6.8H209.8z M219.7,81.1h2.1v15.4h-2.1V81.1z M236.6,82.1c1.2,0.7,2.2,1.6,2.9,2.8c0.7,1.2,1,2.5,1,3.9 c0,1.5-0.3,2.8-1,3.9c-0.7,1.2-1.7,2.1-2.9,2.8c-1.2,0.7-2.6,1-4.1,1h-6.2V81.1h6.3C234,81.1,235.4,81.4,236.6,82.1z M235.5,93.8 c0.9-0.5,1.6-1.2,2.1-2.1c0.5-0.9,0.8-1.9,0.8-3c0-1.1-0.3-2.1-0.8-3c-0.5-0.9-1.2-1.6-2.1-2.1c-0.9-0.5-1.9-0.8-3-0.8h-4.1v11.6 h4.2C233.6,94.6,234.6,94.3,235.5,93.8z M253.7,89h1.9v5.7c-0.8,0.6-1.7,1.1-2.7,1.5c-1,0.4-2.1,0.6-3.1,0.6c-1.5,0-2.8-0.3-4.1-1 c-1.2-0.7-2.2-1.7-2.9-2.9c-0.7-1.2-1.1-2.5-1.1-4c0-1.4,0.4-2.8,1.1-4c0.7-1.2,1.7-2.1,3-2.8c1.2-0.7,2.6-1,4.1-1 c1.1,0,2.1,0.2,3.1,0.6c1,0.4,1.9,0.9,2.7,1.6l-1.2,1.5c-0.6-0.6-1.3-1-2.1-1.3c-0.8-0.3-1.6-0.5-2.5-0.5c-1.1,0-2.1,0.3-3,0.8 c-0.9,0.5-1.7,1.2-2.2,2.2c-0.5,0.9-0.8,1.9-0.8,3s0.3,2.1,0.8,3c0.5,0.9,1.3,1.6,2.2,2.2c0.9,0.5,1.9,0.8,3,0.8 c0.6,0,1.3-0.1,2-0.3c0.7-0.2,1.3-0.5,1.9-0.9V89z M259.6,81.1h10.7V83h-8.6v4.8h7.7v1.9h-7.7v4.9h8.9v1.9h-11V81.1z M290.6,82 c1.2,0.7,2.2,1.6,2.9,2.8c0.7,1.2,1.1,2.5,1.1,4c0,1.4-0.4,2.8-1.1,4c-0.7,1.2-1.7,2.2-2.9,2.9c-1.2,0.7-2.6,1-4.1,1 c-1.5,0-2.8-0.3-4.1-1c-1.2-0.7-2.2-1.7-2.9-2.9c-0.7-1.2-1.1-2.5-1.1-4c0-1.4,0.4-2.8,1.1-4c0.7-1.2,1.7-2.1,2.9-2.8 c1.2-0.7,2.6-1,4.1-1C288,80.9,289.3,81.3,290.6,82z M283.5,83.6c-0.9,0.5-1.6,1.2-2.2,2.1c-0.5,0.9-0.8,1.9-0.8,3s0.3,2.1,0.8,3 c0.5,0.9,1.3,1.6,2.2,2.2c0.9,0.5,1.9,0.8,3,0.8c1.1,0,2.1-0.3,3-0.8c0.9-0.5,1.6-1.3,2.2-2.2c0.5-0.9,0.8-1.9,0.8-3s-0.3-2.1-0.8-3 c-0.5-0.9-1.3-1.6-2.2-2.1s-1.9-0.8-3-0.8C285.4,82.8,284.4,83.1,283.5,83.6z M300.6,93.5c0.8,0.8,1.9,1.2,3.3,1.2 c1.4,0,2.4-0.4,3.2-1.2c0.8-0.8,1.2-1.9,1.2-3.3v-9.1h2.1v9.1c0,2-0.6,3.6-1.7,4.7c-1.2,1.1-2.7,1.7-4.8,1.7c-2,0-3.6-0.6-4.8-1.7 c-1.2-1.1-1.7-2.7-1.7-4.7v-9.1h2.1v9.1C299.4,91.6,299.8,92.7,300.6,93.5z M312.4,81.1h12.1V83h-5v13.5h-2.1V83h-5V81.1z M343.5,82 c1.2,0.7,2.2,1.6,2.9,2.8c0.7,1.2,1.1,2.5,1.1,4c0,1.4-0.4,2.8-1.1,4c-0.7,1.2-1.7,2.2-2.9,2.9c-1.2,0.7-2.6,1-4.1,1 c-1.5,0-2.8-0.3-4.1-1c-1.2-0.7-2.2-1.7-2.9-2.9c-0.7-1.2-1.1-2.5-1.1-4c0-1.4,0.4-2.8,1.1-4c0.7-1.2,1.7-2.1,2.9-2.8 c1.2-0.7,2.6-1,4.1-1C340.9,80.9,342.3,81.3,343.5,82z M336.5,83.6c-0.9,0.5-1.6,1.2-2.2,2.1c-0.5,0.9-0.8,1.9-0.8,3s0.3,2.1,0.8,3 c0.5,0.9,1.3,1.6,2.2,2.2c0.9,0.5,1.9,0.8,3,0.8c1.1,0,2.1-0.3,3-0.8c0.9-0.5,1.6-1.3,2.2-2.2c0.5-0.9,0.8-1.9,0.8-3s-0.3-2.1-0.8-3 c-0.5-0.9-1.3-1.6-2.2-2.1s-1.9-0.8-3-0.8C338.4,82.8,337.4,83.1,336.5,83.6z M350.6,81.1h10.1l0,1.9h-7.9v5.1h7.1V90h-7.1v6.5h-2.1 V81.1z M366.9,81.1H379V83h-5v13.5h-2.1V83h-5V81.1z M381.4,81.1h2.1V88h8.8v-6.9h2.1v15.4h-2.1v-6.6h-8.8v6.6h-2.1V81.1z  M398.9,81.1h10.7V83H401v4.8h7.7v1.9H401v4.9h8.9v1.9h-11V81.1z M429.3,82.1c0.9,0.7,1.4,1.6,1.4,2.8c0,0.9-0.2,1.6-0.7,2.2 c-0.5,0.6-1.2,1-2.1,1.2c1.1,0.2,1.9,0.6,2.5,1.3c0.6,0.7,0.9,1.6,0.9,2.6c0,1.3-0.5,2.4-1.5,3.1c-1,0.7-2.4,1.1-4.1,1.1H419V81.1 h6.6C427.2,81.1,428.4,81.4,429.3,82.1z M427.7,87c0.5-0.4,0.8-1,0.8-1.7c0-0.7-0.3-1.3-0.8-1.7c-0.5-0.4-1.3-0.6-2.2-0.6h-4.4v4.6 h4.4C426.5,87.6,427.2,87.4,427.7,87z M428.2,93.9c0.6-0.4,1-1.1,1-1.9c0-0.8-0.3-1.4-1-1.8c-0.6-0.4-1.5-0.7-2.7-0.7h-4.4v5h4.4 C426.7,94.6,427.6,94.4,428.2,93.9z M445.6,82c1.2,0.7,2.2,1.6,2.9,2.8c0.7,1.2,1.1,2.5,1.1,4c0,1.4-0.4,2.8-1.1,4 c-0.7,1.2-1.7,2.2-2.9,2.9c-1.2,0.7-2.6,1-4.1,1c-1.5,0-2.8-0.3-4.1-1c-1.2-0.7-2.2-1.7-2.9-2.9c-0.7-1.2-1.1-2.5-1.1-4 c0-1.4,0.4-2.8,1.1-4c0.7-1.2,1.7-2.1,2.9-2.8c1.2-0.7,2.6-1,4.1-1C443,80.9,444.3,81.3,445.6,82z M438.5,83.6 c-0.9,0.5-1.6,1.2-2.2,2.1c-0.5,0.9-0.8,1.9-0.8,3s0.3,2.1,0.8,3c0.5,0.9,1.3,1.6,2.2,2.2c0.9,0.5,1.9,0.8,3,0.8 c1.1,0,2.1-0.3,3-0.8c0.9-0.5,1.6-1.3,2.2-2.2c0.5-0.9,0.8-1.9,0.8-3s-0.3-2.1-0.8-3c-0.5-0.9-1.3-1.6-2.2-2.1s-1.9-0.8-3-0.8 C440.4,82.8,439.4,83.1,438.5,83.6z M451.2,81.1h2.5l4.1,5.8l4.1-5.8h2.5l-5.2,7.4l5.7,8h-2.5l-4.5-6.2l-4.4,6.2h-2.5l5.6-7.9 L451.2,81.1z\" />\n";
            loader += "            </svg>\n";
            loader += "        </div>\n";
            loader += "        <div class=\"marquee\">\n";
            loader += "            <div></div>\n";
            loader += "        </div>\n";
            loader += "    </div>\n";
            loader += "</body>\n";
            loader += "\n";
            loader += "</html>\n";

            writeFile("/usr/share/hoobs/loader.html", loader);

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

        if (install && pms) {
            throbber = Ora("Installing NGINX Service").start();

            Process.execSync("systemctl daemon-reload");
            Process.execSync("systemctl enable nginx.service");

            throbber.stopAndPersist();
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

const writeFile = function (path, body) {
    if (File.existsSync(path)) {
        File.unlinkSync(path);
    }

    File.appendFileSync(path, body);
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
}

const getProxyConfig = function (filename) {
    return new Promise((resolve) => {
        const results = [];
        let proxy = "\"http://127.0.0.1:8080\"";

        if (File.existsSync(filename)) {
            const stream = File.createReadStream(filename);

            let remaining = "";

            stream.on("data", (data) => {
                remaining += data;

                let index = remaining.indexOf("\n");

                while (index > -1) {
                    let value = (remaining.substring(0, index) || "").trim();

                    if (value.toLowerCase().startsWith("listen")) {
                        value = value.replace(/listen/gi, "").trim();

                        if (value.endsWith(";")) {
                            value = value.slice(0, -1);
                        }

                        if (results.indexOf(value) === -1) {
                            results.push(value);
                        }
                    }

                    if (value.toLowerCase().startsWith("proxy_pass")) {
                        value = value.replace(/proxy_pass/gi, "").trim();

                        if (value.endsWith(";")) {
                            value = value.slice(0, -1);
                        }

                        proxy = value;
                    }

                    remaining = remaining.substring(index + 1);
                    index = remaining.indexOf('\n');
                }
            });

            stream.on("end", () => {
                if (remaining.length > 0) {
                    if (remaining.toLowerCase().startsWith("listen")) {
                        remaining = remaining.replace(/listen/gi, "").trim();

                        if (remaining.endsWith(";")) {
                            remaining = remaining.slice(0, -1);
                        }

                        if (results.indexOf(remaining) === -1) {
                            results.push(remaining);
                        }
                    }

                    if (remaining.toLowerCase().startsWith("proxy_pass")) {
                        remaining = remaining.replace(/proxy_pass/gi, "").trim();

                        if (remaining.endsWith(";")) {
                            remaining = remaining.slice(0, -1);
                        }

                        proxy = remaining;
                    }
                }

                if (results.length === 0) {
                    results.push("80");
                    results.push("[::]:80");
                }
        
                resolve({
                    ports: `listen ${results.join(";\n    listen ")};`,
                    proxy
                });
            });
        } else {
            if (results.length === 0) {
                results.push("80");
                results.push("[::]:80");
            }
    
            resolve({
                ports: `listen ${results.join(";\n    listen ")};`,
                proxy
            });
        }
    });
};
