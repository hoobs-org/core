/**************************************************************************************************
 * hoobs-core                                                                                     *
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

const HBS = require("../server/instance");
const Plugins = require("../server/plugins");
const Server = require("../server/server");

module.exports = class PluginsController {
    constructor() {
        HBS.app.get("/api/plugins", (request, response) => this.installed(request, response));
        HBS.app.get("/api/plugins/:name", (request, response) => this.package(request, response));
        HBS.app.post("/api/plugins/:query", (request, response) => this.search(request, response));
        HBS.app.put("/api/plugin/:name", (request, response) => this.install(request, response));
        HBS.app.post("/api/plugin/:name", (request, response) => this.update(request, response));
        HBS.app.delete("/api/plugin/:name", (request, response) => this.uninstall(request, response));
    }

    installed(_request, response) {
        Plugins.installed().then((results) => {
            return response.send(results);
        });
    }

    package(request, response) {
        const name = decodeURIComponent(request.params.name);
        const installed = Plugins.list();
        const version = installed[name] ? installed[name].version : null

        Plugins.package(name, version).then((results) => {
            return response.send(results);
        });
    }

    search(request, response) {
        Plugins.search(decodeURIComponent(request.params.query)).then((results) => {
            return response.send(results);
        }).catch((_error) => {
            return response.send([]);
        });
    }

    install(request, response) {
        let name = decodeURIComponent(request.params.name) || "";
        let tag = "latest";
        let parts = [];

        if (name.startsWith("@")) {
            parts = name.substr(1).split("@");
            name = `@${parts[0]}`;

            if (parts.length > 1) {
                tag = parts[1];
            }
        } else {
            parts = name.split("@");
            name = parts[0];

            if (parts.length > 1) {
                tag = parts[1];
            }
        }

        if (Plugins.list()[name]) {
            HBS.log.push.warning(name, "Plugin already installed");

            if (request.query.socketed !== "true") {
                return response.send({
                    error: "package already installed"
                });
            }

            return response.send({
                success: true
            });
        }

        Plugins.install(name, tag, request.query.replace ? decodeURIComponent(request.query.replace) : null).then((results) => {
            if (results.success) {
                HBS.log.info(`Plugin "${name}" installed.`);

                const installed = Plugins.list();
                const version = installed[name] ? installed[name].version : null
                const details = Plugins.getPluginType(name);

                Plugins.package(name, version).then(async (plugin) => {
                    HBS.log.push.info(name, "Plugin successfully installed");

                    if (request.query.socketed === "true") {
                        HBS.config = await Server.configure();

                        HBS.server.restart().then(() => {
                            HBS.log.command("unlock");
                        });

                        HBS.log.command("redirect", {
                            route: `/config/${plugin.name}`
                        });
                    } else {
                        return response.send({
                            success: true,
                            active: results.active,
                            details,
                            plugin
                        });
                    }
                });
            } else {
                if (results.active > 0) {
                    HBS.log.push.warning("An install process is already running");
                } else {
                    HBS.log.push.error(name, "Plugin install failed");
                }

                if (request.query.socketed === "true") {
                    if (results.active === 0) {
                        HBS.log.command("redirect", {
                            route: "/plugins"
                        });
                    }
                } else {
                    return response.send({
                        error: results.active > 0 ? "system busy" : "plugin can not be installed",
                        active: results.active
                    });
                }
            }
        }).catch((error) => {
            HBS.log.error(error);
        });

        if (request.query.socketed === "true") {
            return response.send({
                success: true
            });
        }
    }

    uninstall(request, response) {
        let name = decodeURIComponent(request.params.name) || "";
        let parts = [];

        if (name.startsWith("@")) {
            parts = name.substr(1).split("@");
            name = `@${parts[0]}`;
        } else {
            parts = name.split("@");
            name = parts[0];
        }

        if (!Plugins.list()[name]) {
            HBS.log.push.warning(name, "Plugin not installed");

            if (request.query.socketed !== "true") {
                return response.send({
                    error: "package not installed"
                });
            }

            return response.send({
                success: true
            });
        }

        Plugins.uninstall(name).then(async (results) => {
            if (results.success) {
                HBS.log.info(`Plugin "${name}" removed.`);
                HBS.log.push.warning(name, "Plugin successfully removed");

                if (request.query.socketed === "true") {
                    HBS.config = await Server.configure();

                    HBS.server.restart().then(() => {
                        HBS.log.command("unlock");
                    });

                    HBS.log.command("redirect", {
                        route: "/plugins"
                    });
                } else {
                    return response.send({
                        success: true,
                        active: results.active
                    });
                }
            } else {
                if (results.active > 0) {
                    HBS.log.push.warning("An install process is already running");
                } else {
                    HBS.log.push.error(name, "Plugin remove failed");
                }

                if (request.query.socketed === "true") {
                    if (results.active === 0) {
                        HBS.log.command("redirect", {
                            route: "/plugins"
                        });
                    }
                } else {
                    return response.send({
                        error: results.active > 0 ? "system busy" : "plugin can not be installed",
                        active: results.active
                    });
                }
            }
        }).catch((error) => {
            HBS.log.error(error);
        });

        if (request.query.socketed === "true") {
            return response.send({
                success: true
            });
        }
    }

    update(request, response) {
        let name = decodeURIComponent(request.params.name) || "";
        let tag = "latest";
        let parts = [];

        if (name.startsWith("@")) {
            parts = name.substr(1).split("@");
            name = `@${parts[0]}`;

            if (parts.length > 1) {
                tag = parts[1];
            }
        } else {
            parts = name.split("@");
            name = parts[0];

            if (parts.length > 1) {
                tag = parts[1];
            }
        }

        if (!Plugins.list()[name]) {
            HBS.log.push.warning(name, "Plugin not installed");

            return response.send({
                error: "package not installed"
            });
        }

        Plugins.update(name, tag).then(async (results) => {
            HBS.log.info(`Plugin "${name}" updated.`);

            if (results.active > 0) {
                HBS.log.push.warning("An install process is already running");
            } else {
                HBS.log.push.info(name, "Plugin successfully updated");
            }

            if (request.query.socketed === "true") {
                if (results.active === 0) {
                    HBS.config = await Server.configure();

                    HBS.server.restart().then(() => {
                        HBS.log.command("unlock");
                    });

                    HBS.log.command("redirect", {
                        route: "/plugins"
                    });
                }
            } else {
                if (results.active === 0) {
                    return response.send({
                        success: true,
                        active: results.active
                    });
                }

                return response.send({
                    error: results.active > 0 ? "system busy" : "plugin can not be installed",
                    active: results.active
                });
            }
        }).catch((error) => {
            HBS.log.error(error);
        });
    }
}
