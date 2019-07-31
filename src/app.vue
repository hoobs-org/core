<template>
    <div id="app" :class="client.theme || 'hoobs-light'" v-on:click="hide('homebridge')">
        <div class="header">
            <div class="title">
                <div class="logo">
                    <svg width="27" height="27" viewBox="0 0 263 265" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path class="header-logo-svg" d="M251.654 112.363C251.584 112.363 251.534 112.363 251.464 112.363L229.464 90.363C229.069 89.97 228.754 89.5027 228.54 88.9878C228.325 88.473 228.215 87.9207 228.214 87.363V36.613C228.206 31.4517 226.153 26.504 222.503 22.8544C218.853 19.2048 213.906 17.1509 208.744 17.143H195.004C189.841 17.1483 184.891 19.2009 181.239 22.8508C177.588 26.5007 175.532 31.4499 175.524 36.613V36.903L143.044 5.44298C139.358 1.91059 134.438 -0.0422705 129.333 0.000694207C124.227 0.0436589 119.341 2.07905 115.714 5.67298L5.71442 115.673C3.90298 117.481 2.46585 119.628 1.48529 121.991C0.504728 124.355 0 126.889 0 129.448C0 132.007 0.504728 134.541 1.48529 136.905C2.46585 139.268 3.90298 141.415 5.71442 143.223L16.1844 153.643C19.8237 157.268 24.7452 159.312 29.8818 159.333C35.0185 159.354 39.9562 157.349 43.6244 153.753L128.164 70.443C128.962 69.6516 130.041 69.2075 131.164 69.2075C132.288 69.2075 133.367 69.6516 134.164 70.443L216.994 153.283C217.783 154.082 218.226 155.16 218.226 156.283C218.226 157.406 217.783 158.484 216.994 159.283L206.814 169.463C206.015 170.252 204.937 170.694 203.814 170.694C202.691 170.694 201.614 170.252 200.814 169.463L142.654 113.103C138.969 109.547 134.036 107.58 128.915 107.625C123.795 107.67 118.897 109.723 115.274 113.343L59.4644 169.443C55.8304 173.098 53.7906 178.044 53.7906 183.198C53.7906 188.352 55.8304 193.298 59.4644 196.953L69.7944 207.283C73.4386 210.911 78.3677 212.954 83.51 212.967C88.6523 212.98 93.5918 210.963 97.2544 207.353L127.344 177.623C128.144 176.834 129.221 176.392 130.344 176.392C131.467 176.392 132.545 176.834 133.344 177.623L163.264 207.033C163.664 207.424 163.983 207.89 164.201 208.405C164.419 208.921 164.532 209.474 164.534 210.033C164.531 211.159 164.081 212.237 163.284 213.033L133.654 242.753C133.524 242.753 133.414 242.673 133.274 242.673C131.077 242.673 128.929 243.325 127.102 244.545C125.275 245.766 123.851 247.501 123.01 249.531C122.169 251.561 121.949 253.795 122.378 255.95C122.807 258.106 123.865 260.085 125.418 261.639C126.972 263.193 128.952 264.251 131.107 264.68C133.262 265.108 135.496 264.888 137.526 264.047C139.556 263.206 141.291 261.782 142.512 259.955C143.733 258.128 144.384 255.98 144.384 253.783C144.384 253.713 144.384 253.663 144.384 253.593L174.154 223.833C175.972 222.014 177.412 219.853 178.39 217.476C179.369 215.098 179.867 212.549 179.856 209.978C179.845 207.407 179.325 204.863 178.325 202.493C177.326 200.124 175.868 197.976 174.034 196.173L144.114 166.773C140.464 163.195 135.556 161.191 130.444 161.191C125.333 161.191 120.425 163.195 116.774 166.773L86.5844 196.543C85.7878 197.337 84.709 197.783 83.5844 197.783C82.4598 197.783 81.381 197.337 80.5844 196.543L70.2744 186.203C69.4854 185.404 69.043 184.326 69.043 183.203C69.043 182.08 69.4854 181.002 70.2744 180.203L126.124 124.103C126.913 123.301 127.987 122.845 129.112 122.833C130.237 122.822 131.32 123.257 132.124 124.043L190.274 180.543C193.956 184.085 198.877 186.046 203.985 186.009C209.094 185.972 213.985 183.938 217.614 180.343L227.804 170.153C231.45 166.498 233.497 161.546 233.497 156.383C233.497 151.22 231.45 146.268 227.804 142.613L144.934 59.743C141.295 56.116 136.372 54.0694 131.234 54.047C126.096 54.0245 121.156 56.0279 117.484 59.623L32.9444 142.903C32.1428 143.687 31.0659 144.126 29.9444 144.126C28.823 144.126 27.7461 143.687 26.9444 142.903L16.5144 132.443C15.7206 131.646 15.2748 130.568 15.2748 129.443C15.2748 128.318 15.7206 127.24 16.5144 126.443L126.514 16.443C127.306 15.6449 128.38 15.1918 129.504 15.1824C130.628 15.1731 131.71 15.6082 132.514 16.393L190.814 72.813V36.613C190.817 35.4866 191.266 34.4072 192.062 33.6107C192.859 32.8142 193.938 32.3656 195.064 32.363H208.804C209.932 32.3656 211.012 32.8139 211.81 33.6101C212.608 34.4063 213.059 35.4857 213.064 36.613V87.443C213.083 92.6034 215.13 97.5495 218.764 101.213L240.654 123.103C240.654 123.243 240.574 123.353 240.574 123.483C240.576 125.681 241.23 127.829 242.454 129.656C243.677 131.482 245.415 132.905 247.447 133.743C249.479 134.581 251.714 134.798 253.869 134.366C256.024 133.934 258.003 132.872 259.555 131.315C261.106 129.758 262.161 127.775 262.585 125.618C263.01 123.461 262.785 121.227 261.939 119.198C261.093 117.169 259.665 115.437 257.834 114.22C256.003 113.003 253.853 112.357 251.654 112.363Z" />
                    </svg>
                </div>
                <h1>{{ routeName() }}</h1>
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
                <homebridge-menu v-if="visible['homebridge']" />
            </div>
        </div>
    </div>
