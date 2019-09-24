#!/bin/bash

if [[ "$OSTYPE" == "linux-gnu" ]] || [[ "$OSTYPE" == "linux-gnueabihf" ]]; then
    if command -v apt-get > /dev/null; then
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
        
        if test -f /etc/nginx/conf.d/rocket.conf.bak; then
            rm -f /etc/nginx/conf.d/rocket.conf.bak > /dev/null
        fi
        
        if test -f /etc/nginx/conf.d/rocket.conf; then
            mv /etc/nginx/conf.d/rocket.conf /etc/nginx/conf.d/rocket.conf.bak > /dev/null
        fi
        
        curl https://raw.githubusercontent.com/hoobs-org/nginx-loader/master/debian-rocket.conf --output /etc/nginx/conf.d/rocket.conf > /dev/null
        
        if test -f /usr/share/rocket/loader.html; then
            rm -f /usr/share/rocket/loader.html > /dev/null
        fi
        
        mkdir /usr/share/rocket > /dev/null
        curl https://raw.githubusercontent.com/hoobs-org/nginx-loader/master/rocket-loader.html --output /usr/share/rocket/loader.html > /dev/null
        
        if test -f /usr/local/lib/node_modules/@hoobs/hoobs/default.json; then
            rm -f /usr/local/lib/node_modules/@hoobs/hoobs/default.json > /dev/null
        fi
        
        curl https://raw.githubusercontent.com/hoobs-org/nginx-loader/master/nginx-default-rocket.json --output /usr/local/lib/node_modules/@hoobs/hoobs/default.json > /dev/null
        
        if test -f /etc/systemd/system/homebridge-config-ui-x.service; then
            echo "removing config ui service"

            systemctl disable homebridge-config-ui-x.service > /dev/null
        
            rm -f /etc/systemd/system/homebridge-config-ui-x.service > /dev/null
        fi
        
        if test -f /etc/systemd/system/rocket.service; then
            echo "rocket set to start service"
        else
            echo "creating rocket service"
        
            curl https://raw.githubusercontent.com/hoobs-org/HOOBS/master/service/debian-rocket.service --output /etc/systemd/system/rocket.service > /dev/null
            chmod 755 /etc/systemd/system/rocket.service > /dev/null

            systemctl enable rocket.service > /dev/null
        fi
        
        echo "enabling services"
        
        systemctl enable nginx.service > /dev/null
        
        read -p "press enter to reboot"
        
        shutdown -r now
    fi
fi
