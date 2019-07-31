# ![](https://raw.githubusercontent.com/mkellsy/homebridge-x/master/docs/logo-wide.png)
[![Vue.JS](https://img.shields.io/badge/Vue.JS-2.6.10-%234fc08d.svg)](https://vuejs.org/) [![Express](https://img.shields.io/badge/Express-4.17.1-%23b3b3b3.svg)](https://expressjs.com/) [![Socket.IO](https://img.shields.io/badge/Socket.IO-2.2.0-%23e0bf19.svg)](https://socket.io/) [![Homebridge](https://img.shields.io/badge/Homebridge-0.4.50-%237c2fed.svg)](https://github.com/nfarina/homebridge/)  

A Homebridge stack with a interface that simplifies configuration and installing plugins. This adds a process wrapper for [Homebridge](https://github.com/nfarina/homebridge). It also adds an API that can be used as an endpoint for an application.

![](https://raw.githubusercontent.com/mkellsy/homebridge-x/master/docs/hoobs/status.png)

Homebridge(X) is not a Homebridge plugin. It is a seperate application designed to be a parent to Homebridge. Since this is independent, it can control Homebridge. This also keeps all of the plugins in one place. No need to install plugins in the global scope, which helps keep your Homebridge server more secure.

## Community
If you're having an issue with a particular plugin, open an issue in that plugin's Github repository. If you're having an issue with Homebridge itself, feel free to open issues and PRs here.

There is  a [Homebridge community on Reddit](https://www.reddit.com/r/homebridge/).

r/Homekit and r/Homebridge have also created a community Discord server, where users of both Homekit and Homebridge can discuss their different products as well as get support. The link for the community is [here](https://discord.gg/RcV7fa8).

You can also chat with us in [Slack](https://homebridge-slackin.glitch.me).

## Installation

> **WARNING:** This is under heavy development. Use at your own risk.

Homebridge(X) is a binary repacement for Homebridge. If you already have Homebridge installed you must remove it first. Remember to backup your config.json file. You will also need to remove the Homebridge accessory from Apple Home.

Uninstall Homebridge using the following command.

```sh
$ sudo npm uninstall homebridge -g
```

If you are running Linux, you will need to install these prerequisites.

```sh
$ sudo apt-get install libavahi-compat-libdnssd-dev
```

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

[Read the Getting Started Guide for more details](https://github.com/mkellsy/homebridge-x/blob/master/docs/getting-started.md)

## Interface
Homebridge(X) comes with a built-in web interface. This allows you to monitor, backup and configure your Homebridge server. You can access the web interface at the default location. [http://localhost:51825](http://localhost:51825).

### Security
Homebridge(X) is permissible. This helps you keep your smart home secure.

![](https://raw.githubusercontent.com/mkellsy/homebridge-x/master/docs/hoobs/login.png)

### Status
This monitors the Homebridge service, CPU and memory load. It also has your Apple Home setup pin.

![](https://raw.githubusercontent.com/mkellsy/homebridge-x/master/docs/hoobs/status.png)

### Accessories
Monitor and control accessories connected to Homebridge(X).

![](https://raw.githubusercontent.com/mkellsy/homebridge-x/master/docs/hoobs/accessories.png)

### Log
This shows you the rolling log. This is helpful for troubleshooting.

![](https://raw.githubusercontent.com/mkellsy/homebridge-x/master/docs/hoobs/log.png)

### User Management

Shows a list of users, and allows you to edit, add or remove users.

![](https://raw.githubusercontent.com/mkellsy/homebridge-x/master/docs/hoobs/users.png)

### Installed Plugins
Shows you a list of installed plugins. This also includes your Homebridge service, and can be updated from here.

![](https://raw.githubusercontent.com/mkellsy/homebridge-x/master/docs/hoobs/installed.png)

### Browse Plugins
You can search all of the available plugins, and install them, all from one screen.

![](https://raw.githubusercontent.com/mkellsy/homebridge-x/master/docs/hoobs/search.png)

### Configuration
The configuration screen allows you to modify your Homebridge settings, platforms and accessories.

![](https://raw.githubusercontent.com/mkellsy/homebridge-x/master/docs/hoobs/config.png)

## Adding Homebridge to iOS
HomeKit itself is actually not an app; it's a "database" similar to HealthKit and PassKit. Where HealthKit has the companion Health app and PassKit has Passbook, HomeKit has the Home app, introduced with iOS 10.  

If you are a member of the iOS developer program, you might also find Apple's [HomeKit Catalog](https://developer.apple.com/documentation/homekit/configuring_a_home_automation_device) app to be useful, as it provides straightforward and comprehensive management of all HomeKit database "objects".  

Using the Home app (or most other HomeKit apps), you should be able to add the single accessory "Homebridge", assuming that you're still running Homebridge and you're on the same Wifi network. Adding this accessory will automatically add all accessories and platforms defined in your configuration.  

When you attempt to add Homebridge, it will ask for a "PIN code". The default code is 031-45-154 (but this can be changed).

## Interacting with your Devices
Once your device has been added to HomeKit, you should be able to tell Siri to control your devices. However, realize that Siri is a cloud service, and iOS may need some time to synchronize your device information with iCloud.  

One final thing to remember is that Siri will almost always prefer its default phrase handling over HomeKit devices. For instance, if you name your Sonos device "Radio" and try saying "Siri, turn on the Radio" then Siri will probably start playing an iTunes Radio station on your phone. Even if you name it "Sonos" and say "Siri, turn on the Sonos", Siri will probably just launch the Sonos app instead. This is why, for instance, the suggested name for the Sonos accessory is "Speakers".

### Controls
You can interact with your devices from the Accessories screen in the interface. Here is a list of available controls.

- **Light (Binary, Dimmer & Hue)**
- **Switch**
- **Thermostat**
- **Door Lock**
- **Garage Door**

### Sensors
Here is a list of available sensors.

- **Temperature**
- **Humidity**
- **Contact (Door/Window)**
- **Battery**
- **Motion**

## Documentation
[Getting Started](https://github.com/mkellsy/homebridge-x/blob/master/docs/getting-started.md)  
[API Reference](https://github.com/mkellsy/homebridge-x/blob/master/docs/api-reference.md)  
[Logging & Monitoring](https://github.com/mkellsy/homebridge-x/blob/master/docs/logging-monitoring.md)  
[Developing Plugins](https://github.com/mkellsy/homebridge-x/blob/master/docs/developing-plugins.md)  
[Code of Conduct](https://github.com/mkellsy/homebridge-x/blob/master/CONDUCT.md)
