import Vue from "vue";
import Router from "vue-router";
import Plugins from "../etc/plugins.json";

Vue.use(Router);

const getRoutes = (defaultRoute) => {
    const routes = [{
        path: defaultRoute === "status" ? "/" : "/status",
        name: "status",
        component: () => import("./views/status.vue")
    },{
        path: "/login",
        name: "login",
        component: () => import("./views/login.vue")
    },{
        path: "/help",
        name: "help",
        component: () => import("./views/help.vue")
    },{
        path: "/system",
        name: "system",
        component: () => import("./views/system.vue")
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
        path: "/config",
        name: "config",
        component: () => import("./views/config.vue")
    },{
        path: "/config/advanced",
        name: "config-advanced",
        component: () => import("./views/config-advanced.vue")
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

export default function(defaultRoute) {
    return new Router({
        mode: "history",
        base: process.env.BASE_URL,
        routes: getRoutes(defaultRoute)
    });
}
