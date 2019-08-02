<template>
    <div v-if="user.admin" id="config">
        <div class="info">
            <a href="#hoobs">{{ $t("interface_settings") }}</a>
            <a href="#bridge">{{ $t("bridge_settings") }}</a>
            <a href="#ports">{{ $t("port_ranges") }}</a>
            <a href="#accessories">{{ $t("accessories") }}</a>
            <a href="#plugins">{{ $t("plugins") }}</a>
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
            <form class="form">
                <h2 id="hoobs">{{ $t("interface_settings") }}</h2>
                <p>
                    {{ $t("interface_settings_message") }}
                </p>
                <select-field :name="$t('language')" :description="$t('language_message')" :options="locales" v-model="configuration.client.locale" @change="markReload()" />
                <select-field :name="$t('theme')" :description="$t('theme_message')" :options="themes" v-model="configuration.client.theme" @change="markReload()" />
                <select-field :name="$t('default_screen')" :description="$t('default_screen_message')" :options="screens" v-model="configuration.client.default_route" @change="markReload()" />
                <select-field :name="$t('show_setup_pin')" :description="$t('show_setup_pin_message')" :options="binaryReverse" v-model="configuration.client.hide_setup_pin" @change="markReload()" />
                <integer-field :name="$t('log_out_after')" :description="$t('log_out_after_message')" v-model.number="configuration.client.inactive_logoff" @change="markReload()" />
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
                    <json-editor name="accessory" :height="200" :index="index" :change="updateJson" :code="JSON.stringify(accessory, null, 4)" />
                </div>
                <div class="action">
                    <div v-on:click.stop="addAccessory()" class="button">{{ $t("add_accessory") }}</div>
                </div>
                <a id="plugins"></a>
                <div v-for="(plugin, index) in plugins" :key="index">
                    <div v-if="plugin.name !== 'homebridge' && platformIndex(plugin) >= 0">
                        <h2 :id="plugin.name">{{ platformTitle(plugin) }}</h2>
                        <p v-if="plugin.description !== ''">
                            {{ plugin.description }}
                        </p>
                        <div v-if="plugin.schema.platform && plugin.schema.platform.schema">
                            <platform-form :schema="plugin.schema.platform.schema.properties || {}" v-model="configuration.platforms[platformIndex(plugin)]" />
                        </div>
                        <div v-else>
                            <json-editor name="platform" :height="200" :index="platformIndex(plugin)" :change="updateJson" :code="platformCode(plugin)" />
                        </div>
                    </div>
                </div>
                <h2 id="backup">{{ $t("backup") }}</h2>
                <p>
                    {{ $t("backup_message") }}
                </p>
                <div class="action">
                    <div v-on:click.stop="backup()" class="button button-primary">{{ $t("download") }}</div>
                </div>
            </form>
        </div>
    </div>
</template>

