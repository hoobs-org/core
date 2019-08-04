<template>
    <div v-if="user.admin" id="homebridge-menu">
        <div class="profile">
            <span class="icon">account_circle</span>
            <div class="profile-details">
                <span class="sub-title">{{ $t("loged_in_as") }}</span>
                <span class="identity">{{ user.name || user.username }}</span>
            </div>
        </div>
        <router-link to="/profile" class="item">{{ $t("profile") }}</router-link>
        <div class="item-seperator"></div>
        <div v-if="!locked && !running" v-on:click.stop="control('start')" class="item">{{ $t("start_service") }}</div>
        <div v-else class="item-disabled">{{ $t("start_service") }}</div>
        <div v-if="!locked && running" v-on:click.stop="control('stop')" class="item">{{ $t("stop_service") }}</div>
        <div v-else class="item-disabled">{{ $t("stop_service") }}</div>
        <div v-if="!locked && running" v-on:click.stop="control('restart')" class="item">{{ $t("restart_service") }}</div>
        <div v-else class="item-disabled">{{ $t("restart_service") }}</div>
        <div class="item-seperator"></div>
        <div class="item" v-on:click="about">{{ $t("about") }}</div>
        <div class="item">{{ $t("help") }}</div>
        <div class="item-seperator"></div>
        <router-link to="/login" class="item">{{ $t("log_out") }}</router-link>
    </div>
    <div v-else id="homebridge-menu">
        <div class="profile">
            <span class="icon">account_circle</span>
            <div class="profile-details">
                <span class="sub-title">{{ $t("loged_in_as") }}</span>
                <span class="identity">{{ user.name || user.username }}</span>
            </div>
        </div>
        <router-link to="/profile" class="item">{{ $t("profile") }}</router-link>
        <div class="item-seperator"></div>
        <div class="item" v-on:click="about">{{ $t("about") }}</div>
        <div class="item">{{ $t("help") }}</div>
        <div class="item-seperator"></div>
        <router-link to="/login" class="item">{{ $t("log_out") }}</router-link>
    </div>
</template>

<script>
    export default {
        name: "homebridge_menu",

        props: {
            about: Function
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
            async control(action) {
                if (this.user.admin) {
                    switch (action) {
                        case "start":
                            this.$store.commit("lock");
                            this.$store.commit("hide", "homebridge");

                            await this.api.post("/service/start");

                            this.$store.commit("unlock");

                            break;

                        case "stop":
                            this.$store.commit("lock");
                            this.$store.commit("hide", "homebridge");

                            await this.api.post("/service/stop");

                            this.$store.commit("unlock");

                            break;

                        case "restart":
                            this.$store.commit("lock");
                            this.$store.commit("hide", "homebridge");

                            await this.api.post("/service/restart");

                            this.$store.commit("unlock");

                            break;

                        default:
                            this.$store.commit("hide", "homebridge");
                            break;
                    }
                }
            }
        }
    };
</script>

<style scoped>
    #homebridge-menu {
        position: absolute;
        top: 20px;
        right: 40px;
        background: var(--background);
        box-shadow: var(--elevation-large);
        z-index: 300;
    }

    #homebridge-menu .profile {
        padding: 20px 20px 10px 20px;
        display: flex;
        align-items: center;
        align-content: center;
        color: var(--text);
        user-select: none;
    }

    #homebridge-menu .profile .icon {
        color: var(--button-primary);
        margin: 0 5px 0 0;
        font-size: 42px;
    }

    #homebridge-menu .profile .identity {
        color: var(--button-primary);
    }

    #homebridge-menu .profile .profile-details {
        flex: 1;
        display: flex;
        flex-direction: column;
    }

    #homebridge-menu .profile .sub-title {
        font-size: 10px;
    }

    #homebridge-menu .item,
    #homebridge-menu .item:link,
    #homebridge-menu .item:active,
    #homebridge-menu .item:visited {
        padding: 10px 20px;
        color: var(--text);
        display: block;
        text-decoration: none;
        cursor: pointer;
        user-select: none;
    }

    #homebridge-menu .item:hover {
        background: var(--background-highlight);
        text-decoration: none;
        color: var(--text-dark);
    }

    #homebridge-menu .item-disabled {
        padding: 10px 20px;
        cursor: default;
        user-select: none;
        opacity: 0.4;
    }

    #homebridge-menu .item-seperator {
        height: 1px;
        margin: 0 10px;
        background: var(--border);
    }
</style>
