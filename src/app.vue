<template>
    <div id="app" :class="$theme.name" v-on:click="hide('service', 'instance')">
        <div class="header">
            <div class="title">
                <div class="logo" v-html="$theme.logo.title"></div>
                <h1 v-if="$theme.logo.text" class="title-logo-text">HOOBS</h1>
                <h1 class="mobile-hide" v-html="routeName()"></h1>
            </div>
            <div v-if="user && instances.length > 1" class="instance" v-on:click.stop="toggle('instance')">
                {{ $bridge.name }}
                <span class="icon">arrow_drop_down</span>
            </div>
            <div v-if="user" v-on:click.stop="toggle('service')" class="icon service">more_vert</div>
            <div v-if="locked" class="service-loader">
                <loading-marquee :height="2" color="--title-text-dim" background="--title-text" />
            </div>
        </div>
        <div v-if="loaded" class="layout">
            <div v-if="!$cluster && user" class="nav">
                <div class="routes">
                    <div class="action-link mobile-hide" v-on:click.stop="toggle('nav')">
                        <span v-if="visible['nav']" class="icon">chevron_left</span>
                        <span v-else class="icon">chevron_right</span>
                    </div>
                    <div class="action-seperator mobile-hide">
                        <div></div>
                    </div>
                    <router-link :to="defaultRoute === 'status' ? '/' : '/status'" @click.native="hide('nav')">
                        <span v-bind:class="activeIcon('status')">dashboard</span>
                        <span v-if="visible['nav']" v-bind:class="activeLink('status')">{{ routeName('status') }}</span>
                    </router-link>
                    <router-link :to="defaultRoute === 'accessories' ? '/' : '/accessories'" @click.native="hide('nav')">
                        <span v-bind:class="activeIcon('accessories', 'layout')">highlight</span>
                        <span v-if="visible['nav']" v-bind:class="activeLink('accessories', 'layout')">{{ routeName('accessories') }}</span>
                    </router-link>
                    <router-link :to="defaultRoute === 'log' ? '/' : '/log'" @click.native="hide('nav')">
                        <span v-bind:class="activeIcon('log')">subject</span>
                        <span v-if="visible['nav']" v-bind:class="activeLink('log')">{{ routeName('log') }}</span>
                    </router-link>
                    <router-link to="/users" @click.native="hide('nav')" class="mobile-hide">
                        <span v-bind:class="activeIcon('users')">people</span>
                        <span v-if="visible['nav']" v-bind:class="activeLink('users')">{{ routeName('users') }}</span>
                    </router-link>
                    <router-link :to="defaultRoute === 'plugins' ? '/' : '/plugins'" @click.native="hide('nav')" class="mobile-hide">
                        <span v-bind:class="activeIcon('plugins', 'plugin', 'search')">extension</span>
                        <span v-if="visible['nav']" v-bind:class="activeLink('plugins', 'plugin', 'search')">{{ routeName('plugins') }}</span>
                    </router-link>
                    <router-link v-if="screen.width <= 815" to="/config/interface" @click.native="hide('nav')">
                        <span v-bind:class="activeIcon('config')">settings</span>
                    </router-link>
                </div>
                <div class="routes mobile-hide">
                    <router-link to="/config/interface" @click.native="hide('nav')">
                        <span v-bind:class="activeIcon('config')">settings</span>
                    </router-link>
                </div>
            </div>
            <div class="content">
                <router-view />
                <service-menu v-if="visible['service']" :about="showAbout" :widgets="showWidgets" />
                <instance-menu v-if="visible['instance']" />
            </div>
        </div>
        <modal-dialog v-if="about" width="550px" :donate="donate" :ok="closeAbout">
            <div v-html="$theme.logo.about"></div>
            <div class="about-seperator"></div>
            <div class="about-title">
                <div class="about-version">
                    <b>HOOBS Core</b><br>
                    Version {{ status["hoobs_version"] }}
                </div>
                <div class="button" v-on:click="checkUpdates()">{{ $t("check_for_updates") }}</div>
            </div>
            <br>
            <a v-if="$theme.homepage" :href="$theme.homepage.url" target="_blank">{{ $theme.homepage.name }}</a><br>
            <br>
            Copyright &copy; {{ new Date().getFullYear() }} HOOBS. All rights reserved.
        </modal-dialog>
        <modal-dialog v-if="widgets" width="350px" :cancel="closeWidgets" :ok="saveWidgets">
            <div v-for="(item, aidx) in available" :key="aidx" class="available-widget">
                <checkbox :id="`widget-${item}`" :value="item" v-model="selected"> <label :for="`widget-${item}`">{{ widgetTitle(item) }}</label></checkbox>
            </div>
        </modal-dialog>
        <div class="notifications">
            <notification v-for="(notification, nidx) in notifications" :key="nidx" :value="notification"></notification>
        </div>
    </div>
