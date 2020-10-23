/**************************************************************************************************
 * hoobs-core / homebridge                                                                        *
 * Copyright (C) 2020 Homebridge                                                                  *
 * Copyright (C) 2020 HOOBS                                                                       *
 *                                                                                                *
 * This program is free software: you can redistribute it and/or modify                           *
 * it under the terms of the GNU General Public License as published by                           *
 * the Free Software Foundation, either version 3 of the License, or                              *
 * (at your option) any later version.                                                            *
 *                                                                                                *
 * This program is distributed in the hope that it will be useful,                                *
 * but WITHOUT ANY WARRANTY; without even the implied warranty of                                 *
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the                                  *
 * GNU General Public License for more details.                                                   *
 *                                                                                                *
 * You should have received a copy of the GNU General Public License                              *
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.                          *
 **************************************************************************************************/

const util = require("util");

let debug = false;

function setDebug(enabled) {
    debug = enabled;
}

const loggerCache = {};

class Console {
    constructor(prefix) {
        this.prefix = prefix;
    }

    debug() {
        if (debug) {
            this.log.apply(this, ["debug"].concat(Array.prototype.slice.call(arguments)));
        }
    }
    
    info() {
        this.log.apply(this, ["info"].concat(Array.prototype.slice.call(arguments)));
    }
    
    warn() {
        this.log.apply(this, ["warn"].concat(Array.prototype.slice.call(arguments)));
    }
    
    error() {
        this.log.apply(this, ["error"].concat(Array.prototype.slice.call(arguments)));
    }
    
    log(level, msg) {
        msg = util.format.apply(util, Array.prototype.slice.call(arguments, 1));
    
        if (this.prefix) {
            msg = `[${this.prefix}] ${msg}`;
        }
    
        if (level === "warn" || level === "error") {
            process.send({ event: "error_log", data: msg });
        } else {
            process.send({ event: "info_log", data: msg });
        }
    }
    
    static withPrefix(prefix) {
        if (!loggerCache[prefix]) {
            const logger = new Console(prefix);
            const log = logger.info.bind(logger);
    
            log.debug = logger.debug;
            log.info = logger.info;
            log.warn = logger.warn;
            log.error = logger.error;
            log.log = logger.log;
            log.prefix = logger.prefix;
    
            loggerCache[prefix] = log;
        }
    
        return loggerCache[prefix];
    }
}

module.exports = {
    Console,
    setDebug,
    internal: new Console()
}
