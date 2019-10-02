<template>
    <div id="config">
        <div class="info">
            <a href="#hoobs">{{ $t("interface_settings") }}</a>
            <a href="#bridge">{{ $t("bridge_settings") }}</a>
            <a href="#ports">{{ $t("port_ranges") }}</a>
            <a href="#accessories">{{ $t("accessories") }}</a>
            <div v-for="(plugin, index) in plugins" :key="`${index}-platform-link`">
                <div v-if="(plugin.name !== 'homebridge' && (user.admin || plugin.scope === 'hoobs')) && platformIndex(plugin) >= 0">
                    <a :href="`#${plugin.name}`">{{ platformTitle(plugin) }}</a>
                </div>
            </div>
            <a href="#backup">{{ $t("backup") }}</a>
            <router-link v-if="user.admin" to="/config/advanced">{{ $t("advanced_config") }}</router-link>
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
        <div ref="content" class="content">
            <form v-if="loaded" class="form" method="post" action="/config" autocomplete="false" v-on:submit.prevent="save()">
                <input type="submit" class="hidden-submit" value="submit">
                <h2 id="hoobs">{{ $t("interface_settings") }}</h2>
                <p>
                    {{ $t("interface_settings_message") }}
                </p>
                <select-field :name="$t('language')" :description="$t('language_message')" :options="locales" v-model="configuration.client.locale" @change="markReload()" />
                <select-field :name="$t('theme')" :description="$t('theme_message')" :options="themes" v-model="configuration.client.theme" @change="markReload()" />
                <select-field :name="$t('default_screen')" :description="$t('default_screen_message')" :options="screens" v-model="configuration.client.default_route" @change="markReload()" />
                <integer-field :name="$t('log_out_after')" :description="$t('log_out_after_message')" v-model.number="configuration.client.inactive_logoff" @change="markReload()" :required="true" />
                <select-field :name="$t('temp_units')" :description="$t('temp_units_message')" :options="units" v-model="configuration.client.temp_units" @change="markReload()" />
                <select-field :name="$t('country_code')" :description="$t('country_code_message')" :options="countries" v-model="configuration.client.country_code" @change="markReload()" />
                <text-field :name="$t('postal_code')" :description="$t('postal_code_message')" v-model.number="configuration.client.postal_code" @change="markReload()" :required="true" />
                <h2 id="bridge">{{ $t("bridge_settings") }}</h2>
                <p>
                    {{ $t("bridge_settings_message") }}
                </p>
                <text-field :name="$t('service_name')" :description="$t('service_name_message')" v-model="configuration.bridge.name" :required="true" />
                <description-field :name="$t('service_description')" :description="$t('service_description_message')" v-model="configuration.description" />
                <port-field :name="$t('service_port')" :description="$t('service_port_message')" v-model.number="configuration.bridge.port" :required="true" />
                <hex-field :name="$t('home_username')" :description="$t('home_username_message')" v-model="configuration.bridge.username" :required="true" />
                <text-field :name="$t('home_pin')" :description="$t('home_pin_message')" v-model="configuration.bridge.pin" :required="true" />
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
                <div v-for="(accessory, index) in configuration.accessories" :key="`${index}-accessory`">
                    <div v-if="accessory.plugin_map && accessories[accessoryKey(accessory)]">
                        <div class="accessory-title">
                            <h3>{{ accessories[accessoryKey(accessory)].title || humanize(pluginAlias[accessory.plugin_map.plugin_name]) }}</h3>
                            <confirm-delete :title="$t('delete')" :index="index" :confirmed="removeAccessory" />
                        </div>
                        <schema-form :schema="accessories[accessoryKey(accessory)].properties || {}" v-model="configuration.accessories[index]" />
                    </div>
                    <div v-else-if="user.admin">
                        <div class="accessory-title">
                            <h3>{{ $t("custom") }}</h3>
                            <confirm-delete :title="$t('delete')" :index="index" :confirmed="removeAccessory" />
                        </div>
                        <json-editor name="accessory" :height="200" :index="index" :change="updateJson" :code="accessoryCode(index)" />
                    </div>
                </div>
                <div class="action">
                    <div v-on:click.stop="addAccessory()" class="button">{{ $t("add_accessory") }}</div>
                </div>
                <a id="plugins"></a>
                <div v-for="(plugin, index) in plugins" :key="`${index}-platform`">
                    <div v-if="(plugin.name !== 'homebridge' && (user.admin || plugin.scope === 'hoobs')) && platformIndex(plugin) >= 0">
                        <h2 v-if="plugin.name === 'google-home'" :id="plugin.name">Google Home</h2>
                        <h2 v-else :id="plugin.name">{{ platformTitle(plugin) }}</h2>
                        <p v-if="plugin.name === 'google-home'">
                            <span>
                                <div class="button button-primary" v-on:click="gsh">Link Account</div>
                            </span>
                        </p>
                        <p v-else-if="plugin.description !== ''">
                            {{ plugin.description }}
                        </p>
                        <div v-if="plugin.schema && plugin.schema.platform.schema.properties">
                            <schema-form :schema="plugin.schema.platform.schema.properties || {}" v-model="configuration.platforms[platformIndex(plugin)]" />
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
        <modal-dialog v-if="show.accessories" width="450px" :title="$t('add_accessory')" :cancel="cancelAccessory">
            <div v-for="(key, index) in accessoryKeys" :key="`${index}-add-accessory`" class="button button-primary add-accessory-button" v-on:click="insertAccessory(key)">
                {{ accessories[key].title }} <span class="icon">chevron_right</span>
            </div>
            <div class="button button-primary add-accessory-button" v-on:click="insertAccessory()">
                {{ $t("custom") }} <span class="icon">chevron_right</span>
            </div>
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

    import ModalDialog from "@/components/modal-dialog.vue";
    import SchemaForm from "@/components/schema-form.vue";
    import Marquee from "@/components/loading-marquee.vue";
    import ConfirmDelete from "@/components/confirm-delete.vue";

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
            "modal-dialog": ModalDialog,
            "schema-form": SchemaForm,
            "loading-marquee": Marquee,
            "confirm-delete": ConfirmDelete
        },

        computed: {
            running() {
                return this.$store.state.running;
            },

            user() {
                return this.$store.state.user;
            },

            pluginAlias() {
                const schemas = {};

                for (let i = 0; i < this.plugins.length; i++) {
                    if (this.plugins[i].schema && this.plugins[i].schema.accessories) {
                        schemas[this.plugins[i].name] = this.plugins[i].schema.accessories.plugin_alias;
                    } else if (this.plugins[i].schema && this.plugins[i].schema.platform) {
                        schemas[this.plugins[i].name] = this.plugins[i].schema.platform.plugin_alias;
                    }
                }

                return schemas;
            },

            accessories() {
                const schemas = {};

                for (let i = 0; i < this.plugins.length; i++) {
                    if (this.plugins[i].schema) {
                        for (let j = 0; j < this.plugins[i].schema.accessories.schemas.length; j++) {
                            schemas[`${this.plugins[i].name}-:-${j}`] = this.plugins[i].schema.accessories.schemas[j];
                        }
                    }
                }

                return schemas;
            },

            accessoryKeys() {
                return Object.keys(this.accessories);
            },

            system() {
                return this.$system;
            }
        },

        data() {
            return {
                loaded: false,
                working: false,
                reload: false,
                configuration: {
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
                binaryReverse: [{
                    text: this.$t("yes"),
                    value: false
                },{
                    text: this.$t("no"),
                    value: true
                }],
                plugins: [],
                errors: [],
                show: {
                    accessories: false
                },
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

            if (window.location.hash && window.location.hash !== "" && window.location.hash !== "#") {
                if (window.location.hash === "#add-accessory") {
                    document.querySelector("#accessories").scrollIntoView();

                    this.addAccessory();
                } else if (document.querySelector(window.location.hash)) {
                    document.querySelector(window.location.hash).scrollIntoView();
                } else {
                    document.querySelector("#accessories").scrollIntoView();
                }

                window.history.pushState("", document.title, window.location.pathname);
            }

            window.addEventListener("message", this.gshListner, false);
        },

        destroyed() {
            if (this.gshOriginCheck) {
                clearInterval(this.gshOriginCheck);
            }

            window.removeEventListener("message", this.gshListner);

            if (this.gshPopup) {
                this.gshPopup.close();
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
                await this.$configure();

                const client = await this.client.get("/config/client");

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

            cancelAccessory() {
                this.show.accessories = false;
            },

            addAccessory() {
                this.show.accessories = true;
            },

            insertAccessory(key) {
                if (key) {
                    const plugin = key.split("-:-")[0];
                    const index = parseInt(key.split("-:-")[1]);

                    this.show.accessories = false;

                    const accessory = {
                        accessory: this.pluginAlias[plugin],
                        plugin_map: {
                            plugin_name: plugin,
                            index
                        }
                    };

                    this.configuration.accessories.push(accessory);
                } else {
                    this.show.accessories = false;

                    this.configuration.accessories.push({
                        accessory: ""
                    });
                }
            },

            removeAccessory(index) {
                this.configuration.accessories.splice(index, 1);
            },

            accessoryKey(accessory) {
                return `${accessory.plugin_map.plugin_name}-:-${accessory.plugin_map.index}`;
            },

            accessoryPlugin(accessory) {
                const index = this.plugins.findIndex(p => p.name === accessory.plugin_map.plugin_name);

                return this.humanize(this.plugins[index].schema.accessories.plugin_alias);
            },

            accessoryCode(index) {
                return JSON.stringify(this.configuration.accessories[index], null, 4);
            },

            platformIndex(plugin) {
                const index = this.configuration.platforms.findIndex(p => (p.plugin_map || {}).plugin_name === plugin.name);
                const platformSchema = (plugin.schema || {}).platform || {};

                if (index >= 0 && platformSchema.plugin_alias && (!this.configuration.platforms[index].platform || this.configuration.platforms[index].platform !== platformSchema.plugin_alias)) {
                    this.configuration.platforms[index].platform = platformSchema.plugin_alias;
                }

                return index;
            },

            platformTitle(plugin) {
                const index = this.platformIndex(plugin);
                const platformSchema = (plugin.schema || {}).platform || {};

                if (index === -1) {
                    return this.humanize((platformSchema.plugin_alias || plugin.name || "").split(".")[0]);
                }

                return this.humanize((platformSchema.plugin_alias || this.configuration.platforms[index].platform || plugin.name || "").split(".")[0]);
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
                string = Inflection.titleize(Decamelize(string.replace(/-/gi, " ").replace(/homebridge/gi, "").trim()));

                string = string.replace(/smart things/gi, "SmartThings");
                string = string.replace(/smartthings/gi, "SmartThings");
                string = string.replace(/my q/gi, "myQ");
                string = string.replace(/myq/gi, "myQ");

                return string;
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

                    if (this.reload) {
                        window.location.reload();
                    }

                    this.load();
                } else {
                    this.working = false;
                }
            },

            gsh() {
                const width = 450;
                const height = 700;
                const top = window.top.outerHeight / 2 + window.top.screenY - (height / 2);
                const left = window.top.outerWidth / 2 + window.top.screenX - (width / 2);

                this.gshPopup = window.open(
                    "https://homebridge-gsh.iot.oz.nu/link-account",
                    "oznu-google-smart-home-auth",
                    `toolbar=no, location=no, directories=no, status=no, menubar=no scrollbars=no, resizable=no, copyhistory=no, width=${width}, height=${height}, top=${top}, left=${left}`,
                );

                this.gshOriginCheck = setInterval(() => {
                    this.gshPopup.postMessage("origin-check", "https://homebridge-gsh.iot.oz.nu");
                }, 2000);
            },

            gshListner(event) {
                if (event.origin === "https://homebridge-gsh.iot.oz.nu") {
                    try {
                        const data = JSON.parse(event.data);

                        if (data.token) {
                            this.gshProcessToken(data.token);
                        }
                    } catch (error) {
                        console.error(error);
                    }
                }
            },

            gshProcessToken(token) {
                if (this.gshOriginCheck) {
                    clearInterval(this.gshOriginCheck);
                }

                this.gshOriginCheck = null;

                if (this.gshPopup) {
                    this.gshPopup.close();
                }

                this.gshPopup = null;

                const index = this.configuration.platforms.findIndex(p => (p.plugin_map || {}).plugin_name === "google-home");

                this.configuration.platforms[index].token = token;

                this.save();
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
</style>
