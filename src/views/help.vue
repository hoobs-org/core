<template>
    <div id="help">
        <div class="content">
            <h2>{{ $t("online_help") }}</h2>
            <p>
                {{ $t("online_help_message") }}
            </p>
            <a href="http://hoobs.org" target="_blank" class="button button-primary">HOOBS.org</a>
            <a href="https://m.me/HOOBSofficial" target="_blank" class="button">{{ $t("chat_with_us") }}</a>
            <a href="https://www.reddit.com/r/hoobs/" target="_blank" class="button mobile-hide">HOOBS Subreddit</a>
            <h2>{{ $t("software") }}</h2>
            <p>
                Stay up-to-date. Updating HOOBS helps keep your setup running healthy. Try checking for updates from the system menu.
            </p>
            <div v-if="user.admin">
                <router-link to="/system" class="button button-primary">{{ $t("system") }}</router-link>
            </div>
            <div v-else>
                <p>
                    <b>Please login as an administrator to check for updates.</b>
                </p>
            </div>
            <h2>{{ $t("common_issues") }}</h2>
            <p>
                <b>Apple Home Can't Find Homebridge.</b> The Homebridge service is not running. Try starting the service. Check the Status screen and if the Homebridge service is not running, click the service menu on the rupper right and click Start Service.
            </p>
            <div v-if="user.admin" class="help-actions">
                <router-link :to="$client.default_route || 'status' === 'status' ? '/' : '/status'" class="button button-primary">{{ $t("status") }}</router-link>
                <div v-if="!locked && running" class="button" v-on:click="startService()">{{ $t("restart_service") }}</div>
                <div v-else-if="!locked" class="button" v-on:click="startService()">{{ $t("start_service") }}</div>
            </div>
            <div v-else class="help-actions">
                <p>
                    <b>Please login as an administrator to fix.</b>
                </p>
            </div>
            <p>
                <b>Apple Home Can't Find Homebridge.</b> iOS DNS cache has gone stale or gotten misconfigured. Try turning airplane mode on and back off to flush the DNS cache.
            </p>
            <p>
                <b>Apple Home Can't Find Homebridge.</b> The Homebridge service thinks it's paired, but iOS thinks otherwise. Try resetting the connection with the button below. This will delete the persist folder.<br>
                <b>Warning</b> This will disconnect Homebridge from Apple Home. You will need to re-pair.
            </p>
            <div v-if="user.admin" class="help-actions">
                <confirm-delete :title="$t('reset_connection')" :subtitle="$t('reset')" :confirmed="clearCache" />
            </div>
            <div v-else class="help-actions">
                <p>
                    <b>Please login as an administrator to fix.</b>
                </p>
            </div>
            <p>
                <b>Apple Home Can't Find Homebridge.</b> iOS has gotten your Homebridge username "stuck" somehow, where it's in the database but inactive. Try regenerating the Homebridge username.<br>
                <b>Warning</b> This will disconnect Homebridge from Apple Home. You will need to re-pair.
            </p>
            <div v-if="user.admin" class="help-actions">
                <confirm-delete :title="$t('generate_new_username')" :subtitle="$t('generate')" :confirmed="generateUsername" />
            </div>
            <div v-else class="help-actions">
                <p>
                    <b>Please login as an administrator to fix.</b>
                </p>
            </div>
        </div>
    </div>
</template>

<script>
    import ConfirmDelete from "@/components/confirm-delete.vue";

    export default {
        name: "help",

        components: {
            "confirm-delete": ConfirmDelete
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
            async startService() {
                if (!this.locked) {
                    this.$store.commit("lock");
                    this.$store.commit("hide", "homebridge");

                    if (this.running) {
                        await this.api.post("/service/restart");
                    } else {
                        await this.api.post("/service/start");
                    }

                    this.$store.commit("unlock");
                }
            },

            async clearCache() {
                if (!this.locked) {
                    this.$store.commit("lock");
                    this.$store.commit("hide", "homebridge");

                    await this.api.post("/service/clean");

                    this.$store.commit("unlock");
                }
            },

            async generateUsername() {
                if (!this.locked) {
                    const running = this.running;

                    this.$store.commit("lock");
                    this.$store.commit("hide", "homebridge");

                    if (running) {
                        await this.api.post("/service/stop");
                    }

                    const username = (await this.api.get("/config/generate")).username || "";

                    const data = {
                        client: this.$client,
                        bridge: this.$bridge,
                        description: this.$description,
                        ports: this.$ports,
                        accessories: this.$accessories || [],
                        platforms: this.$platforms || []
                    }

                    if (username && username !== "") {
                        data.bridge.username = username;
                    }

                    await this.api.post("/config", data);

                    if (running) {
                        await this.api.post("/service/start");
                    }

                    await this.$configure();
                    this.$store.commit("unlock");
                }
            }
        }
    }
</script>

<style scoped>
    #help {
        flex: 1;
        padding: 20px;
        overflow: auto;
    }

    #help .content {
        width: 100%;
        max-width: 990px;
            display: block;
    }

    #help h2 {
        margin: 20px 0 5px 0;
        padding: 0;
        line-height: normal;
        font-size: 22px;
        color: var(--title-text);
    }

    #help  h2:first-child {
        margin: 0 0 5px 0;
    }

    #help p {
        margin: 0 0 20px 0;
    }

    #help .help-actions {
        display: flex;
        padding: 0 0 30px 0;
    }

    #help .button {
        margin: 0 0 0 10px;
    }
</style>