</template>

<script>
    import Checkbox from "vue-material-checkbox";

    import Loader from "./loader";

    import ModalDialog from "@/components/modal-dialog.vue";
    import ServiceMenu from "@/components/service-menu.vue";
    import InstanceMenu from "@/components/instance-menu.vue";
    import Notification from "@/components/notification.vue";
    import Marquee from "@/components/loading-marquee.vue";

    export default {
        components: {
            "checkbox": Checkbox,
            "modal-dialog": ModalDialog,
            "service-menu": ServiceMenu,
            "instance-menu": InstanceMenu,
            "notification": Notification,
            "loading-marquee": Marquee
        },

        data() {
            return {
                status: null,
                loaded: false,
                about: false,
                widgets: false,
                instances: [],
                socket: null,
                loader: null,
                available: [
                    "setup-pin",
                    "system-load",
                    "weather",
                    "favorite-accessories",
                    "system-info"
                ],
                selected: []
            }
        },

        computed: {
            notifications() {
                return this.$store.state.notifications;
            },

            visible() {
                return this.$store.state.menus;
            },

            locked() {
                return this.$store.state.locked;
            },

            defaultRoute() {
                return this.$client.default_route || "status";
            },

            user() {
                return this.$store.state.user;
            },

            screen() {
                return this.$store.state.screen;
            },

            refresh() {
                return this.$store.state.refresh;
            }
        },

        async mounted() {
            this.loader = Loader(this.$theme.logo.loader, this.$theme.loader.foreground, this.$theme.loader.background);

            try {
                this.$store.commit("load", JSON.parse(atob(this.$cookie("notifications"))));
            } catch {
                this.$store.commit("load", []);
            }

            Chart.defaults.global.defaultFontColor = this.$theme.charts.foreground;

            if (!this.$cluster) {
                this.status = await this.api.get("/status");
            }

            this.instances = await this.$instances();
            this.loaded = true;
        },

        created() {
            window.addEventListener("resize", this.resize);

            document.body.addEventListener("error", (event) => {
                if (event.target.tagName === "IMG") {
                    event.target.parentNode.removeChild(event.target);
                }
            }, true);

            this.$store.subscribe(async (mutation, state) => {
                switch (mutation.type) {
                    case "reboot":
                        window.location.reload();
                        break;

                    case "push":
                    case "dismiss":
                        this.$cookie("notifications", btoa(JSON.stringify(state.notifications)), this.$client.inactive_logoff || 30);
                        break;
                }
            });

            if (!this.$cluster) {
                this.connect();
            }

            this.resize();
        },

        destroyed() {
            window.removeEventListener("resize", this.resize);

            this.socket.close();
            this.loaded = false;
        },

        updated() {
            this.loaded = true;
        },

        methods: {
            resize() {
                this.$store.commit("resize", {
                    width: window.innerWidth,
                    height: window.innerHeight
                });
            },

            connect() {
                let url = this.$instance;

                if (url === "") {
                    const uri = window.location.href.split("/");

                    url = `${uri[0]}//${uri[2]}`;
                }

                url = url.replace("http://", "ws://");
                url = url.replace("https://", "wss://");

                this.socket = new WebSocket(`${url}${url.endsWith("/") ? "monitor" : "/monitor"}?a=${this.$cookie("token") || ""}&t=${new Date().getTime()}`);

                this.socket.onmessage = (message) => {
                    message = JSON.parse(message.data);

                    switch (message.event) {
                        case "log":
                            this.$store.commit("log", message.data);
                            break;

                        case "push":
                            this.$store.commit("push", message.data);
                            break;
                        
                        case "monitor":
                            this.$store.commit("monitor", message.data);
                            break;

                        case "update":
                            const now = new Date();

                            if (!this.refresh || now.getTime() - this.refresh.getTime() > 1000) {
                                this.$store.commit("update");
                            }

                            break;
                    }
                };

                this.socket.onopen = () => {
                    if (this.loader.loading) {
                        this.loader.load();
                    }

                    this.socket.send("{HISTORY}");
                };

                this.socket.onclose = () => {
                    setTimeout(() => {
                        this.connect();
                    }, 3000);
                };

                this.socket.onerror = () => {
                    fetch("/").then((response) => {
                        if (!response.ok) {
                            this.loader.write();
                        }
                    }).catch(() => {
                        this.loader.write();
                    });

                    this.socket.close();
                };
            },

            showAbout() {
                this.about = true;
            },

            closeAbout() {
                this.about = false;
            },

            widgetTitle(item) {
                switch (item) {
                    case "setup-pin":
                        return this.$t("home_setup_pin");

                    case "system-load":
                        return this.$t("status");

                    case "weather":
                        return this.$t("forecast");

                    case "favorite-accessories":
                        return this.$t("favorite_accessories");

                    case "system-info":
                        return this.$t("system_info");
                }

                return item;
            },

            widgetData(item) {
                switch (item) {
                    case "setup-pin":
                        return {
                            "x": 0,
                            "y": 0,
                            "w": 2,
                            "h": 7,
                            "i": "0",
                            "component": "setup-pin"
                        };

                    case "system-load":
                        return {
                            "x": 2,
                            "y": 0,
                            "w": 10,
                            "h": 7,
                            "i": "1",
                            "component": "system-load"
                        };

                    case "weather":
                        return {
                            "x": 0,
                            "y": 7,
                            "w": 7,
                            "h": 7,
                            "i": "2",
                            "component": "weather",
                            "units": "imperial"
                        };

                    case "favorite-accessories":
                        return {
                            "x": 0,
                            "y": 14,
                            "w": 7,
                            "h": 8,
                            "i": "3",
                            "component": "favorite-accessories"
                        };

                    case "system-info":
                        return {
                            "x": 7,
                            "y": 7,
                            "w": 5,
                            "h": 15,
                            "i": "4",
                            "component": "system-info"
                        };
                }

                return item;
            },

            async showWidgets() {
                const data = await this.api.get("/layout/dashboard");

                this.selected = [];

                for (let i = 0; i < data.length; i++) {
                    this.selected.push(data[i].component);
                }

                this.widgets = true;
            },

            async saveWidgets() {
                const data = await this.api.get("/layout/dashboard");
                const items = [];

                this.widgets = false;

                for (let i = 0; i < this.available.length; i++) {
                    const item = this.available[i];

                    if (this.selected.indexOf(item) >= 0) {
                        const index = data.findIndex(c => c.component === item);

                        if (index >= 0) {
                            items.push(data[index]);
                        } else {
                            items.push(this.widgetData(item));
                        }
                    }
                }

                await this.api.post("/layout/dashboard", items);

                window.location.reload();
            },

            closeWidgets() {
                this.widgets = false;
                this.selected = [];
            },

            donate() {
                window.open(this.$theme.donate);
            },

            checkUpdates() {
                this.closeAbout();

                this.$router.push({
                    path: "/system/software"
                });
            },

            hide(...menu) {
                for (let i = 0; i < menu.length; i++) {
                    this.$store.commit("hide", menu[i]);
                }
            },

            toggle(menu) {
                switch (menu) {
                    case "instance":
                        this.hide("service");
                        break;

                    case "service":
                        this.hide("instance");
                        break;
                    
                    default:
                        this.hide("service", "instance");
                        break;
                }

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

                    case "help":
                        return `${!title ? " | " : ""}${this.$t("help")}`;

                    case "system":
                    case "terminal":
                        return `${!title ? " | " : ""}${this.$t("system")}`;

                    case "profile":
                        return `${!title ? " | " : ""}${this.$t("profile")}`;

                    case "status":
                        return `${!title ? " | " : ""}${this.$t("dashboard")}`;

                    case "log":
                        return `${!title ? " | " : ""}${this.$t("log")}`;

                    case "users":
                        return `${!title ? " | " : ""}${this.$t("users")}`;

                    case "plugin":
                    case "plugins":
                    case "search":
                    case "browse":
                        return `${!title ? " | " : ""}${this.$t("plugins")}`;

                    case "config":
                    case "config-advanced":
                        return `${!title ? " | " : ""}${this.$t("config")}`;

                    case "accessories":
                    case "layout":
                        return `${!title ? " | " : ""}${this.$t("accessories")}`;

                    default:
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
        src: local("Montserrat Regular"),
             local("Montserrat-Regular"),
             url(./assets/montserrat.woff2) format("woff2");
        unicode-range: U+0460-052F, U+1C80-1C88, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F;
    }

    @font-face {
        font-family: "Montserrat Black";
        font-style: normal;
        font-weight: 900;
        font-display: swap;
        src: local("Montserrat Black"),
             local("Montserrat-Black"),
             url(./assets/montserrat-black.woff2) format("woff2");
        unicode-range: U+0460-052F, U+1C80-1C88, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F;
    }
      
    @font-face {
        font-family: "Material Icons";
        font-style: normal;
        font-weight: 400;
        src: url(./assets/material.eot);
        src: local("Material Icons"),
             local("MaterialIcons-Regular"),
             url(./assets/material.woff2) format('woff2'),
             url(./assets/material.woff) format('woff'),
             url(./assets/material.ttf) format('truetype');
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
        top: 55px;
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
        border: 1px var(--button-border) solid;
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

    .disabled {
        opacity: 0.5;
    }

    ::placeholder {
        color: var(--text-light);
    }

    .vue-grid-placeholder {
        background: var(--button-primary) !important;
    }

    .hidden-submit {
        width: 1px;
        height: 1px;
        overflow: hidden;
        opacity: 0;
        position: absolute;
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

    .m-chckbox--container {
        margin: 0 !important;
        height: 28px !important;
        min-height: 28px !important;
    }

    .m-chckbox--container label {
        user-select: none;
    }

    .m-chckbox--container .m-chckbox--group {
        background-color: var(--input-background);
        border: 1px var(--border) solid;
    }

    .m-chckbox--container.active .m-chckbox--group {
        background-color: var(--title-text) !important;
        border: 1px var(--title-text) solid !important;
    }

    .m-chckbox--ripple {
        display: none !important;
    }

    .m-chckbox--label {
        padding-left: 7px !important;
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
        flex: 1;
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

    #app .header .service {
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

    #app .header .service:hover {
        background: var(--primary-dark);
    }

    #app .header .service-button:hover {
        opacity: 1;
    }

    #app .header .instance {
        display: flex;
        align-content: center;
        align-items: center;
        margin: 0 10px 0 0;
        color: var(--primary-text);
        cursor: pointer;
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

    #app .available-widget {
        display: flex;
        align-content: center;
        align-items: center;
        margin: 7px 0;
        font-size: 14px;
    }

    #app .available-widget input {
        margin: 0 7px 0 0;
    }

    #app .available-widget .m-chckbox--container .m-chckbox--group {
        background-color: #fff;
        border: 1px #e5e5e5 solid;
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
        background: var(--nav-light);
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

    #app .notifications {
        width: 350px;
        position: absolute;
        bottom: 20px;
        right: 20px;
        z-index: 200;
    }

    .mobile-show {
        display: none;
    }

    @media (min-width: 300px) and (max-width: 815px) {
        .mobile-hide {
            display: none !important;
        }

        .mobile-show {
            display: unset;
        }

        #app .layout {
            overflow: auto;
        }

        #app .content {
            overflow: auto;
            padding: 0 0 57px 0;
        }

        #app .nav {
            height: 57px;
            width: 100%;
            flex-direction: row;
            justify-content: space-evenly;
            box-sizing: border-box;
            position: fixed;
            bottom: 0;
            left: 0;
            box-shadow: var(--elevation-bottom);
            z-index: 200;
        }

        #app .nav .routes {
            min-width: unset;
            flex: 1;
            flex-direction: row;
            align-content: center;
            align-items: center;
            justify-content: space-evenly;
        }

        #app .nav a,
        #app .nav a:link,
        #app .nav a:active,
        #app .nav a:visited,
        #app .nav .action-link {
            display: flex;
            justify-content: space-around;
        }

        #app .notifications {
            display: none !important;
        }
    }
</style>
