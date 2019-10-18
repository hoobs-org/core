<template>
    <div id="help">
        <div class="content">
            <h2>{{ $t("online_help") }}</h2>
            <p v-if="system === 'hoobs'">
                {{ $t("online_help_message") }}
            </p>
            <div class="help-actions">
                <a v-if="system === 'hoobs'" href="https://hoobs.org" target="_blank" class="button button-primary">HOOBS.org</a>
                <a v-if="system === 'rocket'" href="https://rocketsmarthome.com" target="_blank" class="button button-primary">RocketSmartHome.com</a>
                <a href="https://m.me/HOOBSofficial" target="_blank" class="button">{{ $t("chat_with_us") }}</a>
                <a v-if="system === 'hoobs'" href="https://www.reddit.com/r/hoobs/" target="_blank" class="button mobile-hide">HOOBS Subreddit</a>
                <div v-if="registration" class="button mobile-hide" v-on:click="disconnectCockpit()">{{ $t("disconnect") }}</div>
                <div v-else class="button mobile-hide" v-on:click="startCockpit()">{{ $t("remote_support") }}</div>
                <div v-if="registration" class="registration mobile-hide">{{ $t("support_code") }}: {{ registration }}</div>
            </div>
            <h2 v-if="system === 'hoobs'">{{ $t("software") }}</h2>
            <p v-if="system === 'hoobs'">{{ $t("stay_up_to_date") }}</p>
            <div v-if="system === 'hoobs'" class="help-actions">
                <router-link to="/system" class="button">{{ $t("system") }}</router-link>
            </div>
            <h2>{{ $t("backup") }}</h2>
            <p>
                {{ $t("backup_message") }}
            </p>
            <div class="help-actions">
                <div v-on:click.stop="backup()" class="button">{{ $t("config") }}</div>
                <div v-on:click.stop="logs()" class="button">{{ $t("log") }}</div>
            </div>
            <h2>{{ $t("common_issues") }}</h2>
            <p>
                <b>{{ $t("homekit_cant_find") }}</b> {{ $t("homebridge_service_not_running") }}
            </p>
            <div class="help-actions">
                <router-link :to="$client.default_route || 'status' === 'status' ? '/' : '/status'" class="button">{{ $t("status") }}</router-link>
                <div v-if="!locked && running" class="button" v-on:click="startService()">{{ $t("restart_service") }}</div>
                <div v-else-if="!locked" class="button" v-on:click="startService()">{{ $t("start_service") }}</div>
            </div>
            <p>
                <b>{{ $t("homekit_cant_find") }}</b> {{ $t("dns_cache_stale") }}
            </p>
            <p>
                <b>{{ $t("homekit_cant_find") }}</b> {{ $t("homebridge_service_clash") }}<br>
                <b>{{ $t("warning") }}</b> {{ $t("homekit_disconnect") }}
            </p>
            <div class="help-actions">
                <confirm-delete :title="$t('reset_connection')" :subtitle="$t('reset')" :confirmed="resetService" />
            </div>
            <p>
                <b>{{ $t("homekit_cant_find") }}</b> {{ $t("homebridge_stuck") }}<br>
                <b>{{ $t("warning") }}</b> {{ $t("homekit_disconnect") }}
            </p>
            <div class="help-actions">
                <confirm-delete :title="$t('generate_new_username')" :subtitle="$t('generate')" :confirmed="generateUsername" />
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

        data() {
            return {
                registration: null
            };
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
            },

            system() {
                return this.$system;
            }
        },

        methods: {
            async backup() {
                const response = await this.api.post("/config/backup");

                if (response.success) {
                    const element = document.createElement("a");

                    element.setAttribute("href", `data:text/plain;charset=utf-8,${encodeURIComponent(JSON.stringify(response.config, null, 4))}`);
                    element.setAttribute("download", "config.json");

                    element.style.display = "none";
                    document.body.appendChild(element);

                    element.click();

                    document.body.removeChild(element);
                }
            },

            logs() {
                this.$store.state.messages
                const element = document.createElement("a");

                element.setAttribute("href", `data:text/plain;charset=utf-8,${encodeURIComponent(this.$store.state.messages.join("\r\n"))}`);
                element.setAttribute("download", "logs.txt");

                element.style.display = "none";
                document.body.appendChild(element);

                element.click();

                document.body.removeChild(element);
            },

            async startCockpit() {
                try {
                    this.registration = (await this.api.get("/cockpit/start")).registration;
                } catch {
                    this.registration = null;
                }
            },

            async disconnectCockpit() {
                if (await this.api.get("/cockpit/disconnect")) {
                    this.registration = null;
                }
            },

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

            async resetService() {
                if (!this.locked) {
                    const running = this.running;

                    this.$store.commit("lock");
                    this.$store.commit("hide", "homebridge");

                    await this.api.post("/service/clean");

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

    #help .registration {
        display: inline;
        padding: 10px;
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
