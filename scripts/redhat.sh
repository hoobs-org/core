#!/bin/bash

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

    systemctl stop homebridge-config-ui-x.service > /dev/null
    systemctl disable homebridge-config-ui-x.service > /dev/null

    rm -f /etc/systemd/system/homebridge-config-ui-x.service > /dev/null
fi

if test -f /etc/systemd/system/homebridge.service; then
    echo "removing homebridge service"

    systemctl stop homebridge.service > /dev/null
    systemctl disable homebridge.service > /dev/null

    rm -f /etc/systemd/system/homebridge.service > /dev/null
fi

if test -f /etc/systemd/system/hoobs.service; then
    echo "hoobs service already exists"
else
    echo "creating hoobs service"

    curl https://raw.githubusercontent.com/hoobs-org/HOOBS/master/service/fedora-hoobs.service --output /etc/systemd/system/hoobs.service > /dev/null
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

systemctl enable nginx.service
systemctl enable hoobs.service > /dev/null

read -p "press enter to reboot"

shutdown -r now