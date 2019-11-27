import Vue from "vue";
import Router from "vue-router";

Vue.use(Router);

const getRoutes = (defaultRoute) => {
    const routes = [{
        path: defaultRoute === "status" ? "/" : "/status",
        name: "status",
        component: () => import(/* webpackChunkName: "stats" */ "./views/status.vue")
    },{
        path: "/login",
        name: "login",
        component: () => import(/* webpackChunkName: "login" */ "./views/login.vue")
    },{
        path: "/help",
        name: "help",
        component: () => import(/* webpackChunkName: "help" */ "./views/help.vue")
    },{
        path: "/system/terminal",
        name: "terminal",
        component: () => import(/* webpackChunkName: "terminal" */ "./views/terminal.vue")
    },{
        path: "/system/:section",
        name: "system",
        component: () => import(/* webpackChunkName: "system" */ "./views/system.vue"),
        props: true
    },{
        path: "/profile",
        name: "profile",
        component: () => import(/* webpackChunkName: "profile" */ "./views/profile.vue")
    },{
        path: defaultRoute === "log" ? "/" : "/log",
        name: "log",
        component: () => import(/* webpackChunkName: "log" */ "./views/log.vue")
    },{
        path: "/users",
        name: "users",
        component: () => import(/* webpackChunkName: "users" */ "./views/users.vue")
    },{
        path: "/plugins",
        name: "plugins",
        component: () => import(/* webpackChunkName: "plugins" */ "./views/plugins.vue")
    },{
        path: "/plugins/:category",
        name: "search",
        component: () => import(/* webpackChunkName: "search" */ "./views/search.vue"),
        props: true
    },{
        path: "/plugin/:name",
        name: "plugin",
        component: () => import(/* webpackChunkName: "plugin" */ "./views/plugin.vue")
    },{
        path: defaultRoute === "accessories" ? "/" : "/accessories",
        name: "accessories",
        component: () => import(/* webpackChunkName: "accessories" */ "./views/accessories.vue")
    },{
        path: "/accessories/layout",
        name: "layout",
        component: () => import(/* webpackChunkName: "layout" */ "./views/layout.vue")
    },{
        path: "/config/:section",
        name: "config",
        component: () => import(/* webpackChunkName: "config" */ "./views/config.vue"),
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
