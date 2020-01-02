const File = require("fs-extra");

module.exports = {
    admin: false,
    api: null,
    app: null,
    application: null,
    cache: null,
    client: null,
    config: null,
    controllers: null,
    debug: false,
    layout: null,
    log: null,
    mode: "default",
    name: null,

    options: [
        "-R"
    ],

    server: null,
    storage: null,
    sudo: null,
    user: null,
    users: null,
    cpmod: true,
    plugins: {},

    JSON: {
        tryParse: function(value, replacement) {
            replacement = replacement || null;

            try {
                return JSON.parse(value);
            } catch {
                return replacement;
            }
        },

        load: function(filename, replacement) {
            replacement = replacement || null;
        
            try {
                return JSON.parse(File.readFileSync(filename));
            } catch {
                return replacement;
            }
        },

        validateFile: function(filename) {
            if (File.existsSync(filename)) {
                try {
                    if (typeof (JSON.parse(File.readFileSync(filename))) === "object") {
                        return true;
                    }

                    return false;
                } catch {
                    return false;
                }
            }

            return false;
        },

        equals: function(source, value) {
            if (JSON.stringify(source) === JSON.stringify(value)) {
                return true;
            }

            return false;
        },

        clone: function(object) {
            return JSON.parse(JSON.stringify(object));
        },

        toString: function(object) {
            return JSON.stringify(object, null, 4);
        }
    }
};
