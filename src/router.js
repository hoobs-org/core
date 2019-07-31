import Vue from "vue";
import Router from "vue-router";

import Plugins from "../etc/plugins.json";
import Config from "../etc/config.json";

Vue.use(Router);

const getRoutes = () => {
    const defaultRoute = Config.client.default_route || "status";

    const routes = [{
        path: defaultRoute === "status" ? "/" : "/status",
        name: "status",
        component: () => import("./views/status.vue")
    },{
        path: "/login",
        name: "login",
        component: () => import("./views/login.vue")
    },{
        path: "/profile",
        name: "profile",
        component: () => import("./views/profile.vue")
    },{
        path: defaultRoute === "log" ? "/" : "/log",
        name: "log",
        component: () => import("./views/log.vue")
    },{
        path: "/users",
        name: "users",
        component: () => import("./views/users.vue")
    },{
        path: defaultRoute === "plugins" ? "/" : "/plugins",
        name: "plugins",
        component: () => import("./views/plugins.vue")
    },{
        path: "/plugins/search",
        name: "search",
        component: () => import("./views/search.vue")
    },{
        path: "/plugin/:name",
        name: "plugin",
        component: () => import("./views/plugin.vue")
    },{
        path: defaultRoute === "accessories" ? "/" : "/accessories",
        name: "accessories",
        component: () => import("./views/accessories.vue")
    },{
        path: "/accessories/layout",
        name: "layout",
        component: () => import("./views/layout.vue")
    },{
        path: defaultRoute === "config" ? "/" : "/config",
        name: "config",
        component: () => import("./views/config.vue")
    },{
        path: "*",
        component: () => import("./views/error.vue")
    }];

    for (let i = 0; i < Plugins.length; i++) {
        const { ...plugin } = Plugins[i];

        routes.push({
            path: defaultRoute === (plugin.route || plugin.name) ? "/" : `/${plugin.route || plugin.name}`,
            name: plugin.name,
            component: () => import(`../node_modules/${plugin.module}/index.vue`)
        });
    }

    return routes;
}

export default new Router({
    mode: "history",
    base: process.env.BASE_URL,
    routes: getRoutes()
});
