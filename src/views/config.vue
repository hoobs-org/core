<template>
    <div v-if="user.admin" id="config">
        <div class="info">
            <a href="#bridge">{{ $t("bridge_settings") }}</a>
            <a href="#ports">{{ $t("port_ranges") }}</a>
            <a href="#accessories">{{ $t("accessories") }}</a>
            <a href="#platforms">{{ $t("platforms") }}</a>
            <a href="#backup">{{ $t("backup") }}</a>
            <div class="actions">
                <div v-if="!working" v-on:click.stop="save()" class="button button-primary">{{ $t("save_changes") }}</div>
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
        <div class="content">
            <div class="form">
                <h2 id="bridge">{{ $t("bridge_settings") }}</h2>
                <p>
                    {{ $t("bridge_settings_message") }}
                </p>
                <text-field :name="$t('service_name')" :description="$t('service_name_message')" v-model="configuration.bridge.name" />
                <description-field :name="$t('service_description')" :description="$t('service_description_message')" v-model="configuration.description" />
                <port-field :name="$t('service_port')" :description="$t('service_port_message')" v-model.number="configuration.bridge.port" />
                <text-field :name="$t('home_username')" :description="$t('home_username_message')" v-model="configuration.bridge.username" />
                <text-field :name="$t('home_pin')" :description="$t('home_pin_message')" v-model="configuration.bridge.pin" />
                <h2 id="ports">{{ $t("port_ranges") }}</h2>
                <p>
                    {{ $t("port_ranges_message") }}
                </p>
                <text-field :name="$t('range_name')" :description="$t('range_name_message')" v-model="configuration.ports.comment" />
                <port-field :name="$t('start_port')" :description="$t('start_port_message')" v-model.number="configuration.ports.start" />
                <port-field :name="$t('end_port')" :description="$t('end_port_message')" v-model.number="configuration.ports.end" />
                <h2 id="accessories">{{ $t("accessories") }}</h2>
                <p>
                    {{ $t("accessories_config_message") }}
                </p>
                <div class="field" v-for="(accessory, index) in configuration.accessories" :key="index">
                    <json-editor name="accessory" :height="200" :index="index" :change="update" :code="accessory" />
                </div>
                <div class="action">
                    <div v-on:click.stop="add('accessory')" class="button">{{ $t("add_accessory") }}</div>
                </div>
                <h2 id="platforms">{{ $t("platforms") }}</h2>
                <p>
                    {{ $t("platforms_message") }}
                </p>
                <div class="field" v-for="(platform, index) in configuration.platforms" :key="index">
                    <json-editor name="platform" :height="200" :index="index" :change="update" :code="platform" />
                </div>
                <div class="action">
                    <div v-on:click.stop="add('platform')" class="button">{{ $t("add_platform") }}</div>
                </div>
                <h2 id="backup">{{ $t("backup") }}</h2>
                <p>
                    {{ $t("backup_message") }}
                </p>
                <div class="action">
                    <div v-on:click.stop="backup()" class="button button-primary">{{ $t("download") }}</div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import JSONEditor from "@/components/json-editor.vue";
    import TextField from "@/components/text-field.vue";
    import PortField from "@/components/port-field.vue";
    import DescriptionField from "@/components/description-field.vue";
    
    import Marquee from "@/components/loading-marquee.vue";

    export default {
        name: "config",

        components: {
            "json-editor": JSONEditor,
            "text-field": TextField,
            "port-field": PortField,
            "description-field": DescriptionField,
            "loading-marquee": Marquee
        },

        computed: {
            running() {
                return this.$store.state.running;
            },

            user() {
                return this.$store.state.user;
            }
        },

        data() {
            return {
                working: false,
                configuration: {
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

        mounted() {
            this.load();
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
                const response = await this.api.get("/config");
                const accessories = [];

                for (let i = 0; i < (response.accessories || []).length; i++) {
                    accessories.push(JSON.stringify(response.accessories[i], null, 4));
                }

                const platforms = [];

                for (let i = 0; i < (response.platforms || []).length; i++) {
                    platforms.push(JSON.stringify(response.platforms[i], null, 4));
                }

                this.configuration.bridge = response.bridge || {
                    name: "Homebridge",
                    username: "CC:22:3D:E3:CE:30",
                    port: 51826,
                    pin: "031-45-154"
                };

                this.configuration.description = response.description || "";
                this.configuration.ports = response.ports || {};
                this.configuration.accessories = accessories;
                this.configuration.platforms = platforms;

                this.working = false;
            },

            add(section) {
                switch (section) {
                    case "accessory":
                        this.configuration.accessories.push("{\n    \n}");
                        break;

                    case "platform":
                        this.configuration.platforms.push("{\n    \n}");
                        break;
                }
            },

            update(section, code, index) {
                switch (section) {
                    case "accessory":
                        this.configuration.accessories[index] = code;
                        break;

                    case "platform":
                        this.configuration.platforms[index] = code;
                        break;
                }
            },

            async backup() {
                this.working = true;

                const response = await this.api.post("/config/backup");

                this.working = false;

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

            async save() {
                this.working = true;
                this.errors = [];

                const data = {
                    bridge: this.configuration.bridge,
                    description: this.configuration.description,
                    ports: this.configuration.ports,
                    accessories: [],
                    platforms: []
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

                for (let i = 0; i < this.configuration.accessories.length; i++) {
                    if (this.configuration.accessories[i] && this.configuration.accessories[i] !== "") {
                        try {
                            data.accessories.push(JSON.parse(this.configuration.accessories[i]));
                        } catch {
                            if (this.errors.indexOf(this.$t("accessory_invalid_json")) === -1) {
                                this.errors.push(this.$t("accessory_invalid_json"));
                            }
                        }
                    }
                }

                for (let i = 0; i < this.configuration.platforms.length; i++) {
                    if (this.configuration.platforms[i] && this.configuration.platforms[i] !== "") {
                        try {
                            data.platforms.push(JSON.parse(this.configuration.platforms[i]));
                        } catch {
                            if (this.errors.indexOf(this.$t("platform_invalid_json")) === -1) {
                                this.errors.push(this.$t("platform_invalid_json"));
                            }
                        }
                    }
                }

                if (this.errors.length === 0) {
                    await this.api.post("/config", data);

                    if (this.running) {
                        this.$store.commit("lock");

                        await this.api.post("/service/restart");

                        this.$store.commit("unlock");
                    }

                    this.load();
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
        padding: 20px;
        display: flex;
        flex-direction: column;
        overflow: auto;
    }

    #config .content .form {
        width: 100%;
        max-width: 780px;
    }

    #config .form h2 {
        margin: 20px 0 0 0;
        padding: 0;
        line-height: normal;
        font-size: 22px;
        color: var(--title-text);
    }

    #config .form h2:first-child {
        margin: 0;
    }

    #config .form p {
        margin: 0 0 20px 0;
    }

    #config .form .field {
        display: flex;
        flex-direction: column;
        padding: 0 0 20px 0;
    }

    #config .form .field .title {
        font-weight: bold;
    }

    #config .form .field .description {
        font-size: 12px;
    }

    #config .form .field input,
    #config .form .field select,
    #config .form .field textarea {
        flex: 1;
        padding: 7px;
        font-size: 14px;
        background: var(--input-background);
        color: var(--input-text);
        border: 1px var(--border) solid;
        border-radius: 5px;
    }

    #config .form .field textarea {
        min-height: 107px;
        resize: none;
    }

    #config .form .field input:focus,
    #config .form .field select:focus,
    #config .form .field textarea:focus {
        outline: 0 none;
        border-color: var(--title-text);
    }

    #config .form .action {
        padding: 0 0 20px 0;
    }
</style>
