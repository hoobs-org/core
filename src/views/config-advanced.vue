<template>
    <div v-if="user.admin" id="config">
        <div class="info">
            <router-link to="/config">{{ $t("guided_config") }}</router-link>
            <div class="actions">
                <div v-if="!working && loaded" v-on:click.stop="save()" class="button button-primary">{{ $t("save_changes") }}</div>
                <div v-if="working" class="loading">
                    <loading-marquee v-if="working" :height="3" color="--title-text" background="--title-text-dim" />
                </div>
                <p v-if="errors.length > 0">
                    {{ $t("save_failed") }}<br />
                    {{ $t("save_validation") }}
                </p>
                <p v-if="errors.length > 0" class="errors">
                    <span class="error" v-for="(error, index) in errors" :key="index">{{ error }}</span>
                </p>
            </div>
        </div>
        <div v-if="loaded" class="content">
            <json-editor name="config" :change="updateJson" :code="configCode()" />
        </div>
    </div>
</template>

<script>
    import JSONEditor from "@/components/json-editor.vue";
    import Marquee from "@/components/loading-marquee.vue";

    export default {
        name: "config-advanced",

        components: {
            "json-editor": JSONEditor,
            "loading-marquee": Marquee
        },

        computed: {
            running() {
                return this.$store.state.running;
            },

            user() {
                return this.$store.state.user;
            },
        },

        data() {
            return {
                loaded: false,
                working: false,
                configuration: {
                    client: {
                        port: null,
                        api: null,
                        socket: null,
                        default_route: null,
                        hide_setup_pin: null,
                        inactive_logoff: null,
                        theme: null,
                        locale: null
                    },
                    bridge: {
                        name: null,
                        username: null,
                        port: null,
                        pin: null
                    },
                    description: null,
                    ports: {
                        start: null,
                        end: null,
                        comment: null
                    },
                    accessories: [],
                    platforms: []
                },
                errors: []
            };
        },

        async mounted() {
            await this.load();
        },

        filters: {
            json: {
                read: (value) => {
                    return JSON.stringify(value, null, 4);
                },

                write: (value, current) => {
                    try {
                        return JSON.parse(value);
                    } catch {
                        return current;
                    }
                }
            }
        },

        methods: {
            async load() {
                await this.$configure();

                this.configuration.client = this.$client;
                this.configuration.bridge = this.$bridge;
                this.configuration.description = this.$description;
                this.configuration.ports = this.$ports;
                this.configuration.accessories = this.$accessories;
                this.configuration.platforms = this.$platforms;

                this.loaded = true;
                this.working = false;
            },

            configCode() {
                return JSON.stringify(this.configuration, null, 4)
            },

            updateJson(name, code) {
                try {
                    this.configuration = JSON.parse(code);
                } catch {
                    if (this.errors.indexOf(this.$t("invalid_json")) === -1) {
                        this.errors.push(this.$t("invalid_json"));
                    }
                }
            },

            async save() {
                this.working = true;

                const data = {
                    client: this.configuration.client,
                    bridge: this.configuration.bridge,
                    description: this.configuration.description,
                    ports: this.configuration.ports,
                    accessories: this.configuration.accessories || [],
                    platforms: this.configuration.platforms || []
                }

                if (!data.client.inactive_logoff || data.client.inactive_logoff < 5 || data.client.inactive_logoff > 60) {
                    this.errors.push(this.$t("invalid_inactive_logoff"));
                }

                if (!data.bridge.name || data.bridge.name === "") {
                    this.errors.push(this.$t("service_name_required"));
                }

                if (!data.bridge.port || Number.isNaN(parseInt(data.bridge.port, 10)) || data.bridge.port < 1 || data.bridge.port > 65535) {
                    this.errors.push(this.$t("service_port_invalid"));
                }

                if (!data.bridge.username || data.bridge.username === "") {
                    this.errors.push(this.$t("homebridge_username_required"));
                }

                if (!data.bridge.pin || data.bridge.pin === "") {
                    this.errors.push(this.$t("pin_required"));
                }

                if (data.ports && (!Number.isNaN(parseInt(data.ports.start)) || !Number.isNaN(parseInt(data.ports.end)))) {
                    if (Number.isNaN(parseInt(data.ports.start, 10)) || data.ports.start < 1 || data.ports.start > 65535) {
                        this.errors.push(this.$t("start_port_invalid"));
                    }

                    if (Number.isNaN(parseInt(data.ports.end, 10)) || data.ports.end < 1 || data.ports.end > 65535) {
                        this.errors.push(this.$t("end_port_invalid"));
                    }

                    if (!Number.isNaN(parseInt(data.ports.start, 10)) && !Number.isNaN(parseInt(data.ports.end, 10)) && data.ports.start > data.ports.end) {
                        this.errors.push(this.$t("invalid_port_range"));
                    }
                } else {
                    data.ports = {};
                }

                if (this.errors.length === 0) {
                    await this.client.post("/config", {
                        client: data.client
                    });

                    await this.api.post("/config", {
                        bridge: data.bridge,
                        description: data.description,
                        ports: data.ports,
                        accessories: data.accessories,
                        platforms: data.platforms
                    });

                    this.errors = [];

                    if (this.running) {
                        this.$store.commit("lock");

                        await this.api.post("/service/restart");

                        this.$store.commit("unlock");
                    }

                    window.location.reload();
                } else {
                    this.working = false;
                }
            }
        }
    }
</script>

<style scoped>
    #config {
        flex: 1;
        padding: 0;
        display: flex;
        overflow: hidden;
    }

    #config .info {
        width: 210px;
        padding: 20px 0 20px 20px;
    }

    #config .info a,
    #config .info a:link,
    #config .info a:active,
    #config .info a:visited {
        padding: 10px;
        border-bottom: 1px var(--border) solid;
        color: var(--text);
        text-decoration: none;
        display: block;
    }

    #config .info a:hover {
        color: var(--text-dark);
    }

    #config .info .actions {
        padding: 20px 0 0 0;
    }

    #config .info .loading {
        padding: 7px 10px 0 7px;
    }

    #config .info .errors {
        display: flex;
        flex-direction: column;
    }

    #config .info .error {
        color: var(--error-text);
        font-size: 12px;
        margin: 0 0 10px 0;
    }

    #config .content {
        flex: 1;
        padding: 20px 20px 0 20px;
        display: flex;
        flex-direction: column;
        overflow: auto;
    }
</style>
