<template>
    <div id="app" :class="client.theme || 'hoobs-light'" v-on:click="hide('homebridge')">
        <div class="header">
            <div class="title">
                <div class="logo">
                    <svg v-if="(client.theme || 'hoobs-light').endsWith('dark')" width="27" height="27" viewBox="0 0 80 80.92" xmlns="http://www.w3.org/2000/svg">
                        <path class="header-logo-svg" d="M65.05,0H15A15.08,15.08,0,0,0,0,15.12V65.8A15.09,15.09,0,0,0,15,80.92h50.1A15.09,15.09,0,0,0,80,65.8V15.12A15.08,15.08,0,0,0,65.05,0Zm2,39.07a2.09,2.09,0,0,1-1.79,1.71,1.76,1.76,0,0,1-2.09-1c-.83-2.21-2.63-3.55-4.2-5.07a5.66,5.66,0,0,1-2-4.81c.09-1.24,0-2.49,0-3.73h0c0-1.66,0-3.32,0-5,0-1.5-.94-1.78-2.15-1.76s-2.64-.21-2.72,1.65c-.07,1.5,0,3-.06,4.51,0,.5.25,1.2-.23,1.44s-.83-.45-1.18-.78c-3.29-3.11-6.59-6.22-9.83-9.39-1-1-1.74-1-2.71,0Q27.51,27.79,16.75,38.57c-.94.94-1.07,1.7,0,2.57.24.19.44.44.66.65,1.41,1.4,1.62,1.36,3.13,0,4.68-4.35,9.08-9,13.63-13.48,1-.94,2-1.81,2.93-2.74a3.81,3.81,0,0,1,5.74,0c2,1.9,3.84,3.89,5.78,5.82C52.18,34.88,55.8,38.4,59.37,42c2.35,2.36,2.31,4.44,0,6.83-3.65,3.72-5.08,3.7-8.77,0-3.21-3.2-6.5-6.32-9.7-9.53-1-1-1.76-.91-2.71.06Q33,44.63,27.81,49.8c-.91.9-.91,1.65,0,2.48a13.05,13.05,0,0,1,1,1,1.48,1.48,0,0,0,2.48,0c1.82-1.83,3.7-3.59,5.55-5.38a4,4,0,0,1,5.9-.13q3.09,2.91,6.07,6a4,4,0,0,1,0,5.72c-1.36,1.47-2.82,2.87-4.23,4.3a8.46,8.46,0,0,0-2.22,2.92,1.84,1.84,0,0,1-2.1,1.23,2,2,0,0,1-1.84-1.63,2.09,2.09,0,0,1,1.09-2.5c2.93-1.4,4.61-4.19,6.94-6.26a1.08,1.08,0,0,0,0-1.75l-5.57-5.59c-.75-.75-1.43-.54-2.13.14-1.84,1.8-3.71,3.57-5.56,5.37a4,4,0,0,1-5.9.26c-.51-.43-1-.92-1.44-1.4-2.38-2.44-2.38-4.57,0-7Q31,42.31,36.22,37c2.22-2.23,4.32-2.25,6.57-.06l10.6,10.39c1.5,1.46,1.67,1.44,3.45-.37,1.51-1.54,1.53-1.76,0-3.25-5.21-5.21-10.46-10.39-15.65-15.62-.88-.89-1.58-.95-2.46-.07-2.41,2.4-4.84,4.77-7.27,7.16q-4.8,4.71-9.59,9.42a3.94,3.94,0,0,1-5.79.13c-3.81-3.46-4.75-5.29-.33-9.57,6.88-6.67,13.53-13.58,20.29-20.39,2.41-2.43,4.49-2.44,6.91-.07,1.65,1.62,3.35,3.2,5,4.81.68.66,1.15,1.07,1.51-.3a3.4,3.4,0,0,1,3-2.57,14.24,14.24,0,0,1,1.83-.21c4.28-.12,5.77,1.36,5.78,5.68,0,2.6,0,5.19,0,7.78a3.09,3.09,0,0,0,1.06,2.61c1.66,1.44,2.86,3.38,5,4.27A1.88,1.88,0,0,1,67.1,39.07Z" />
                    </svg>
                    <svg v-else width="27" height="27" viewBox="0 0 80 80.92" xmlns="http://www.w3.org/2000/svg">
                        <rect class="header-logo-svg-stroke" x="1.25" y="1.25" width="77" height="78" rx="16.3" />
                        <path class="header-logo-svg" d="M17,44.62a3.78,3.78,0,0,0,5.56-.13q4.63-4.53,9.24-9.08c2.33-2.3,4.68-4.59,7-6.91.85-.84,1.52-.78,2.37.08,5,5,10,10,15.07,15.05,1.44,1.43,1.42,1.65,0,3.13-1.71,1.75-1.88,1.77-3.32.36q-5.1-5-10.21-10c-2.16-2.11-4.18-2.1-6.32,0q-5,5.07-10.06,10.17c-2.28,2.32-2.27,4.37,0,6.72.45.46.89.94,1.38,1.35a3.87,3.87,0,0,0,5.68-.25C35.16,53.42,37,51.71,38.73,50c.67-.66,1.33-.85,2.05-.13,1.79,1.79,3.57,3.59,5.36,5.39a1,1,0,0,1,0,1.69c-2.24,2-3.86,4.68-6.68,6a2,2,0,0,0-1,2.41,1.89,1.89,0,0,0,1.76,1.56,1.78,1.78,0,0,0,2-1.17,8,8,0,0,1,2.13-2.82c1.36-1.38,2.76-2.72,4.08-4.14a3.85,3.85,0,0,0,0-5.52c-1.92-2-3.86-3.86-5.85-5.74a3.8,3.8,0,0,0-5.67.13c-1.78,1.73-3.59,3.43-5.34,5.18-.86.86-1.59.87-2.39,0-.29-.33-.61-.65-.93-1-.87-.81-.87-1.53,0-2.39q5-5,10-10.07c.91-.93,1.64-1,2.61-.06,3.08,3.09,6.25,6.1,9.34,9.19,3.55,3.54,4.92,3.55,8.44,0,2.26-2.3,2.29-4.31,0-6.58-3.44-3.44-6.92-6.84-10.36-10.27-1.87-1.86-3.68-3.78-5.56-5.61a3.66,3.66,0,0,0-5.53,0c-.93.89-1.91,1.74-2.82,2.64-4.38,4.33-8.62,8.8-13.12,13-1.45,1.34-1.66,1.38-3,0-.21-.21-.4-.44-.63-.63-1-.83-.88-1.56,0-2.47Q28,28.25,38.26,17.78a1.55,1.55,0,0,1,2.61,0c3.12,3,6.29,6,9.46,9.06.33.31.6,1,1.13.75s.22-.91.23-1.39c0-1.45,0-2.9.05-4.35.08-1.79,1.43-1.56,2.62-1.59s2.07.24,2.07,1.69c0,1.6,0,3.2,0,4.8h0c0,1.2.08,2.4,0,3.6A5.48,5.48,0,0,0,58.3,35c1.51,1.46,3.25,2.75,4.05,4.89a1.69,1.69,0,0,0,2,.91,2,2,0,0,0,1.72-1.65,1.81,1.81,0,0,0-.92-2.18c-2.07-.86-3.23-2.73-4.82-4.11a3,3,0,0,1-1-2.52c0-2.5,0-5,0-7.5,0-4.17-1.45-5.59-5.56-5.48a13,13,0,0,0-1.76.21A3.29,3.29,0,0,0,49.14,20c-.35,1.32-.8.93-1.45.3-1.6-1.56-3.23-3.08-4.82-4.64-2.33-2.28-4.34-2.28-6.66.06C29.71,22.3,23.31,29,16.69,35.39,12.44,39.52,13.34,41.28,17,44.62Z" />
                    </svg>
                </div>
                <h1 class="title-logo-text">{{ $t("hoobs") }}</h1>
                <h1 v-html="routeName()"></h1>
            </div>
            <div v-if="user" v-on:click.stop="toggle('homebridge')" class="icon homebridge">more_vert</div>
            <div v-if="locked" class="service-loader">
                <loading-marquee :height="2" color="--title-text-dim" background="--title-text" />
            </div>
        </div>
        <div v-if="loaded" class="layout">
            <div v-if="user" class="nav">
                <div class="routes">
                    <div class="action-link" v-on:click.stop="toggle('nav')">
                        <span v-if="visible['nav']" class="icon">chevron_left</span>
                        <span v-else class="icon">chevron_right</span>
                    </div>
                    <div class="action-seperator">
                        <div></div>
                    </div>
                    <router-link :to="defaultRoute === 'status' ? '/' : '/status'" @click.native="hide('nav')">
                        <span v-bind:class="activeIcon('status')">settings_power</span>
                        <span v-if="visible['nav']" v-bind:class="activeLink('status')">{{ routeName('status') }}</span>
                    </router-link>
                    <router-link :to="defaultRoute === 'accessories' ? '/' : '/accessories'" @click.native="hide('nav')">
                        <span v-bind:class="activeIcon('accessories', 'layout')">highlight</span>
                        <span v-if="visible['nav']" v-bind:class="activeLink('accessories', 'layout')">{{ routeName('accessories') }}</span>
                    </router-link>
                    <router-link v-if="user.admin" :to="defaultRoute === 'log' ? '/' : '/log'" @click.native="hide('nav')">
                        <span v-bind:class="activeIcon('log')">subject</span>
                        <span v-if="visible['nav']" v-bind:class="activeLink('log')">{{ routeName('log') }}</span>
                    </router-link>
                    <router-link v-if="user.admin" to="/users" @click.native="hide('nav')">
                        <span v-bind:class="activeIcon('users')">people</span>
                        <span v-if="visible['nav']" v-bind:class="activeLink('users')">{{ routeName('users') }}</span>
                    </router-link>
                    <router-link v-if="user.admin" :to="defaultRoute === 'plugins' ? '/' : '/plugins'" @click.native="hide('nav')">
                        <span v-bind:class="activeIcon('plugins', 'search')">extension</span>
                        <span v-if="visible['nav']" v-bind:class="activeLink('plugins', 'search')">{{ routeName('plugins') }}</span>
                    </router-link>
                    <router-link v-for="(link, index) in links" :key="index" :to="defaultRoute === link.route ? '/' : `/${link.route}`" @click.native="hide('nav')">
                        <span v-bind:class="activeIcon(link.name)" v-html="pluginIcon(link)"></span>
                        <span v-if="visible['nav']" v-bind:class="activeLink(link.name)">{{ routeName(link.name) }}</span>
                    </router-link>
                </div>
                <div class="routes">
                    <router-link v-if="user.admin" to="/config" @click.native="hide('nav')">
                        <span v-bind:class="activeIcon('config')">settings</span>
                    </router-link>
                </div>
            </div>
            <div class="content">
                <router-view />
                <homebridge-menu v-if="visible['homebridge']" :about="showAbout" />
            </div>
        </div>
        <modal-dialog v-if="about" width="550px" :ok="closeAbout">
            <img class="about-logo" src="./assets/logo.png" />
            <div class="about-seperator"></div>
            <div class="about-title">
                <div class="about-version">
                    <b>HOOBS Core</b><br>
                    Version 3.0.0
                </div>
                <div class="button">{{ $t("check_for_updates") }}</div>
            </div>
            <br>
            <a href="https://hoobs.org" target="_blank">HOOBS.org</a><br>
            <br>
            Copyright &copy; {{ new Date().getFullYear() }} HOOBS.org. All rights reserved.
        </modal-dialog>
    </div>
