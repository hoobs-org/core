# API Reference
HOOBS has an API built-in that allows you to monitor, configure and control Homebridge.

## Authentication
This is the main entry point to the API. You can use this to authenticate and recieve an authorization token.

```sh
POST /auth
Body: application/json
```

Request body.
```javascript
{
    "username": "luke_skywalker",
    "password": "MayTheForceBeWithYou"
}
```

Response
```javascript
{
    "token": "THVrZSBTa3l3YWxrZXI="
}
```

The token will be null if authentication has failed. The token can now be used in the **authroization** header for all other requests to the API.


## Service Information
This fetches basic information about the Homebridge service. Non admin users will recieve limited information.

```sh
GET /
```

This returns basic information about HOOBS.

```javascript
{
    "bridge_name": "Homebridge",
    "homebridge_version": "0.4.50",
    "username": "CC:22:3D:E3:CE:30",
    "homebridge_port": 51826,
    "home_setup_pin": "031-45-154",
    "home_setup_id": "X-HM://",
    "application_path": ".../homebridge-x",
    "configuration_path": ".../homebridge-x/etc",
    "local_modules_path": ".../homebridge-x/node_modules",
    "global_modules_path": "/usr/local/lib/node_modules",
    "homebridge_path": ".../homebridge-x/node_modules/homebridge"
}
```

## Service Control
This controls the Homebridge service. Admin users can start, stop and restart the Homebridge service.

```sh
GET /service
```

Returns the current status of the Homebridge service.

```javascript
{
    "version": "0.4.50",
    "running": true,
    "status": "running",
    "time": 1355538
}
```

To change the state of the Homebridge service.

```sh
POST /service/:action [start|stop|restart|clean]
```

> The clean action will remove the /persist folder. This addresses known issues when running Homebridge on a Mac.

## Accessory Control
This API gives you access to monitor and control your accessories attached to Homebridge.

```sh
GET /accessories
```

This fetches your accessories in room layout. If an accessory is not in a room an Unassigned room is added to the layout.

```javascript
{
    "rooms": [
        {
            "name": "Climate",
            "accessories": [
                {
                    "aid": 43,
                    "type": "thermostat",
                    "name": "House",
                    "characteristics": [
                        {
                            "type": "heating_cooling_state",
                            "value": 0,
                        }
                    ],
                    "values": {
                        "heating_cooling_state": 0
                    }
                }
            ]
        },
        {
            "name": "Unassigned",
            "accessories": []
        }
    ],
    "hidden": [
        18,
        23
    ]
}
```

> This example is truncated

To fetch a all accessories without the room layout

```sh
GET /accessories/list
```

To fetch just the room layout

```sh
GET /layout
```

Room layout results.

```javascript
{
    "rooms": [
        {
            "name": "Climate",
            "accessories": [
                43,
                44
            ]
        },
        {
            "name": "Unassigned",
            "accessories": []
        }
    ],
    "hidden": [
        18,
        23
    ]
}
```

> This example is truncated

To update the room layout.

```sh
POST /layout
Body: application/json
```

To fetch a single accessory

```sh
GET /accessory/:id [integer - accessory.aid]
```

To control an accessory.

```sh
PUT /accessory/:id/:service [integer - accessory.aid, integer - characteristic.iid]
Body: application/json
```

Request body.
```javascript
{
    "value": 50
}
```

## Users
Control access to the system. Admin users can add, edit and delete users.

```sh
GET /users
```

This fetches a list of users.

```javascript
[
    {
        "id": 1,
        "name": "Administrator",
        "admin": true,
        "username": "admin"
    },
    {
        "id": 2,
        "name": "Luke Skywalker",
        "admin": false,
        "username": "luke_skywalker"
    }
]
```

To add a user.

```sh
PUT /users
Body: application/json
```

Request body.
```javascript
{
    "name": "Hans Solo",
    "admin": false,
    "username": "hans",
    "password": "MilleniumFalcon"
}
```

Fetch a single user

```sh
GET /user/:id [integer - user.id]
```

To update a user

```sh
POST /user/:id [integer - user.id]
Body: application/json
```

And this deletes a user

```sh
DELETE /user/:id [integer - user.id]
```

## Configuration
Admin users can view and update the main configuration file from this API.

```sh
GET /config
```

This returns the current configuration

```javascript
{
    "bridge": {
        "name": "Homebridge",
        "username": "CC:22:3D:E3:CE:30",
        "port": 51826,
        "pin": "031-45-154"
    },
    "description": "",
    "ports": {},
    "paths": {
        "application": ".../homebridge-x",
        "config": ".../homebridge-x/etc",
        "modules": {
            "local": ".../homebridge-x/node_modules",
            "global": "/usr/local/lib/node_modules"
        },
        "homebridge": ".../homebridge-x/node_modules/homebridge"
    },
    "accessories": [],
    "platforms": []
}
```

To save a new configuration.

```sh
POST /config
Body: application/json
```

To backup your configuration.

```sh
POST /config/backup
```

## Plugins
This allows admin users to find, install, uninstall and update plugins.

```sh
GET /plugins
```

This lists the current installed plugins.

```javascript
[{
    "name": "homebridge-wink-schmittx",
    "version": "2.0.1",
    "intalled": "2.0.1",
    "description": "Homebridge plugin for wink.com",
    "links": {
        "npm": "https://www.npmjs.com/package/homebridge-wink-schmittx",
        "homepage": "https://github.com/schmittx/homebridge-wink",
        "repository": "https://github.com/schmittx/homebridge-wink",
        "bugs": "https://github.com/schmittx/homebridge-wink/issues"
    }
}]
```

> This example is truncated

Search available plugins.

```sh
POST /plugins/:query/:limit [integer 1 - 250]
```

Returned search results

```javascript
[{
    "name": "homebridge-nest",
    "version": "2.1.4",
    "installed": false,
    "description": "Nest plugin for homebridge",
    "links": {
        "npm": "https://www.npmjs.com/package/homebridge-nest",
        "homepage": "https://github.com/chrisjshull/homebridge-nest#readme",
        "repository": "https://github.com/chrisjshull/homebridge-nest",
        "bugs": "https://github.com/chrisjshull/homebridge-nest/issues"
    }
}]
```

> This example is truncated

To show details of a single package.

```sh
GET /plugins/:package [valid package on npmjs.com]
```

> This will fetch any available package. If it is installed you will see a version in the installed field.

To install a plugin.

```sh
PUT /plugins/:package [valid package on npmjs.com]
```

To remove a plugin

```sh
DELETE /plugins/:package [valid package on npmjs.com]
```

To update a plugin

```sh
POST /plugins/:package [valid package on npmjs.com]
```

## System Information
This API fetches information about the system Homebridge is running on. Non admin users only have access to the CPU and Memory load.

```sh
GET /system
```

Returns basic system information

```javascript
{
    "system": {
        "manufacturer": "Apple Inc.",
        "model": "MacBookPro14,2"
    },
    "bios": {
        "vendor": "Apple Inc.",
        "version": ""
    },
    "motherboard": {
        "manufacturer": "Apple Inc.",
        "model": "MacBookPro14,2"
    },
    "chassis": {
        "manufacturer": "Apple Inc.",
        "model": "MacBookPro14,2"
    },
    "battery": {
        "hasbattery": true,
        "cyclecount": 41
    },
    "os": {
        "platform": "darwin",
        "distro": "Mac OS X"
    }
}
```

> This example is truncated

To get CPU information

```sh
GET /system/cpu
```

To get memory information

```sh
GET /system/memory
```

To get system load/activity

```sh
GET /system/activity
```
