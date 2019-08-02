# Developing Plugins

When writing your plugin, you'll want HOOBS to load it from your development directory instead of publishing it to npm each time. You can tell HOOBS to look for your plugin at a specific location using the command-line parameter -P. For example, if you are in the HOOBS directory (as checked out from Github), you might type:

```sh
./bin/hoobs -D -P ../my-great-plugin/
```

This will start up HOOBS and load your in-development plugin from a nearby directory.

> Note when you make changes to an interface plugin, you don't need to restart the interface. The server detects changes and will rebuild the interface live.

You can start Homebridge in native mode for debugging and testing by running this command.

```sh
./bin/hoobs-native -D
```

> This differs from the main ./bin/hoobs script. This starts only Homebridge for plugin development.

When you load a path, HOOBS will actually add a symlink to the modules directory. This is done to get the exact same behavior as production. Therefore your plugin will have access to all packages the parent and other plugins have.

## Server & Interface Plugins

Your plugin can contain one or both types of plugins. Server plugins are loaded into the HOOBS service, like typical Homebridge plugins. These plugins are supported by both Homebridge and HOOBS.

Interface plugins are plugins that are loaded into the interface. Your plugin can contain both a server and interface plugin. The vanilia Homebridge server will simply ignore the interface plugin.

## Server Plugins

There are two basic types of server plugins:
* Single accessories: controls, for example, a single light bulb.
* Platform accessories: a "meta" accessory that controls many sub-accessories. For example, a bridge that translates to many other devices on a specialized channel.

There are many existing plugins you can study; you might start with the included [Example Plugins](https://github.com/nfarina/homebridge/tree/master/example-plugins). Right now this contains a single plugin that registers a platform that offers fake light accessories. This is a good example of how to use the Homebridge Plugin API. You can also find an example plugin that [publishes an individual accessory](https://github.com/nfarina/homebridge/tree/6500912f54a70ff479e63e2b72760ab589fa558a/example-plugins/homebridge-lockitron).

Here is a basic plugin template:

```javascript
class Plugin {
    constructor(log, config, homebridge) {
        console.log(`Homebridge API Version: ${homebridge.version}`);

        // PLUGIN CODE

    }

    accessories(callback) {
        callback([]);
    }
}

module.exports = function (homebridge) {
    homebridge.registerPlatform("homebridge-demo-plugin", "demo-plugin", Plugin, true);
}
```

Server plugins have a couple of requirements:
* The plugin name must start with **homebridge-**.
* **homebridge-plugin** needs to be in the keywords section of your **package.json** file.
* You must define **node>=[node version]** and **homebridge>=[homebridge version]** in the engines section of your **package.json** file.

Example packages.json file

```json
{
    "name": "homebridge-demo-plugin",
    "version": "0.0.1",
    "description": "Demo Platform plugin for homebridge",
    "license": "MIT",
    "keywords": [
        "homebridge-plugin"
    ],
    "engines": {
        "node": ">=4.3.2",
        "homebridge": ">=0.4.50"
    }
}
```

For more examples on how to construct HomeKit Services and Characteristics, see the many Accessories in the [Legacy Plugins](https://github.com/nfarina/homebridge-legacy-plugins/tree/master/accessories) repository.

You can also view the [full list of supported HomeKit Services and Characteristics in the HAP-NodeJS protocol repository](https://github.com/KhaosT/HAP-NodeJS/blob/master/lib/gen/HomeKitTypes.js).

See more examples on how to create Platform classes in the [Legacy Plugins](https://github.com/nfarina/homebridge-legacy-plugins/tree/master/platforms) repository.

## Interface Plugins

The interface uses [VueJS](https://vuejs.org). To start you need to add a few lines to your **packages.json** file and add an **index.vue** file to the root of your plugin folder.

From the **index.vue** file you can render VueJS components. For further information refer to VueJS documentation:  
[Getting Started](https://vuejs.org/v2/guide/)  
[API Documentation](https://vuejs.org/v2/api/)  
[Cookbook](https://vuejs.org/v2/cookbook/)  

Interface plugins have a few requirements:
* **homebridge-interface** needs to be in the keywords section of your **package.json** file.
* You need to define a **title** in your **package.json** file.
* you need to define a **plugin_icon** in your **package.json** file.

Example packages.json file

```json
{
    "name": "homebridge-demo-plugin",
    "version": "0.0.1",
    "plugin_icon": {
        "type": "material",
        "name": "power"
    },
    "route": "demo",
    "title": "Demo Plugin",
    "description": "Demo Platform plugin for homebridge",
    "license": "MIT",
    "keywords": [
        "homebridge-plugin",
        "homebridge-interface"
    ],
    "engines": {
        "node": ">=4.3.2",
        "homebridge": ">=0.4.50"
    }
}
```

Your **index.vue** file is loaded as a route in the interface. In the example above the route will be **/demo/**. If you don't define the **route** setting, the route will default to the **name** field.

Example index.vue file

```html
<template>
    <div id="demo">{{ message }}</div>
</template>

<script>
    export default {
        name: "homebridge-demo-plugin",

        data() {
            return {
                message: ""
            }
        },

        mounted() {
            this.message = "Demo Homebridge Interface Plugin";
        }
    }
</script>

<style scoped>
    #demo {
        flex: 1;
        padding: 0;
        overflow: auto;
    }
</style>
```

This combined with a server plugin, where the server plugin acts as an API. You can enable bi-directional communication between the server and interface.

### Icons

Interface plugins require an icon. This icon is placed in the navagation menu. There are two supported types:
* Material icon.
* Base64 encoded svg images.

Material icons can be found [here](https://material.io/tools/icons/?style=baseline). Simply set the **name** field to the material icon:

```json
"plugin_icon": {
    "type": "material",
    "name": "accessibility"
}
```

SVG images need to be base64 encoded. You can encode SVG code [here](https://www.base64encode.org/):

```json
"plugin_icon": {
    "type": "svg",
    "encoded": "PHN2ZyB3aWR0aD0iMjYzIiBoZWlnaHQ9IjI2NSIgdmlld0JveD0iM..."
}
```

### CSS & Image Processing

The interface needs to know what to do with your CSS and images. This is handled when HOOBS starts and builds the interface. You need to define a **postcss.config.js** file.

```javascript
module.exports = {
    plugins: {
        autoprefixer: {}
    }
}
```

This needs to be in the same folder as your **index.vue** file.

## Configuration Files

HOOBS will try to pre-configure plugins when installing. This will look for a **config.schema.json** file and insert the default configuration into the main configuration.

Here is an example **config.schema.json** file:

```json
{
    "platform": {
        "plugin": "homebridge-demo-plugin",
        "platform": "demo-plugin",
        "name": "Demo"
    },
    "accessories": []
}
```

Notice that there are sections for the platform and accessories. If you don't have, for example accessories, it is OK to omit them.
