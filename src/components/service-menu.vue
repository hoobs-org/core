<template>
    <div v-if="!$cluster && (user || {}).admin" id="service-menu">
        <div v-if="user" class="profile">
            <span class="icon">account_circle</span>
            <div class="profile-details">
                <span class="sub-title">{{ $t("loged_in_as") }}</span>
                <span class="identity">{{ user.name || user.username }}</span>
            </div>
        </div>
        <router-link to="/profile" class="item">{{ $t("profile") }}</router-link>
        <div v-if="$router.currentRoute.name === 'status'" v-on:click="widgets" class="item mobile-hide">{{ $t("edit_dashboard") }}</div>
        <router-link v-if="$router.currentRoute.name === 'accessories'" to="/accessories/layout" class="item mobile-hide">{{ $t("edit_rooms") }}</router-link>
        <div class="item-seperator"></div>
        <div v-if="!locked && !running" v-on:click.stop="control('start')" class="item">{{ $t("start_service") }}</div>
        <div v-else class="item-disabled">{{ $t("start_service") }}</div>
        <div v-if="!locked && running" v-on:click.stop="control('stop')" class="item">{{ $t("stop_service") }}</div>
        <div v-else class="item-disabled">{{ $t("stop_service") }}</div>
        <div v-if="!locked && running" v-on:click.stop="control('restart')" class="item">{{ $t("restart_service") }}</div>
        <div v-else class="item-disabled">{{ $t("restart_service") }}</div>
        <div class="item-seperator"></div>
        <div v-if="!locked" v-on:click.stop="reboot()" class="item">{{ $t("reboot_device") }}</div>
        <div v-else class="item-disabled">{{ $t("reboot_device") }}</div>
        <div class="item-seperator"></div>
        <div class="item" v-on:click="about">{{ $t("about") }}</div>
        <router-link to="/config/interface" class="item">{{ $t("config") }}</router-link>
        <router-link to="/system/software" class="item">{{ $t("system") }}</router-link>
        <router-link to="/help" class="item">{{ $t("help") }}</router-link>
        <div class="item-seperator mobile-hide"></div>
        <router-link to="/system/terminal" class="item mobile-hide">{{ $t("terminal") }}</router-link>
        <div class="item-seperator"></div>
        <router-link to="/login" class="item">{{ $t("log_out") }}</router-link>
        <div class="button mobile-show menu-cancel">{{ $t("cancel") }}</div>
    </div>
    <div v-else-if="!$cluster" id="service-menu">
        <div class="profile">
            <span class="icon">account_circle</span>
            <div v-if="user" class="profile-details">
                <span class="sub-title">{{ $t("loged_in_as") }}</span>
                <span class="identity">{{ user.name || user.username }}</span>
            </div>
        </div>
        <router-link to="/profile" class="item">{{ $t("profile") }}</router-link>
        <div v-if="$router.currentRoute.name === 'status'" v-on:click="widgets" class="item mobile-hide">{{ $t("edit_dashboard") }}</div>
        <router-link v-if="$router.currentRoute.name === 'accessories'" to="/accessories/layout" class="item mobile-hide">{{ $t("edit_rooms") }}</router-link>
        <div class="item-seperator"></div>
        <div v-if="!locked && !running" v-on:click.stop="control('start')" class="item">{{ $t("start_service") }}</div>
        <div v-else class="item-disabled">{{ $t("start_service") }}</div>
        <div v-if="!locked && running" v-on:click.stop="control('stop')" class="item">{{ $t("stop_service") }}</div>
        <div v-else class="item-disabled">{{ $t("stop_service") }}</div>
        <div v-if="!locked && running" v-on:click.stop="control('restart')" class="item">{{ $t("restart_service") }}</div>
        <div v-else class="item-disabled">{{ $t("restart_service") }}</div>
        <div class="item-seperator"></div>
        <div v-if="!locked" v-on:click.stop="reboot()" class="item">{{ $t("reboot_device") }}</div>
        <div v-else class="item-disabled">{{ $t("reboot_device") }}</div>
        <div class="item-seperator"></div>
        <div class="item" v-on:click="about">{{ $t("about") }}</div>
        <router-link to="/config/interface" class="item">{{ $t("config") }}</router-link>
        <router-link to="/system/software" class="item">{{ $t("system") }}</router-link>
        <router-link to="/help" class="item">{{ $t("help") }}</router-link>
        <div class="item-seperator"></div>
        <router-link to="/login" class="item">{{ $t("log_out") }}</router-link>
        <div class="button mobile-show menu-cancel">{{ $t("cancel") }}</div>
    </div>
    <div v-else id="service-menu">
        <div v-if="user" class="profile">
            <span class="icon">account_circle</span>
            <div class="profile-details">
                <span class="sub-title">{{ $t("loged_in_as") }}</span>
                <span class="identity">{{ user.name || user.username }}</span>
            </div>
        </div>
        <div v-if="!locked" v-on:click.stop="reboot()" class="item">{{ $t("reboot_device") }}</div>
        <div v-else class="item-disabled">{{ $t("reboot_device") }}</div>
        <div class="item-seperator"></div>
        <router-link to="/login" class="item">{{ $t("log_out") }}</router-link>
        <div class="button mobile-show menu-cancel">{{ $t("cancel") }}</div>
    </div>
