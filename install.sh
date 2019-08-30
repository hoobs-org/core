#!/bin/bash

if [[ "$OSTYPE" == "linux-gnu" ]] || [[ "$OSTYPE" == "linux-gnueabihf" ]]; then
    if command -v dnf > /dev/null; then
        echo "fedora detected"
        echo "installing prerequisites"

        dnf install -y perl curl nginx avahi-compat-libdns_sd-devel > /dev/null
        
        if id "hoobs" > /dev/null 2>&1; then
            echo "hoobs user exists"
        else
            echo "creating the hoobs user"
        
            useradd -s /bin/bash -m -d /home/hoobs -p $(perl -e 'print crypt($ARGV[0], "password")' "hoobsadmin") hoobs > /dev/null
            usermod -a -G wheel hoobs > /dev/null
        fi
        
        echo "configuring nginx"
        
        if test -f /etc/nginx/nginx.conf.bak; then
            rm -f /etc/nginx/nginx.conf.bak > /dev/null
        fi
        
        if test -f /etc/nginx/nginx.conf; then
            mv /etc/nginx/nginx.conf /etc/nginx/nginx.conf.bak > /dev/null
        fi
        
        curl https://raw.githubusercontent.com/hoobs-org/nginx-loader/master/fedora.conf --output /etc/nginx/nginx.conf > /dev/null
        
        if test -f /etc/nginx/conf.d/hoobs.conf.bak; then
            rm -f /etc/nginx/conf.d/hoobs.conf.bak > /dev/null
        fi
        
        if test -f /etc/nginx/conf.d/hoobs.conf; then
            mv /etc/nginx/conf.d/hoobs.conf /etc/nginx/conf.d/hoobs.conf.bak > /dev/null
        fi
        
        curl https://raw.githubusercontent.com/hoobs-org/nginx-loader/master/fedora-hoobs.conf --output /etc/nginx/conf.d/hoobs.conf > /dev/null
        
        if test -f /usr/share/hoobs/loader.html; then
            rm -f /usr/share/hoobs/loader.html > /dev/null
        fi
        
        mkdir /usr/share/hoobs > /dev/null
        curl https://raw.githubusercontent.com/hoobs-org/nginx-loader/master/loader.html --output /usr/share/hoobs/loader.html > /dev/null
        
        if test -f /usr/local/lib/node_modules/@hoobs/hoobs/default.json; then
            rm -f /usr/local/lib/node_modules/@hoobs/hoobs/default.json > /dev/null
        fi
        
        curl https://raw.githubusercontent.com/hoobs-org/nginx-loader/master/nginx-default.json --output /usr/lib/node_modules/@hoobs/hoobs/default.json > /dev/null
        
        if test -f /etc/systemd/system/homebridge-config-ui-x.service; then
            echo "removing config ui service"

            systemctl disable homebridge-config-ui-x.service > /dev/null
        
            rm -f /etc/systemd/system/homebridge-config-ui-x.service > /dev/null
        fi
        
        if test -f /etc/systemd/system/homebridge.service; then
            echo "homebridge set to start service"
        elif test -f /etc/systemd/system/hoobs.service; then
            echo "hoobs set to start service"
        else
            echo "creating hoobs service"
        
            curl https://raw.githubusercontent.com/hoobs-org/HOOBS/master/service/fedora-hoobs.service --output /etc/systemd/system/hoobs.service > /dev/null
            chmod 755 /etc/systemd/system/hoobs.service > /dev/null

            systemctl enable hoobs.service > /dev/null
        fi
        
        echo "configuring firewall"
        
        firewall-cmd --zone=FedoraServer --add-port=80/tcp --permanent > /dev/null
        firewall-cmd --zone=FedoraServer --add-port=8080/tcp --permanent > /dev/null
        firewall-cmd --zone=FedoraServer --add-port=51826/tcp --permanent > /dev/null
        firewall-cmd --zone=FedoraServer --add-port=51827/tcp --permanent > /dev/null
        firewall-cmd --zone=FedoraServer --add-port=51828/tcp --permanent > /dev/null
        
        firewall-cmd --reload > /dev/null
        
        echo "configuring selinux"
        
        setsebool -P httpd_can_network_connect 1 > /dev/null
        
        semanage port -a -t http_port_t -p tcp 51827 > /dev/null
        semanage port -a -t http_port_t -p tcp 51828 > /dev/null
        
        echo "enabling services"
        
        systemctl enable nginx.service > /dev/null
        
        read -p "press enter to reboot"
        
        shutdown -r now
    elif command -v yum > /dev/null; then
        echo "red hat detected"
        echo "installing prerequisites"
        
        yum install -y perl curl nginx avahi-compat-libdns_sd-devel > /dev/null
        
        if id "hoobs" > /dev/null 2>&1; then
            echo "hoobs user exists"
        else
            echo "creating the hoobs user"
        
            useradd -m -p $(perl -e 'print crypt($ARGV[0], "password")' "hoobsadmin") hoobs > /dev/null
            usermod -a -G wheel hoobs > /dev/null
        fi
        
        echo "installing node version manager"
        
        npm set progress=false > /dev/null
        npm install -g n > /dev/null
        n stable > /dev/null
        
        if test -f /etc/nginx/nginx.conf.bak; then
            rm -f /etc/nginx/nginx.conf.bak > /dev/null
        fi
        
        if test -f /etc/nginx/nginx.conf; then
            mv /etc/nginx/nginx.conf /etc/nginx/nginx.conf.bak > /dev/null
        fi
        
        curl https://raw.githubusercontent.com/hoobs-org/nginx-loader/master/fedora.conf --output /etc/nginx/nginx.conf > /dev/null
        
        if test -f /etc/nginx/conf.d/hoobs.conf.bak; then
            rm -f /etc/nginx/conf.d/hoobs.conf.bak > /dev/null
        fi
        
        if test -f /etc/nginx/conf.d/hoobs.conf; then
            mv /etc/nginx/conf.d/hoobs.conf /etc/nginx/conf.d/hoobs.conf.bak > /dev/null
        fi
        
        curl https://raw.githubusercontent.com/hoobs-org/nginx-loader/master/fedora-hoobs.conf --output /etc/nginx/conf.d/hoobs.conf > /dev/null
        
        if test -f /usr/share/hoobs/loader.html; then
            rm -f /usr/share/hoobs/loader.html > /dev/null
        fi
        
        mkdir /usr/share/hoobs > /dev/null
        curl https://raw.githubusercontent.com/hoobs-org/nginx-loader/master/loader.html --output /usr/share/hoobs/loader.html > /dev/null
        
        if test -f /usr/local/lib/node_modules/@hoobs/hoobs/default.json; then
            rm -f /usr/local/lib/node_modules/@hoobs/hoobs/default.json > /dev/null
        fi
        
        curl https://raw.githubusercontent.com/hoobs-org/nginx-loader/master/nginx-default.json --output /usr/local/lib/node_modules/@hoobs/hoobs/default.json > /dev/null
        
        if test -f /etc/systemd/system/homebridge-config-ui-x.service; then
            echo "removing config ui service"

            systemctl disable homebridge-config-ui-x.service > /dev/null
        
            rm -f /etc/systemd/system/homebridge-config-ui-x.service > /dev/null
        fi
        
        if test -f /etc/systemd/system/homebridge.service; then
            echo "homebridge set to start service"
        elif test -f /etc/systemd/system/hoobs.service; then
            echo "hoobs set to start service"
        else
            echo "creating hoobs service"
        
            curl https://raw.githubusercontent.com/hoobs-org/HOOBS/master/service/fedora-hoobs.service --output /etc/systemd/system/hoobs.service > /dev/null
            chmod 755 /etc/systemd/system/hoobs.service > /dev/null

            systemctl enable hoobs.service > /dev/null
        fi
        
        echo "configuring firewall"
        
        firewall-cmd --zone=FedoraServer --add-port=80/tcp --permanent > /dev/null
        firewall-cmd --zone=FedoraServer --add-port=8080/tcp --permanent > /dev/null
        firewall-cmd --zone=FedoraServer --add-port=51826/tcp --permanent > /dev/null
        firewall-cmd --zone=FedoraServer --add-port=51827/tcp --permanent > /dev/null
        firewall-cmd --zone=FedoraServer --add-port=51828/tcp --permanent > /dev/null
        
        firewall-cmd --reload > /dev/null
        
        echo "configuring selinux"
        
        setsebool -P httpd_can_network_connect 1 > /dev/null
        
        semanage port -a -t http_port_t -p tcp 51827 > /dev/null
        semanage port -a -t http_port_t -p tcp 51828 > /dev/null
        
        echo "enabling services"
        
        systemctl enable nginx.service > /dev/null
        
        read -p "press enter to reboot"
        
        shutdown -r now
    elif command -v apt-get > /dev/null; then
        echo "debian detected"
        echo "installing prerequisites"

        apt-get install -y perl curl nginx libavahi-compat-libdnssd-dev > /dev/null
        
        if id "hoobs" > /dev/null 2>&1; then
            echo "hoobs user exists"
        else
            echo "creating the hoobs user"
        
            useradd -m -p $(perl -e 'print crypt($ARGV[0], "password")' "hoobsadmin") hoobs > /dev/null
            usermod -a -G wheel hoobs > /dev/null
        fi
        
        echo "installing node version manager"
        
        npm set progress=false > /dev/null
        npm install -g n > /dev/null
        n stable > /dev/null
        
        if test -f /etc/nginx/nginx.conf.bak; then
            rm -f /etc/nginx/nginx.conf.bak > /dev/null
        fi
        
        if test -f /etc/nginx/nginx.conf; then
            mv /etc/nginx/nginx.conf /etc/nginx/nginx.conf.bak > /dev/null
        fi
        
        curl https://raw.githubusercontent.com/hoobs-org/nginx-loader/master/debian.conf --output /etc/nginx/nginx.conf > /dev/null
        
        if test -f /etc/nginx/conf.d/hoobs.conf.bak; then
            rm -f /etc/nginx/conf.d/hoobs.conf.bak > /dev/null
        fi
        
        if test -f /etc/nginx/conf.d/hoobs.conf; then
            mv /etc/nginx/conf.d/hoobs.conf /etc/nginx/conf.d/hoobs.conf.bak > /dev/null
        fi
        
        curl https://raw.githubusercontent.com/hoobs-org/nginx-loader/master/debian-hoobs.conf --output /etc/nginx/conf.d/hoobs.conf > /dev/null
        
        if test -f /usr/share/hoobs/loader.html; then
            rm -f /usr/share/hoobs/loader.html > /dev/null
        fi
        
        mkdir /usr/share/hoobs > /dev/null
        curl https://raw.githubusercontent.com/hoobs-org/nginx-loader/master/loader.html --output /usr/share/hoobs/loader.html > /dev/null
        
        if test -f /usr/local/lib/node_modules/@hoobs/hoobs/default.json; then
            rm -f /usr/local/lib/node_modules/@hoobs/hoobs/default.json > /dev/null
        fi
        
        curl https://raw.githubusercontent.com/hoobs-org/nginx-loader/master/nginx-default.json --output /usr/local/lib/node_modules/@hoobs/hoobs/default.json > /dev/null
        
        if test -f /etc/systemd/system/homebridge-config-ui-x.service; then
            echo "removing config ui service"

            systemctl disable homebridge-config-ui-x.service > /dev/null
        
            rm -f /etc/systemd/system/homebridge-config-ui-x.service > /dev/null
        fi
        
        if test -f /etc/systemd/system/homebridge.service; then
            echo "homebridge set to start service"
        elif test -f /etc/systemd/system/hoobs.service; then
            echo "hoobs set to start service"
        else
            echo "creating hoobs service"
        
            curl https://raw.githubusercontent.com/hoobs-org/HOOBS/master/service/debian-hoobs.service --output /etc/systemd/system/hoobs.service > /dev/null
            chmod 755 /etc/systemd/system/hoobs.service > /dev/null

            systemctl enable hoobs.service > /dev/null
        fi
        
        echo "enabling services"
        
        systemctl enable nginx.service > /dev/null
        
        read -p "press enter to reboot"
        
        shutdown -r now
    fi
fi
