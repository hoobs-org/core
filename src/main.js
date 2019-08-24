import Vue from "vue";
import Socket from "vue-socket.io";
import Client from "socket.io-client";
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
    const config = new Config();
    const index = parseInt(Cookies.get("instance") || "0", 10);
    const instance = (await config.list())[index];

    await config.active(index);

    Vue.mixin({
        computed: {
            $socket() {
                return config.socket;
            },
        
            $control() {
                return config.control;
            },
        
            $server() {
                return config.server;
            },
        
            $client() {
                return config.client;
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
            }
        },

        methods: {
            async $instances() {
                return await config.list();
            },

            async $active(index) {
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
                                Request.get(`${config.control}${url}`).then((response) => {
                                    resolve(response.data);
                                }).catch((error) => {
                                    reject(error);
                                });
                            });
                        } else {
                            return (await Request.get(`${config.control}${url}`)).data;
                        }
                    },
    
                    async post(url, data, sync) {
                        Request.defaults.headers.post["Authorization"] = Cookies.get("token");
    
                        if (sync) {
                            return new Promise((resolve, reject) => {
                                Request.post(`${config.control}${url}`, data).then((response) => {
                                    resolve(response.data);
                                }).catch((error) => {
                                    reject(error);
                                });
                            })
                        } else {
                            return (await Request.post(`${config.control}${url}`, data)).data;
                        }
                    },
    
                    async put(url, data, sync) {
                        Request.defaults.headers.put["Authorization"] = Cookies.get("token");
    
                        if (sync) {
                            return new Promise((resolve, reject) => {
                                Request.put(`${config.control}${url}`, data).then((response) => {
                                    resolve(response.data);
                                }).catch((error) => {
                                    reject(error);
                                });
                            })
                        } else {
                            return (await Request.put(`${config.control}${url}`, data)).data;
                        }
                    },
    
                    async delete(url, data, sync) {
                        Request.defaults.headers.delete["Authorization"] = Cookies.get("token");
    
                        if (sync) {
                            return new Promise((resolve, reject) => {
                                Request.delete(`${config.control}${url}`, data).then((response) => {
                                    resolve(response.data);
                                }).catch((error) => {
                                    reject(error);
                                });
                            })
                        } else {
                            return (await Request.delete(`${config.control}${url}`, data)).data;
                        }
                    }
                },
    
                api: {
                    async get(url, sync) {
                        Request.defaults.headers.get["Authorization"] = Cookies.get("token");
    
                        if (sync) {
                            return new Promise((resolve, reject) => {
                                Request.get(`${config.instance}${url}`).then((response) => {
                                    resolve(response.data);
                                }).catch((error) => {
                                    reject(error);
                                });
                            });
                        } else {
                            return (await Request.get(`${config.instance}${url}`)).data;
                        }
                    },
    
                    async post(url, data, sync) {
                        Request.defaults.headers.post["Authorization"] = Cookies.get("token");
    
                        if (sync) {
                            return new Promise((resolve, reject) => {
                                Request.post(`${config.instance}${url}`, data).then((response) => {
                                    resolve(response.data);
                                }).catch((error) => {
                                    reject(error);
                                });
                            })
                        } else {
                            return (await Request.post(`${config.instance}${url}`, data)).data;
                        }
                    },
    
                    async put(url, data, sync) {
                        Request.defaults.headers.put["Authorization"] = Cookies.get("token");
    
                        if (sync) {
                            return new Promise((resolve, reject) => {
                                Request.put(`${config.instance}${url}`, data).then((response) => {
                                    resolve(response.data);
                                }).catch((error) => {
                                    reject(error);
                                });
                            })
                        } else {
                            return (await Request.put(`${config.instance}${url}`, data)).data;
                        }
                    },
    
                    async delete(url, data, sync) {
                        Request.defaults.headers.delete["Authorization"] = Cookies.get("token");
    
                        if (sync) {
                            return new Promise((resolve, reject) => {
                                Request.delete(`${config.instance}${url}`, data).then((response) => {
                                    resolve(response.data);
                                }).catch((error) => {
                                    reject(error);
                                });
                            })
                        } else {
                            return (await Request.delete(`${config.instance}${url}`, data)).data;
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
    
    Vue.use(new Socket({
        connection: Client(config.socket),
        vuex: {
            Store
        }
    }));
    
    const localization = Localization(config.client.locale);
    const router = Router(config.client.default_route || "status");
    
    router.beforeEach(async (to, from, next) => {
        if (to.path !== "/login" && !(await Cookies.validate(config.instance))) {
            router.push({
                path: "/login",
                query: {
                    url: to.path
                }
            });
            
            return;
        }
    
        const token = Cookies.get("token");
    
        Cookies.set("token", token, config.client.inactive_logoff || 30);
    
        if (!token) {
            Store.commit("session", null);
        }
    
        try {
            Store.commit("session", JSON.parse(atob(token)));
        } catch {
            Store.commit("session", null);
        }
    
        next();
    });
    
    Vue.config.productionTip = false;
    
    new Vue({
        router,
        i18n: localization,
        store: Store,
        themes: Themes,
        sockets: {
            log: (data) => {
                Store.commit("log", data);
            },
            push: (data) => {
                try {
                    data = JSON.parse(data);
                } catch {
                    data = null;
                }
    
                if (data) {
                    Store.commit("push", data);
                }
            },
            monitor: (status) => {
                try {
                    status = JSON.parse(status);
                } catch {
                    status = null;
                }
        
                if (status) {
                    if (status.data.instance === instance) {
                        Store.commit("monitor", status);
                    }
                }
            }
        },
        render: view => view(App)
    }).$mount("#app");
})()