</template>

<script>
    export default {
        name: "service-menu",

        props: {
            about: Function,
            widgets: Function
        },

        computed: {
            locked() {
                return this.$store.state.locked;
            },

            running() {
                return this.$store.state.running;
            },

            user() {
                return this.$store.state.user;
            }
        },

        methods: {
            async reboot() {
                this.$store.commit("lock");
                this.$store.commit("hide", "service");

                await this.api.post("/service/stop");
                await this.api.put("/reboot");

                setTimeout(() => {
                    this.$store.commit("reboot");
                }, 500);
            },

            async control(action) {
                switch (action) {
                    case "start":
                        this.$store.commit("lock");
                        this.$store.commit("hide", "service");

                        await this.api.post("/service/start");

                        this.$store.commit("unlock");

                        break;

                    case "stop":
                        this.$store.commit("lock");
                        this.$store.commit("hide", "service");

                        await this.api.post("/service/stop");

                        this.$store.commit("unlock");

                        break;

                    case "restart":
                        this.$store.commit("lock");
                        this.$store.commit("hide", "service");

                        await this.api.post("/service/restart");

                        this.$store.commit("unlock");

                        break;

                    default:
                        this.$store.commit("hide", "service");
                        break;
                }
            }
        }
    };
</script>

<style scoped>
    #service-menu {
        position: absolute;
        top: 20px;
        right: 40px;
        background: var(--background);
        box-shadow: var(--elevation-large);
        z-index: 300;
    }

    #service-menu .profile {
        padding: 20px 20px 10px 20px;
        display: flex;
        align-items: center;
        align-content: center;
        color: var(--text);
        user-select: none;
    }

    #service-menu .profile .icon {
        color: var(--button-primary);
        margin: 0 5px 0 0;
        font-size: 42px;
    }

    #service-menu .profile .identity {
        color: var(--button-primary);
    }

    #service-menu .profile .profile-details {
        flex: 1;
        display: flex;
        flex-direction: column;
    }

    #service-menu .profile .sub-title {
        font-size: 10px;
    }

    #service-menu .item,
    #service-menu .item:link,
    #service-menu .item:active,
    #service-menu .item:visited {
        padding: 10px 20px;
        color: var(--text);
        display: block;
        text-decoration: none;
        cursor: pointer;
        user-select: none;
    }

    #service-menu .item:hover {
        background: var(--background-highlight);
        text-decoration: none;
        color: var(--text-dark);
    }

    #service-menu .item-disabled {
        padding: 10px 20px;
        cursor: default;
        user-select: none;
        opacity: 0.4;
    }

    #service-menu .item-seperator {
        height: 1px;
        margin: 0 10px;
        background: var(--border);
    }

    @media (min-width: 300px) and (max-width: 815px) {
        #service-menu {
            position: absolute;
            top: 0;
            right: 0;
            padding: 57px 0 0 0;
            background: var(--background);
            box-shadow: unset;
            width: 100%;
            height: 100%;
            z-index: 150;
        }

        .menu-cancel {
            position: absolute;
            bottom: 10px;
            right: 0;
        }
    }
</style>
