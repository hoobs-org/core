# Getting Started

Homebridge(X) is a binary repacement for Homebridge.

## Uninstalling Homebridge
If you already have Homebridge installed you must remove it first. Remember to backup your config.json file. You will also need to remove the Homebridge accessory from Apple Home.

Uninstall Homebridge using the following command.

```sh
$ sudo npm uninstall homebridge -g
```

## Prerequisites

If you are running Linux, you will need to install these prerequisites.

```sh
$ sudo apt-get install libavahi-compat-libdnssd-dev
```

## Installing

There are a few ways you can install Homebridge(X).
* Using NPM.
* Raspberry PI image.
* Mac installer package.

### Installing With NPM

Install Homebridge(X) with this command.

```sh
$ sudo npm install homebridge-x -g --unsafe-perm
```

> You need to use --unsafe-perm because this application needs to be able to write to it's own modules directory.

Now you should be able to run Homebridge(X).

```sh
$ sudo homebridge
```

> Homebridge(X) is binary compatable with Homebridge. It uses the same commands.

Now you should be able to open the web interface to continue the setup.

```sh
http://localhost:51825
```
