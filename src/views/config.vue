<template>
    <div id="config">
        <div v-if="loaded" class="info mobile-hide">
            <router-link to="/config/interface" :class="section === 'interface' ? 'active': ''">{{ $t("interface_settings") }}</router-link>
            <router-link to="/config/server" :class="section === 'server' ? 'active': ''">{{ $t("server_settings") }}</router-link>
            <router-link to="/config/bridge" :class="section === 'bridge' ? 'active': ''">{{ $t("bridge_settings") }}</router-link>
            <router-link to="/config/ports" :class="section === 'ports' ? 'active': ''">{{ $t("port_ranges") }}</router-link>
            <div v-for="(plugin, index) in plugins" :key="`${index}-platform-link`">
                <div v-if="user.admin || plugin.scope === 'hoobs'">
                    <router-link :to="`/config/${plugin.name}`" :class="section === plugin.name ? 'active': ''">{{ pluginTitle(plugin) }}</router-link>
                </div>
            </div>
            <router-link v-if="user.admin" to="/config/advanced" :class="section === 'advanced' ? 'active mobile-hide': 'mobile-hide'">{{ $t("advanced") }}</router-link>
            <router-link to="/config/backup" :class="section === 'backup' ? 'active': ''">{{ $t("backup") }}</router-link>
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
        <div v-if="loaded" ref="content" class="content">
            <form v-if="loaded" ref="main" :class="section === 'advanced' ? 'form form-lock': 'form'" method="post" action="/config" autocomplete="false" v-on:submit.prevent="save()">
                <input type="submit" class="hidden-submit" value="submit">
                <div class="section" v-if="section === 'interface' || screen.width <= 815">
                    <h2>{{ $t("interface_settings") }}</h2>
                    <p>
                        {{ $t("interface_settings_message") }}
                    </p>
                    <select-field :name="$t('language')" :description="$t('language_message')" :options="locales" v-model="configuration.client.locale" @change="markReload()" />
                    <select-field :name="$t('theme')" :description="$t('theme_message')" :options="themes" v-model="configuration.client.theme" @change="markReload()" />
                    <select-field :name="$t('default_screen')" :description="$t('default_screen_message')" :options="screens" v-model="configuration.client.default_route" @change="markReload()" />
                    <integer-field :name="$t('log_out_after')" :description="$t('log_out_after_message')" v-model.number="configuration.client.inactive_logoff" @change="markReload()" :required="true" />
                    <select-field :name="$t('temp_units')" :description="$t('temp_units_message')" :options="units" v-model="configuration.client.temp_units" @change="markReload()" />
                    <select-field :name="$t('country_code')" :description="$t('country_code_message')" :options="countries" v-model="configuration.client.country_code" @change="markReload()" />
                    <text-field :name="$t('postal_code')" :description="$t('postal_code_message')" v-model="configuration.client.postal_code" @change="markReload()" :required="true" />
                </div>
                <div class="section" v-if="section === 'server' || screen.width <= 815">
                    <h2>{{ $t("server_settings") }}</h2>
                    <p>
                        {{ $t("server_settings_message") }}
                    </p>
                    <port-field :name="$t('server_port')" :description="$t('server_port_message')" v-model.number="configuration.server.port" :required="true" @change="markReboot()" />
                    <integer-field :name="$t('autostart_after')" :description="$t('autostart_after_message')" v-model.number="configuration.server.autostart" :required="false" @change="markReboot()" />
                    <integer-field :name="$t('polling_seconds')" :description="$t('polling_seconds_message')" v-model.number="configuration.server.polling_seconds" :required="true" @change="markReboot()" />
                </div>
                <div class="section" v-if="section === 'bridge' || screen.width <= 815">
                    <h2>{{ $t("bridge_settings") }}</h2>
                    <p>
                        {{ $t("bridge_settings_message") }}
                    </p>
                    <text-field :name="$t('service_name')" :description="$t('service_name_message')" v-model="configuration.bridge.name" :required="true" />
                    <description-field :name="$t('service_description')" :description="$t('service_description_message')" v-model="configuration.description" />
                    <port-field :name="$t('service_port')" :description="$t('service_port_message')" v-model.number="configuration.bridge.port" :required="true" />
                    <hex-field :name="$t('home_username')" :description="$t('home_username_message')" v-model="configuration.bridge.username" :required="true" />
                    <text-field :name="$t('home_pin')" :description="$t('home_pin_message')" v-model="configuration.bridge.pin" :required="true" />
                </div>
                <div class="section" v-if="section === 'ports' || screen.width <= 815">
                    <h2>{{ $t("port_ranges") }}</h2>
                    <p>
                        {{ $t("port_ranges_message") }}
                    </p>
                    <text-field :name="$t('range_name')" :description="$t('range_name_message')" v-model="configuration.ports.comment" />
                    <port-field :name="$t('start_port')" :description="$t('start_port_message')" v-model.number="configuration.ports.start" />
                    <port-field :name="$t('end_port')" :description="$t('end_port_message')" v-model.number="configuration.ports.end" />
                </div>
                <div v-for="(plugin, index) in plugins" :key="`${index}-plugin`">
                    <div class="section" v-if="(section === plugin.name || screen.width <= 815) && (user.admin || plugin.scope === 'hoobs')">
                        <h2>{{ pluginTitle(plugin) }}</h2>
                        <plugin-config :plugin="plugin" :save="save" :error="addError" :fix="fixError" v-model="configuration" />
                    </div>
                </div>
                <div v-if="ready && user.admin && section === 'advanced'" class="mobile-hide">
                    <json-editor name="config" :height="jsonHeight" :change="updateJson" :code="configCode()" />
                </div>
                <div class="section" v-if="section === 'backup' || screen.width <= 815">
                    <h2>{{ $t("backup") }}</h2>
                    <p>
                        {{ $t("backup_message") }}
                    </p>
                    <div class="action">
                        <div v-on:click.stop="backup()" class="button">{{ $t("config") }}</div>
                        <div v-on:click.stop="logs()" class="button">{{ $t("log") }}</div>
                    </div>
                </div>
                <div class="mobile-show">
                    <h2>{{ $t("save_changes") }}</h2>
                    <div v-if="!working && loaded && errors.length === 0" v-on:click.stop="save()" class="button button-primary">{{ $t("save_changes") }}</div>
                    <div v-if="working && errors.length === 0" class="loading">
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
            </form>
        </div>
        <modal-dialog v-if="confirmReboot" width="440px" :ok="rebootDevice" :cancel="cancelReboot">
            <div class="dialog-message">{{ $t("config_reboot_confirm") }}</div>
        </modal-dialog>
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
    import HexField from "@/components/hex-field.vue";

    import PluginConfig from "@/components/plugin-config.vue";
    import ModalDialog from "@/components/modal-dialog.vue";
    import Marquee from "@/components/loading-marquee.vue";

    import CountryCodes from "../lang/country-codes.json";

    export default {
        name: "config",

        components: {
            "json-editor": JSONEditor,
            "text-field": TextField,
            "integer-field": IntegerField,
            "description-field": DescriptionField,
            "select-field": SelectField,
            "port-field": PortField,
            "hex-field": HexField,
            "plugin-config": PluginConfig,
            "modal-dialog": ModalDialog,
            "loading-marquee": Marquee
        },

        props: {
            section: String
        },

        computed: {
            running() {
                return this.$store.state.running;
            },

            user() {
                return this.$store.state.user;
            },

            system() {
                return this.$system;
            },

            screen() {
                return this.$store.state.screen;
            },

            jsonHeight() {
                return (this.$refs.main || {}).offsetHeight || 500;
            }
        },

        data() {
            return {
                loaded: false,
                working: false,
                ready: false,
                reload: false,
                reboot: false,
                confirmReboot: false,
                configuration: {
                    server: {
                        port: null,
                        autostart: null,
                        home_setup_id: null,
                        polling_seconds: null
                    },
                    client: {
                        port: null,
                        default_route: null,
                        inactive_logoff: null,
                        theme: null,
                        locale: null,
                        temp_units: null,
                        country_code: null,
                        postal_code: null
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
                countries: CountryCodes,
                units: [{
                    text: this.$t("celsius"),
                    value: "celsius"
                },{
                    text: this.$t("fahrenheit"),
                    value: "fahrenheit"
                }],
                locales: [{
                    text: this.$t("auto"),
                    value: ""
                },{
                    text: "English",
                    value: "en"
                },{
                    text: "عربى",
                    value: "ar"
                },{
                    text: "български",
                    value: "bg"
                },{
                    text: "čeština",
                    value: "cs"
                },{
                    text: "Deutsch",
                    value: "de"
                },{
                    text: "Ελληνικά",
                    value: "el"
                },{
                    text: "Español",
                    value: "es"
                },{
                    text: "Français",
                    value: "fr"
                },{
                    text: "עברית",
                    value: "he"
                },{
                    text: "Italiano",
                    value: "it"
                },{
                    text: "日本人",
                    value: "ja"
                },{
                    text: "한국어",
                    value: "ko"
                },{
                    text: "Nederlands",
                    value: "nl"
                },{
                    text: "norsk",
                    value: "no"
                },{
                    text: "Polskie",
                    value: "pl"
                },{
                    text: "Português",
                    value: "pt"
                },{
                    text: "Română",
                    value: "ro"
                },{
                    text: "русский",
                    value: "ru"
                },{
                    text: "svenska",
                    value: "sv"
                },{
                    text: "Tiếng Việt",
                    value: "vi"
                },{
                    text: "中文",
                    value: "zh"
                }],
                themes: [],
                screens: [{
                    text: this.$t("status"),
                    value: "status"
                },{
                    text: this.$t("accessories"),
                    value: "accessories"
                }],
                plugins: [],
                errors: [],
                gshPopup: null,
                gshOriginCheck: null
            };
        },

        async mounted() {
            await this.load();

            this.themes = [{
                text: this.$t(`${this.system}_light`),
                value: `${this.system}-light`
            },{
                text: this.$t(`${this.system}_dark`),
                value: `${this.system}-dark`
            }];
        },

        updated() {
            this.ready = true;
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

                const client = await this.client.get("/config/client");

                this.configuration.server = this.$server;
                this.configuration.client = client;
                this.configuration.bridge = this.$bridge;
                this.configuration.description = this.$description;
                this.configuration.ports = this.$ports;
                this.configuration.accessories = this.$accessories;
                this.configuration.platforms = this.$platforms;

                this.plugins = await this.api.get("/plugins") || [];                 

                this.loaded = true;
                this.working = false;
            },

            markReboot() {
                this.reboot = true;
            },

            markReload() {
                this.reload = true;
            },

            rebootDevice() {
                this.confirmReboot = false;

                this.$store.commit("lock");
                this.$store.commit("hide", "service");

                await this.api.post("/service/stop");

                this.api.put("/reboot");
            },
            
            cancelReboot() {
                this.confirmReboot = false;
            },

            addError(message) {
                if (this.errors.indexOf(message) === -1) {
                    this.errors.push(message);
                }
            },

            fixError(message) {
                const index = this.errors.indexOf(message);

                if (index >= 0) {
                    this.errors.splice(index, 1);
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

            logs() {
                const element = document.createElement("a");

                element.setAttribute("href", `data:text/plain;charset=utf-8,${encodeURIComponent(this.$store.state.messages.join("\r\n"))}`);
                element.setAttribute("download", "logs.txt");

                element.style.display = "none";
                document.body.appendChild(element);

                element.click();

                document.body.removeChild(element);
            },

            configCode() {
                return JSON.stringify(this.configuration, null, 4)
            },

            updateJson(name, code) {
                try {
                    this.configuration = JSON.parse(code);
                    this.fixError(this.$t("invalid_json"));
                } catch {
                    this.addError(this.$t("invalid_json"));
                }
            },

            pluginTitle(plugin) {
                if (plugin.name === "google-home") {
                    return "Google Home";
                }

                const index = this.configuration.platforms.findIndex(p => p.platform === plugin.details.alias || (p.plugin_map || {}).plugin_name === plugin.name);
                const platform = (plugin.schema || {}).platform || {};
                const accessory = (plugin.schema || {}).accessories || {};

                if (index === -1) {
                    return this.humanize((platform.plugin_alias || accessory.plugin_alias || plugin.name || "Unknown Plugin").split(".")[0]);
                }

                return this.humanize((platform.plugin_alias || this.configuration.platforms[index].platform || plugin.name || "Unknown Plugin").split(".")[0]);
            },

            humanize(string) {
                string = Inflection.titleize(Decamelize(string.replace(/-/gi, " ").replace(/homebridge/gi, "").trim()));

                string = string.replace(/smart things/gi, "SmartThings");
                string = string.replace(/smartthings/gi, "SmartThings");
                string = string.replace(/my q/gi, "myQ");
                string = string.replace(/myq/gi, "myQ");
                string = string.replace(/rgb/gi, "RGB");
                string = string.replace(/ffmpeg/gi, "FFMPEG");

                return string;
            },

            async save() {
                this.working = true;

                const data = {
                    server: this.configuration.server,
                    client: this.configuration.client,
                    bridge: this.configuration.bridge,
                    description: this.configuration.description,
                    ports: this.configuration.ports,
                    accessories: this.configuration.accessories || [],
                    platforms: this.configuration.platforms || []
                }

                if (!data.server.port || Number.isNaN(parseInt(data.server.port, 10)) || data.server.port < 1 || data.server.port > 65535) {
                    this.errors.push(this.$t("server_port_invalid"));
                }

                if (!data.server.polling_seconds || data.server.polling_seconds < 1 || data.server.polling_seconds > 1800) {
                    this.errors.push(this.$t("polling_seconds_invalid"));
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
                        server: data.server,
                        bridge: data.bridge,
                        description: data.description,
                        ports: data.ports,
                        accessories: data.accessories,
                        platforms: data.platforms
                    });

                    this.errors = [];

                    this.$store.commit("lock");

                    if (this.running) {
                        await this.api.post("/service/restart");
                    } else {
                        await this.api.post("/service/start");
                    }

                    this.$store.commit("unlock");

                    if (this.reload && !this.reboot) {
                        window.location.reload();
                    } else if (this.reboot) {
                        this.confirmReboot = true;
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
        width: 230px;
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

    #config .info .active {
        font-weight: bold;
        color: var(--title-text) !important;
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
        flex: 1;
        width: 100%;
        display: flex;
        flex-direction: column;
    }

    #config .content .form-lock {
        overflow: hidden;
    }

    #config .content .section {
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

    #config .accessory-title {
        margin: 0 0 10px 0;
        padding: 0 0 5px 0;
        border-bottom: 1px var(--border) solid;
        display: flex;
        align-content: flex-end;
        align-items: flex-end;
        justify-content: space-between;
    }

    #config .form h3 {
        margin: 0;
        padding: 0;
        line-height: normal;
        font-size: 18px;
    }

    #config .form p {
        margin: 0 0 20px 0;
    }

    #config .form .accessory-button {
        white-space: normal;
        margin: 0 0 10px 0;
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

    #config .add-accessory-button {
        padding: 10px 10px 10px 20px;
        display: block;
        margin: 10px 0 0 0;
        white-space: normal;
        display: flex;
        align-items: center;
        align-content: center;
        justify-content: space-between;
    }

    #config .add-accessory-button:first-child {
        margin: 0;
    }

    #config .dialog-message {
        margin: 20px 0 10px 0;
        text-align: center;
    }

    @media (min-width: 300px) and (max-width: 815px) {
        #config .content .section {
            max-width: unset;
        }
    }
</style>