<script>
    import Decamelize from "decamelize";
    import Inflection from "inflection";

    import JSONEditor from "@/components/json-editor.vue";
    import TextField from "@/components/text-field.vue";
    import IntegerField from "@/components/integer-field.vue";
    import DescriptionField from "@/components/description-field.vue";
    import SelectField from "@/components/select-field.vue";
    import PortField from "@/components/port-field.vue";
 
    import PlatformForm from "@/components/platform-form.vue";
    import Marquee from "@/components/loading-marquee.vue";

    export default {
        name: "config",

        components: {
            "json-editor": JSONEditor,
            "text-field": TextField,
            "integer-field": IntegerField,
            "description-field": DescriptionField,
            "select-field": SelectField,
            "port-field": PortField,
            "platform-form": PlatformForm,
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
                reload: false,
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
                locales: [{
                    text: this.$t("auto"),
                    value: null
                },{
                    text: "English",
                    value: "en"
                },{
                    text: "Español",
                    value: "es"
                },{
                    text: "Română",
                    value: "ro"
                }],
                themes: [{
                    text: this.$t("hoobs_light"),
                    value: "hoobs-light"
                },{
                    text: this.$t("hoobs_dark"),
                    value: "hoobs-dark"
                }],
                screens: [{
                    text: this.$t("status"),
                    value: "status"
                },{
                    text: this.$t("accessories"),
                    value: "accessories"
                }],
                binaryReverse: [{
                    text: this.$t("yes"),
                    value: false
                },{
                    text: this.$t("no"),
                    value: true
                }],
                plugins: [],
                errors: []
            };
        },

        async mounted() {
            await this.load();

            if (window.location.hash && window.location.hash !== "" && window.location.hash !== "#") {
                document.querySelector(window.location.hash).scrollIntoView();
            }
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
                this.configuration = await this.api.get("/config");
                this.plugins = await this.api.get("/plugins") || [];                 

                this.working = false;
            },

            markReload() {
                this.reload = true;
            },

            updateJson(section, code, index) {
                switch (section) {
                    case "accessory":
                        const currentAccessory = JSON.parse(JSON.stringify(this.configuration.accessories[index], null, 4));

                        try {
                            this.configuration.accessories[index] = JSON.parse(code);

                            const accessoryIndex = this.errors.indexOf(this.$t("accessory_invalid_json"));

                            if (accessoryIndex >= 0) {
                                this.errors.splice(accessoryIndex, 1);
                            }
                        } catch {
                            if (this.errors.indexOf(this.$t("accessory_invalid_json")) === -1) {
                                this.errors.push(this.$t("accessory_invalid_json"));
                            }
                        } finally {
                            this.configuration.accessories[index].plugin_map = currentAccessory.plugin_map;
                        }

                        break;

                    case "platform":
                        const currentPlatform = JSON.parse(JSON.stringify(this.configuration.platforms[index], null, 4));

                        try {
                            this.configuration.platforms[index] = JSON.parse(code);

                            const platformIndex = this.errors.indexOf(this.$t("platform_invalid_json"));

                            if (platformIndex >= 0) {
                                this.errors.splice(platformIndex, 1);
                            }
                        } catch {
                            if (this.errors.indexOf(this.$t("platform_invalid_json")) === -1) {
                                this.errors.push(this.$t("platform_invalid_json"));
                            }
                        } finally {
                            this.configuration.platforms[index].plugin_map = currentPlatform.plugin_map;
                        }
                        
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

            addAccessory() {

                // GET A LIST OF ACCESSORIES FROM THE PLUGINS SCHEMA

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
                    await this.api.post("/config", data);

                    this.errors = [];

                    if (this.running) {
                        this.$store.commit("lock");

                        await this.api.post("/service/restart");

                        this.$store.commit("unlock");
                    }

                    if (this.reload) {
                        await this.api.post("/service/reload");

                        this.config.client.default_route = data.client.default_route;
                        this.config.client.hide_setup_pin = data.client.hide_setup_pin;
                        this.config.client.inactive_logoff = data.client.inactive_logoff;
                        this.config.client.theme = data.client.theme;
                        this.config.client.locale = data.client.locale;

                        this.reload = false;

                        window.location.reload();
                    }

                    this.load();
                } else {
                    this.working = false;
                }
            },

            platformIndex(plugin) {
                const index = this.configuration.platforms.findIndex(p => (p.plugin_map || {}).plugin_name === plugin.name);

                if (index >= 0 && plugin.schema.platform.pluginAlias && (!this.configuration.platforms[index].platform || this.configuration.platforms[index].platform !== plugin.schema.platform.pluginAlias)) {
                    this.configuration.platforms[index].platform = plugin.schema.platform.pluginAlias;
                }

                return index;
            },

            platformTitle(plugin) {
                const index = this.platformIndex(plugin);
                const platformSchema = (plugin.schema || {}).platform || {};

                if (index === -1) {
                    return this.humanize(platformSchema.pluginAlias || plugin.name);
                }

                return this.humanize(platformSchema.pluginAlias || this.configuration.platforms[index].platform || plugin.name);
            },

            platformCode(plugin) {
                const index = this.platformIndex(plugin);

                if (index === -1) {
                    return {};
                }

                const copy = JSON.parse(JSON.stringify(this.configuration.platforms[index]));

                delete copy.plugin_map;

                return JSON.stringify(copy, null, 4);
            },

            humanize(string) {
                return Inflection.titleize(Decamelize(string.replace(/-/gi, " ").replace(/homebridge/gi, "").trim()));
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
        margin: 20px 0 5px 0;
        padding: 0;
        line-height: normal;
        font-size: 22px;
        color: var(--title-text);
    }

    #config .form h2:first-child {
        margin: 0 0 5px 0;
    }

    #config .form h3 {
        margin: 20px 0 0 0;
        padding: 0;
        line-height: normal;
        font-size: 18px;
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
        padding: 7px;
        font-size: 14px;
        background: var(--input-background);
        color: var(--input-text);
        border: 1px var(--border) solid;
        border-radius: 5px;
    }

    #config .form .field input,
    #config .form .field textarea {
        flex: 1;
    }

    #config .form .field input,
    #config .form .field select {
        height: 33px !important;
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