</template>

<script>
    import ModalDialog from "@/components/modal-dialog.vue";
    import Menu from "@/components/homebridge-menu.vue";
    import Marquee from "@/components/loading-marquee.vue";
    import Plugins from "../etc/plugins.json";

    export default {
        components: {
            "modal-dialog": ModalDialog,
            "homebridge-menu": Menu,
            "loading-marquee": Marquee
        },

        data() {
            return {
                loaded: false,
                about: false
            }
        },

        computed: {
            visible() {
                return this.$store.state.menus;
            },

            locked() {
                return this.$store.state.locked;
            },

            plugins() {
                return Plugins;
            },

            links() {
                return Plugins.filter(p => p.plugin_icon && p.route);
            },

            defaultRoute() {
                if (!this.user.admin && (this.client.default_route === "log" || this.client.default_route === "plugins")) {
                    return "status";
                }

                return this.client.default_route || "status";
            },

            user() {
                return this.$store.state.user;
            }
        },

        mounted() {
            document.body.addEventListener("error", (event) => {
                if (event.target.tagName === "IMG") {
                    event.target.parentNode.removeChild(event.target);
                }
            }, true);

            this.loaded = true;
        },

        updated() {
            this.loaded = true;
        },

        methods: {
            showAbout() {
                this.about = true;
            },

            closeAbout() {
                this.about = false;
            },

            hide(menu) {
                this.$store.commit("hide", menu);
            },

            toggle(menu) {
                this.$store.commit("toggle", menu);
            },

            activeLink(...controller) {
                if (controller.filter(r => (this.$router.currentRoute || {}).name === r).length > 0) {
                    return "route-link route-link-on";
                }

                return "route-link";
            },

            activeIcon(...controller) {
                if (controller.filter(r => (this.$router.currentRoute || {}).name === r).length > 0) {
                    return "icon icon-on";
                }

                return "icon";
            },

            pluginIcon(data) {
                switch (data.plugin_icon.type) {
                    case "material":
                        return data.plugin_icon.name || "power";

                    case "svg":
                        if (!data.plugin_icon.encoded || data.plugin_icon.encoded === "") {
                            data.plugin_icon.encoded
                        }

                        try {
                            return atob(data.plugin_icon.encoded);
                        } catch {
                            return "power";
                        }
                }

                return "power";
            },

            routeName(name) {
                const title = name !== undefined;

                name = name || this.$router.currentRoute.name;

                switch (name) {
                    case "login":
                        return "";

                    case "profile":
                        return `${!title ? " | " : ""}${this.$t("profile")}`;

                    case "status":
                        return `${!title ? " | " : ""}${this.$t("status")}`;

                    case "log":
                        return `${!title ? " | " : ""}${this.$t("log")}`;

                    case "users":
                        return `${!title ? " | " : ""}${this.$t("users")}`;

                    case "plugin":
                    case "plugins":
                    case "search":
                        return `${!title ? " | " : ""}${this.$t("plugins")}`;

                    case "config":
                        return `${!title ? " | " : ""}${this.$t("config")}`;

                    case "accessories":
                    case "layout":
                        return `${!title ? " | " : ""}${this.$t("accessories")}`;

                    default:
                        const plugin = this.plugins.filter(p => p.name === name);

                        if (plugin.length > 0) {
                            return `${!title ? " | " : ""}${this.$t(plugin[0].title) || ""}`;
                        }

                        return "";
                }
            }
        }
    };
