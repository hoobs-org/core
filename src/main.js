import Vue from "vue";
import Socket from "vue-socket.io";
import Client from "socket.io-client";
import Graphing from "./graphing";
import Chart from "chart.js";
import Request from "axios";
import Cookies from "./cookies";

import Store from "./store";
import Router from "./router";
import Localization from "./localization";
import App from "./app.vue";
import Themes from "./themes/themes";

import Config from "../etc/config.json";

Chart.defaults.global.defaultFontColor = (Config.client.theme || "hoobs-light").endsWith("dark") ? "#f9bd2b" : "#999";

Vue.mixin({
    data: () => {
        return {
            get config() {
                return Config || {};
            },

            get client() {
                return Config.client || {};
            },

            api: {
                async get(url, sync) {
                    Request.defaults.headers.get["Authorization"] = Cookies.get("token");

                    if (sync) {
                        return new Promise((resolve, reject) => {
                            Request.get(`${Config.client.api}${url}`).then((response) => {
                                resolve(response.data);
                            }).catch((error) => {
                                reject(error);
                            });
                        });
                    } else {
                        return (await Request.get(`${Config.client.api}${url}`)).data;
                    }
                },

                async post(url, data, sync) {
                    Request.defaults.headers.post["Authorization"] = Cookies.get("token");

                    if (sync) {
                        return new Promise((resolve, reject) => {
                            Request.post(`${Config.client.api}${url}`, data).then((response) => {
                                resolve(response.data);
                            }).catch((error) => {
                                reject(error);
                            });
                        })
                    } else {
                        return (await Request.post(`${Config.client.api}${url}`, data)).data;
                    }
                },

                async put(url, data, sync) {
                    Request.defaults.headers.put["Authorization"] = Cookies.get("token");

                    if (sync) {
                        return new Promise((resolve, reject) => {
                            Request.put(`${Config.client.api}${url}`, data).then((response) => {
                                resolve(response.data);
                            }).catch((error) => {
                                reject(error);
                            });
                        })
                    } else {
                        return (await Request.put(`${Config.client.api}${url}`, data)).data;
                    }
                },

                async delete(url, data, sync) {
                    Request.defaults.headers.delete["Authorization"] = Cookies.get("token");

                    if (sync) {
                        return new Promise((resolve, reject) => {
                            Request.delete(`${Config.client.api}${url}`, data).then((response) => {
                                resolve(response.data);
                            }).catch((error) => {
                                reject(error);
                            });
                        })
                    } else {
                        return (await Request.delete(`${Config.client.api}${url}`, data)).data;
                    }
                }
            }
        }
    },
    methods: {
        getPlugin(name) {
            const plugin = Config.platforms.filter(p => p.platform === name);

            if (plugin.length > 0) {
                return plugin;
            }

            return {};
        }
    }
});

Vue.use(Graphing.use(Chart));

Vue.use(new Socket({
    connection: Client((Config.client || {}).socket || "http://hoobs.local:5128"),
    vuex: {
        Store
    }
}));

Router.beforeEach(async (to, from, next) => {
    if (to.path !== "/login" && !(await Cookies.validate())) {
        Router.push({
            path: "/login",
            query: {
                url: to.path
            }
        });
        
        return;
    }

    const token = Cookies.get("token");

    Cookies.set("token", token, Config.client.inactive_logoff || 30);

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
    router: Router,
    i18n: Localization,
    themes: Themes,
    store: Store,
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
        monitor: (data) => {
            try {
                data = JSON.parse(data);
            } catch {
                data = null;
            }

            if (data) {
                Store.commit("monitor", data);
            }
        }
    },
    render: view => view(App)
}).$mount("#app");
