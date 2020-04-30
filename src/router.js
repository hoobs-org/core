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
        path: "/plugins/search",
        name: "search",
        component: () => import(/* webpackChunkName: "search" */ "./views/search.vue")
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
