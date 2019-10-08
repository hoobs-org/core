import Vue from "vue";
import Router from "vue-router";

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
        path: "/system/terminal",
        name: "terminal",
        component: () => import("./views/terminal.vue")
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
        path: "/plugins",
        name: "plugins",
        component: () => import("./views/plugins.vue")
    },{
        path: "/plugins/:category",
        name: "search",
        component: () => import("./views/search.vue"),
        props: true
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
        path: "/config/:section",
        name: "config",
        component: () => import("./views/config.vue"),
        props: true
    }];

    return routes;
}

export default function(defaultRoute) {
    return new Router({
        mode: "history",
        base: process.env.BASE_URL,
        routes: getRoutes(defaultRoute)
    });
}
