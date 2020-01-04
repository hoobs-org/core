import Vue from "vue";
import Graphing from "./graphing";
import Request from "axios";

import Localization from "./localization";
import Cookies from "./cookies";
import Config from "./config";
import Router from "./router";
import Themes from "./themes/themes";
import Store from "./store";
import App from "./app.vue";

(async () => {
    window.jsonlint = require("jsonlint-mod");

    const config = new Config();
    const index = parseInt(Cookies.get("instance") || "0", 10);

    await config.list();
    await config.active(index);

    Vue.mixin({
        computed: {
            $server() {
                return config.server;
            },
        
            $client() {
                return config.client;
            },

            $cluster() {
                return config.cluster;
            },
        
            $bridge() {
                return config.bridge;
            },
        
            $description() {
                return config.description;
            },
        
            $ports() {
                return config.ports;
            },
        
            $accessories() {
                return config.accessories;
            },
        
            $platforms() {
                return config.platforms;
            },
        
            $instance() {
                return config.instance;
            },

            $theme() {
                return Themes[config.client.theme || "hoobs-light"];
            },

            $themes() {
                return Themes;
            }
        },

        methods: {
            async $instances() {
                return await config.list();
            },

            async $active(index) {
                await config.active(index);

                Cookies.set("instance", index, 20160);

                window.location.reload();
            },

            async $configure() {
                await config.configure();
            },

            $cookie(name, value, minutes) {
                if (value === undefined) {
                    return Cookies.get(name);
                } else if (minutes < 0) {
                    Cookies.set(name, "", -1);
                } else {
                    Cookies.set(name, value, minutes);
                }
            }
        }
    });

    Vue.mixin({
        data: () => {
            return {
                client: {
                    async get(url, sync) {
                        Request.defaults.headers.get["Authorization"] = Cookies.get("token");
    
                        if (sync) {
                            return new Promise((resolve, reject) => {
                                Request.get(`/api${url}`).then((response) => {
                                    resolve(response.data);
                                }).catch((error) => {
                                    reject(error);
                                });
                            });
                        } else {
                            return (await Request.get(`/api${url}`)).data;
                        }
                    },
    
                    async post(url, data, sync) {
                        Request.defaults.headers.post["Authorization"] = Cookies.get("token");
    
                        if (sync) {
                            return new Promise((resolve, reject) => {
                                Request.post(`/api${url}`, data).then((response) => {
                                    resolve(response.data);
                                }).catch((error) => {
                                    reject(error);
                                });
                            })
                        } else {
                            return (await Request.post(`/api${url}`, data)).data;
                        }
                    },
    
                    async put(url, data, sync) {
                        Request.defaults.headers.put["Authorization"] = Cookies.get("token");
    
                        if (sync) {
                            return new Promise((resolve, reject) => {
                                Request.put(`/api${url}`, data).then((response) => {
                                    resolve(response.data);
                                }).catch((error) => {
                                    reject(error);
                                });
                            })
                        } else {
                            return (await Request.put(`/api${url}`, data)).data;
                        }
                    },
    
                    async delete(url, data, sync) {
                        Request.defaults.headers.delete["Authorization"] = Cookies.get("token");
    
                        if (sync) {
                            return new Promise((resolve, reject) => {
                                Request.delete(`/api${url}`, data).then((response) => {
                                    resolve(response.data);
                                }).catch((error) => {
                                    reject(error);
                                });
                            })
                        } else {
                            return (await Request.delete(`/api${url}`, data)).data;
                        }
                    }
                },
    
                api: {
                    async get(url, sync) {
                        Request.defaults.headers.get["Authorization"] = Cookies.get("token");
    
                        if (sync) {
                            return new Promise((resolve, reject) => {
                                Request.get(`${config.instance}/api${url}`).then((response) => {
                                    resolve(response.data);
                                }).catch((error) => {
                                    reject(error);
                                });
                            });
                        } else {
                            return (await Request.get(`${config.instance}/api${url}`)).data;
                        }
                    },
    
                    async post(url, data, sync) {
                        Request.defaults.headers.post["Authorization"] = Cookies.get("token");
    
                        if (sync) {
                            return new Promise((resolve, reject) => {
                                Request.post(`${config.instance}/api${url}`, data).then((response) => {
                                    resolve(response.data);
                                }).catch((error) => {
                                    reject(error);
                                });
                            })
                        } else {
                            return (await Request.post(`${config.instance}/api${url}`, data)).data;
                        }
                    },
    
                    async put(url, data, sync) {
                        Request.defaults.headers.put["Authorization"] = Cookies.get("token");
    
                        if (sync) {
                            return new Promise((resolve, reject) => {
                                Request.put(`${config.instance}/api${url}`, data).then((response) => {
                                    resolve(response.data);
                                }).catch((error) => {
                                    reject(error);
                                });
                            })
                        } else {
                            return (await Request.put(`${config.instance}/api${url}`, data)).data;
                        }
                    },
    
                    async delete(url, data, sync) {
                        Request.defaults.headers.delete["Authorization"] = Cookies.get("token");
    
                        if (sync) {
                            return new Promise((resolve, reject) => {
                                Request.delete(`${config.instance}/api${url}`, data).then((response) => {
                                    resolve(response.data);
                                }).catch((error) => {
                                    reject(error);
                                });
                            })
                        } else {
                            return (await Request.delete(`${config.instance}/api${url}`, data)).data;
                        }
                    }
                }
            }
        },

        methods: {
            getPlugin(name) {
                const plugin = config.platforms.filter(p => p.platform === name);
    
                if (plugin.length > 0) {
                    return plugin;
                }
    
                return {};
            }
        }
    });

    Vue.use(Graphing.use(Chart));
    
    const localization = Localization(config.client.locale);
    const router = Router(config.client.default_route || "status");
    
    router.beforeEach(async (to, from, next) => {
        if (to.path !== "/login" && !(await Cookies.validate())) {
            router.push({
                path: "/login",
                query: {
                    url: to.path
                }
            });
            
            return;
        }
    
        const token = Cookies.get("token");

        let decoded = null;

        try {
            decoded = JSON.parse(Cookies.decode(token));
        } catch {
            decoded = null;
        }

        Cookies.set("token", token, (decoded || {}).ttl || config.client.inactive_logoff || 30);
    
        if (!token) {
            Store.commit("session", null);
        }
    
        Store.commit("session", decoded);
    
        next();
    });
    
    Vue.config.productionTip = false;
    
    new Vue({
        router,
        i18n: localization,
        store: Store,
        themes: Themes,
        render: view => view(App)
    }).$mount("#app");
})()