</template>

<script>
    import Menu from "@/components/homebridge-menu.vue";
    import Marquee from "@/components/loading-marquee.vue";
    import Plugins from "../etc/plugins.json";

    export default {
        components: {
            "homebridge-menu": Menu,
            "loading-marquee": Marquee
        },

        data() {
            return {
                loaded: false
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
                        return this.$t((this.client.theme || "hoobs-light").startsWith("hoobs") ? "hoobs" : "homebridge");

                    case "profile":
                        return `${(this.client.theme || "hoobs-light").startsWith("hoobs") && !title ? `${this.$t("hoobs")} | ` : ""}${this.$t("profile")}`;

                    case "status":
                        return `${(this.client.theme || "hoobs-light").startsWith("hoobs") && !title ? `${this.$t("hoobs")} | ` : ""}${this.$t("status")}`;

                    case "log":
                        return `${(this.client.theme || "hoobs-light").startsWith("hoobs") && !title ? `${this.$t("hoobs")} | ` : ""}${this.$t("log")}`;

                    case "users":
                        return `${(this.client.theme || "hoobs-light").startsWith("hoobs") && !title ? `${this.$t("hoobs")} | ` : ""}${this.$t("users")}`;

                    case "plugin":
                    case "plugins":
                    case "search":
                        return `${(this.client.theme || "hoobs-light").startsWith("hoobs") && !title ? `${this.$t("hoobs")} | ` : ""}${this.$t("plugins")}`;

                    case "config":
                        return `${(this.client.theme || "hoobs-light").startsWith("hoobs") && !title ? `${this.$t("hoobs")} | ` : ""}${this.$t("config")}`;

                    case "accessories":
                    case "layout":
                        return `${(this.client.theme || "hoobs-light").startsWith("hoobs") && !title ? `${this.$t("hoobs")} | ` : ""}${this.$t("accessories")}`;

                    default:
                        const plugin = this.plugins.filter(p => p.name === name);

                        if (plugin.length > 0) {
                            return `${(this.client.theme || "hoobs-light").startsWith("hoobs") && !title ? `${this.$t("hoobs")} | ` : ""}${this.$t(plugin[0].title) || ""}`;
                        }

                        return "";
                }
            }
        }
    };
</script>

<style>
    @font-face {
        font-family: "Material Icons";
        font-style: normal;
        font-weight: 400;
        src: local("Material Icons"), local("MaterialIcons-Regular"), url(./assets/material.woff) format("woff2");
    }

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
        box-shadow: 0 1px 1px 0 rgba(0, 0, 0, 0.14),
                    0 2px 1px -1px rgba(0, 0, 0, 0.12),
                    0 1px 3px 0 rgba(0, 0, 0, 0.2);
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
        font-family: "Avenir", Helvetica, Arial, sans-serif;
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
        box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.2),
                    0 4px 5px 0 rgba(0, 0, 0, 0.14),
                    0 1px 10px 0 rgba(0, 0, 0, 0.12);
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
        margin: 0 10px 0 0;
        user-select: none;
    }

    #app .header .header-logo-svg {
        fill: var(--primary-text);
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
        box-shadow: 0px 5px 5px -3px rgba(0, 0, 0, 0.2),
                    0px 8px 10px 1px rgba(0, 0, 0, 0.14),
                    0px 3px 14px 2px rgba(0, 0, 0, 0.12);
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
    }
</style>
