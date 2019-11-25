const HBS = require("./instance");

module.exports = () => {
    return {
        info: (message) => {
            console.log(message);
        },
        debug: (message) => {
            if (HBS.debug) {
                console.log(message);
            }
        },
        error: (message) => {
            console.log(message);
        },
        fatal: (message) => {
            console.log(message);
        }
    };
};