</script>

<style>
    @font-face {
        font-family: "Montserrat";
        font-style: normal;
        font-weight: 400;
        font-display: swap;
        src: local("Montserrat Regular"), local("Montserrat-Regular"), url(./assets/montserrat.woff) format("woff2");
        unicode-range: U+0460-052F, U+1C80-1C88, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F;
    }

    @font-face {
        font-family: "Montserrat Black";
        font-style: normal;
        font-weight: 900;
        font-display: swap;
        src: local("Montserrat Black"), local("Montserrat-Black"), url(./assets/montserrat-black.woff) format("woff2");
        unicode-range: U+0460-052F, U+1C80-1C88, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F;
    }

    @font-face {
        font-family: "Scancardium";
        font-weight: normal;
        font-style: normal;
        src: url(./assets/scancardium.woff) format("woff2");
    }

    @font-face {
        font-family: "Material Icons";
        font-style: normal;
        font-weight: 400;
        src: local("Material Icons"), local("MaterialIcons-Regular"), url(./assets/material.woff) format("woff2");
    }
</style>

<style>
    html,
    body {
        margin: 0;
        padding: 0;
        height: 100%;
        overflow: hidden;
    }

    .service-loader {
        width: 100%;
        height: 2px;
        position: absolute;
        top: 0;
        left: 0;
    }

    .button,
    .button:link,
    .button:active,
    .button:visited {
        background: var(--button);
        color: var(--button-text) !important;
        text-decoration: none !important;
        display: inline-block;
        border: 1px var(--border) solid;
        border-radius: 3px;
        padding: 10px;
        cursor: pointer;
        user-select: none;
        margin: 0 10px 0 0;
        white-space: pre;
    }

    .button-primary,
    .button-primary:link,
    .button-primary:active,
    .button-primary:visited {
        background: var(--button-primary);
        color: var(--button-primary-text) !important;
        border: 1px var(--primary) solid;
    }

    .button-warning,
    .button-warning:link,
    .button-warning:active,
    .button-warning:visited {
        background: var(--warning);
        color: var(--warning-text) !important;
        border: 1px var(--warning) solid;
    }

    .button:hover {
        box-shadow: var(--elevation-small);
    }

    .icon {
        font-family: "Material Icons";
        font-weight: normal;
        font-style: normal;
        font-size: 24px;
        line-height: 1;
        letter-spacing: normal;
        text-transform: none;
        display: inline-block;
        white-space: nowrap;
        word-wrap: normal;
        direction: ltr;
        font-feature-settings: "liga";
        -webkit-font-smoothing: antialiased;
    }

    #app {
        margin: 0;
        padding: 0;
        height: 100%;
        background: var(--background);
        font-family: "Montserrat", sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        color: var(--text);
        display: flex;
        flex-direction: column;
    }

    #app a,
    #app a:link,
    #app a:active,
    #app a:visited {
        color: var(--link-text);
        text-decoration: none;
    }

    #app a:hover {
        text-decoration: underline;
    }

    #app .header {
        height: 57px;
        margin: 0 -10px;
        padding: 0 20px 0 30px;
        background: var(--primary);
        box-shadow: var(--elevation-large);
        display: flex;
        align-content: center;
        align-items: center;
        justify-content: space-between;
        user-select: none;
        z-index: 200;
    }

    #app .header .title {
        display: flex;
        align-content: center;
        align-items: center;
        user-select: none;
    }

    #app .header .logo {
        width: 27px;
        height: 27px;
        margin: 0 5px 0 0;
        user-select: none;
    }

    #app .header .header-logo-svg {
        fill: var(--logo-color);
    }

    #app .header .header-logo-svg-stroke {
        fill: none;
        stroke: var(--logo-color);
        stroke-miterlimit: 10;
        stroke-width: 2.5px;
    }

    #app .header h1 {
        margin: 0;
        padding: 0;
        line-height: normal;
        color: var(--primary-text);
        font-size: 1.2rem;
        font-weight: normal;
        cursor: default;
        user-select: none;
    }

    #app .header .title-logo-text {
        font-weight: bold;
        font-family: "Montserrat Black", sans-serif;
        font-size: 24px;
        margin: 0 7px 0 0;
    }

    #app .header .homebridge {
        width: 32px;
        height: 32px;
        padding: 4px 0;
        box-sizing: border-box;
        border-radius: 16px;
        color: var(--primary-text);
        text-align: center;
        cursor: pointer;
        user-select: none;
        opacity: 0.9;
    }

    #app .header .homebridge:hover {
        background: var(--primary-dark);
    }

    #app .header .service-button:hover {
        opacity: 1;
    }

    #app .about-logo {
        width: 250px;
    }

    #app .about-seperator {
        height: 1px;
        background: #e5e5e5;
        margin: 10px 0;
    }

    #app .about-title {
        display: flex;
        margin: 0 -10px 0 0;
    }

    #app .about-version {
        flex: 1;
    }

    #app .layout {
        flex: 1;
        display: flex;
        overflow: hidden;
        flex-direction: row;
    }

    #app .nav {
        min-width: 57px;
        padding: 0 0 15px 0;
        background: var(--nav-background);
        box-shadow: var(--elevation-large);
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        user-select: none;
        z-index: 100;
    }

    #app .nav .routes {
        min-width: 57px;
        display: flex;
        flex-direction: column;
        align-content: center;
        align-items: center;
    }

    #app .nav .action-seperator {
        width: 100%;
        height: 1px;
        margin: 10px 0 0 0;
        padding: 0 17px;
        box-sizing: border-box;
    }

    #app .nav .action-seperator div {
        background: var(--nav-lignt);
        height: 1px;
    }

    #app .nav a,
    #app .nav a:link,
    #app .nav a:active,
    #app .nav a:visited,
    #app .nav .action-link {
        color: var(--nav-text);
        text-decoration: none;
        margin-top: 15px;
        width: 100%;
        text-align: left;
        display: flex;
        align-items: center;
        align-content: center;
        justify-content: flex-start;
        cursor: pointer;
    }

    #app .nav a:hover,
    #app .nav .action-link:hover {
        color: var(--nav-text-light) !important;
        text-decoration: none;
    }

    #app .nav .route-link {
        font-size: 17px;
        margin: 0 24px 0 -6px;
    }

    #app .nav .icon {
        margin: 0 16px;
    }

    #app .nav .route-link-on,
    #app .nav .icon-on,
    #app .nav .route-link-on:hover,
    #app .nav .icon-on:hover {
        color: var(--title-text) !important;
    }

    #app .nav .icon svg {
        width: 24px;
        height: 24px;
    }

    #app .content {
        flex: 1;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        font-size: 12pt;
    }
</style>
