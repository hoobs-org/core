<template>
    <div id="plugin" v-if="(user.admin || plugin.scope === 'hoobs')">
        <p v-if="plugin.name === 'google-home'">
            <span>
                <div class="button button-primary" v-on:click="gsh">Link Account</div>
            </span>
        </p>
        <p v-else-if="plugin.description !== ''">
            {{ plugin.description }}
        </p>
        <div v-if="plugin.details.findIndex(p => p.type === 'platform') >= 0">
            <div v-if="plugin.schema && plugin.schema.platform.schema.properties">
                <schema-form :schema="plugin.schema.platform.schema.properties || {}" v-model="value.platforms[platformIndex()]" />
            </div>
            <div v-else>
                <json-editor name="platform" :height="200" :index="platformIndex()" :change="updateJson" :code="platformCode()" />
            </div>
        </div>
        <div v-if="plugin.details.findIndex(p => p.type === 'accessory') >= 0">
            <div v-for="(key, index) in getAccessoryIndex()" :key="`${index}-accessory`">
                <div v-if="value.accessories[key].plugin_map && accessories[accessoryKey(value.accessories[key])]">
                    <div class="accessory-title">
                        <h3>{{ accessories[accessoryKey(value.accessories[key])].title || humanize(alias) }}</h3>
                        <confirm-delete :title="$t('delete')" :index="key" :confirmed="removeAccessory" />
                    </div>
                    <schema-form :schema="accessories[accessoryKey(value.accessories[key])].properties || {}" v-model="value.accessories[key]" />
                </div>
                <div v-else-if="user.admin">
                    <div class="accessory-title">
                        <h3>{{ $t("accessory") }}</h3>
                        <confirm-delete :title="$t('delete')" :index="key" :confirmed="removeAccessory" />
                    </div>
                    <json-editor name="accessory" :height="200" :index="key" :change="updateJson" :code="accessoryCode(key)" />
                </div>
            </div>
            <div class="action">
                <div v-on:click.stop="addAccessory()" class="button">{{ $t("add_accessory") }}</div>
            </div>
        </div>
        <modal-dialog v-if="show.accessories" width="450px" :title="$t('add_accessory')" :cancel="cancelAccessory">
            <div v-for="(key, index) in Object.keys(this.accessories)" :key="`${index}-add-accessory`" class="button button-primary add-accessory-button" v-on:click="insertAccessory(key)">
                {{ accessories[key].title }} <span class="icon">chevron_right</span>
            </div>
        </modal-dialog>
    </div>
</template>

<script>
    import Decamelize from "decamelize";
    import Inflection from "inflection";

    import JSONEditor from "@/components/json-editor.vue";
    import ModalDialog from "@/components/modal-dialog.vue";
    import SchemaForm from "@/components/schema-form.vue";
    import ConfirmDelete from "@/components/confirm-delete.vue";

    export default {
        name: "plugin-config",

        components: {
            "json-editor": JSONEditor,
            "modal-dialog": ModalDialog,
            "schema-form": SchemaForm,
            "confirm-delete": ConfirmDelete
        },

        props: {
            value: Object,
            plugin: Object,
            save: Function,
            error: Function,
            fix: Function
        },

        data() {
            return {
                show: {
                    accessories: false
                }
            }
        },

        computed: {
            user() {
                return this.$store.state.user;
            },

            alias() {
                if (this.plugin.schema && this.plugin.schema.accessories) {
                    return this.plugin.schema.accessories.plugin_alias || this.plugin.details.filter(p => p.type === "accessory")[0].alias;
                } else if (this.plugin.schema && this.plugin.schema.platform) {
                    return this.plugin.schema.platform.plugin_alias || this.plugin.details.filter(p => p.type === "platform")[0].alias;
                }

                return this.plugin.details[0].alias;
            },

            accessories() {
                const schemas = {};

                if (this.plugin.schema) {
                    for (let i = 0; i < this.plugin.schema.accessories.schemas.length; i++) {
                        schemas[`${this.plugin.name}-:-${i}`] = this.plugin.schema.accessories.schemas[i];
                    }
                }

                return schemas;
            }
        },

        async mounted() {
            if (this.plugin.name === "google-home") {
                window.addEventListener("message", this.gshListner, false);
            }
        },

        destroyed() {
            if (this.plugin.name === "google-home") {
                if (this.gshOriginCheck) {
                    clearInterval(this.gshOriginCheck);
                }

                window.removeEventListener("message", this.gshListner);

                if (this.gshPopup) {
                    this.gshPopup.close();
                }
            }
        },

        methods: {
            title() {
                if (this.plugin.name === "google-home") {
                    return "Google Home";
                }

                const index = this.platformIndex();
                const platform = (this.plugin.schema || {}).platform || {};
                const accessory = (this.plugin.schema || {}).accessories || {};

                if (index === -1) {
                    return this.humanize((platform.plugin_alias || accessory.plugin_alias || this.plugin.name || "Unknown Plugin").split(".")[0]);
                }

                return this.humanize((platform.plugin_alias || this.value.platforms[index].platform || this.plugin.name || "Unknown Plugin").split(".")[0]);
            },

            platformCode() {
                let index = this.platformIndex();

                if (index === -1) {
                    this.value.platforms.push({
                        platform: this.plugin.details.filter(p => p.type === "platform")[0].alias,
                        plugin_map: {
                            plugin_name: this.plugin.name
                        }
                    });

                    index = this.platformIndex();
                }

                const copy = JSON.parse(JSON.stringify(this.value.platforms[index]));

                delete copy.plugin_map;

                return JSON.stringify(copy, null, 4);
            },

            accessoryCode(index) {
                const copy = JSON.parse(JSON.stringify(this.value.accessories[index]));

                delete copy.plugin_map;

                return JSON.stringify(copy, null, 4);
            },

            addAccessory() {
                const keys = Object.keys(this.accessories);

                if (keys.length > 1) {
                    this.show.accessories = true;
                } else if (keys.length === 1) {
                    this.insertAccessory(keys[0]);
                } else {
                    this.insertAccessory();
                }
            },

            insertAccessory(key) {
                if (key) {
                    const index = parseInt(key.split("-:-")[1]);

                    this.show.accessories = false;

                    const accessory = {
                        accessory: this.plugin.details.filter(p => p.type === "accessory")[0].alias,
                        plugin_map: {
                            plugin_name: this.plugin.name,
                            index
                        }
                    };

                    this.value.accessories.push(accessory);
                } else {
                    this.show.accessories = false;

                    this.value.accessories.push({
                        accessory: this.plugin.details.filter(p => p.type === "accessory")[0].alias,
                        plugin_map: {
                            plugin_name: this.plugin.name,
                            index: 0
                        }
                    });
                }
            },

            removeAccessory(index) {
                this.value.accessories.splice(index, 1);
            },

            cancelAccessory() {
                this.show.accessories = false;
            },

            platformIndex() {
                const alias = this.plugin.details.filter(p => p.type === "platform").map(p => p.alias);
                const index = this.value.platforms.findIndex(p => alias.indexOf(p.platform) >= 0 || (p.plugin_map || {}).plugin_name === this.plugin.name);
                const platform = (this.plugin.schema || {}).platform || {};

                if (index >= 0 && platform.plugin_alias && (!this.value.platforms[index].platform || this.value.platforms[index].platform !== platform.plugin_alias)) {
                    this.value.platforms[index].platform = platform.plugin_alias;
                }

                return index;
            },

            getAccessoryIndex() {
                const index = [];
                const alias = this.plugin.details.filter(p => p.type === "accessory").map(p => p.alias);

                for (let i = 0; i < this.value.accessories.length; i++) {
                    if (alias.indexOf(this.value.accessories[i].accessory) >= 0) {
                        index.push(i);
                    }
                }

                return index;
            },

            accessoryKey(accessory) {
                return `${accessory.plugin_map.plugin_name}-:-${accessory.plugin_map.index}`;
            },

            updateJson(section, code, index) {
                switch (section) {
                    case "accessory":
                        const accessory = JSON.parse(JSON.stringify(this.value.accessories[index], null, 4));

                        try {
                            this.value.accessories[index] = JSON.parse(code);

                            if (this.fix) {
                                this.fix(this.$t("accessory_invalid_json"));
                            }

                            if (this.value.accessories[index] && Array.isArray(this.value.accessories[index])) {
                                if (this.value.accessories[index].length === 1) {
                                    this.value.accessories[index] = this.value.accessories[index][0];
                                } else {
                                    throw new Error(this.$t("accessory_invalid_json"));
                                }
                            }

                            if (this.value.accessories[index].accessories && Array.isArray(this.value.accessories[index].accessories)) {
                                if (this.value.accessories[index].accessories.length === 1) {
                                    this.value.accessories[index] = this.value.accessories[index].accessories[0];
                                } else {
                                    throw new Error(this.$t("accessory_invalid_json"));
                                }
                            } else if (this.value.accessories[index].accessories) {
                                this.value.accessories[index] = this.value.accessories[index].accessories;
                            }
                        } catch {
                            if (this.error) {
                                this.error(this.$t("accessory_invalid_json"));
                            }
                        } finally {
                            this.value.accessories[index].plugin_map = accessory.plugin_map;
                        }

                        break;

                    case "platform":
                        const platform = JSON.parse(JSON.stringify(this.value.platforms[index], null, 4));

                        try {
                            this.value.platforms[index] = JSON.parse(code);

                            if (this.fix) {
                                this.fix(this.$t("platform_invalid_json"));
                            }

                            if (this.value.platforms[index] && Array.isArray(this.value.platforms[index])) {
                                if (this.value.platforms[index].length === 1) {
                                    this.value.platforms[index] = this.value.platforms[index][0];
                                } else {
                                    throw new Error(this.$t("platform_invalid_json"));
                                }
                            }

                            if (this.value.platforms[index].platforms && Array.isArray(this.value.platforms[index].platforms)) {
                                if (this.value.platforms[index].platforms.length === 1) {
                                    this.value.platforms[index] = this.value.platforms[index].platforms[0];
                                } else {
                                    throw new Error(this.$t("platform_invalid_json"));
                                }
                            } else if (this.value.platforms[index].platforms) {
                                this.value.platforms[index] = this.value.platforms[index].platforms;
                            }
                        } catch {
                            if (this.error) {
                                this.error(this.$t("platform_invalid_json"));
                            }
                        } finally {
                            this.value.platforms[index].plugin_map = platform.plugin_map;
                        }
                        
                        break;
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

                const index = this.value.platforms.findIndex(p => (p.plugin_map || {}).plugin_name === "google-home");

                this.value.platforms[index].token = token;

                if (this.save) {
                    this.save();
                }
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
            }
        }
    }
</script>

<style scoped>
    #plugin .accessory-title {
        margin: 0 0 10px 0;
        padding: 0 0 5px 0;
        border-bottom: 1px var(--border) solid;
        display: flex;
        align-content: flex-end;
        align-items: flex-end;
        justify-content: space-between;
    }

    #plugin h3 {
        margin: 0;
        padding: 0;
        line-height: normal;
        font-size: 18px;
    }

    #plugin p {
        margin: 0 0 20px 0;
    }

    #plugin .accessory-button {
        white-space: normal;
        margin: 0 0 10px 0;
    }

    #plugin .field {
        display: flex;
        flex-direction: column;
        padding: 0 0 20px 0;
    }

    #plugin .field .title {
        font-weight: bold;
    }

    #plugin .field .description {
        font-size: 12px;
    }

    #plugin .field input,
    #plugin .field select,
    #plugin .field textarea {
        padding: 7px;
        font-size: 14px;
        background: var(--input-background);
        color: var(--input-text);
        border: 1px var(--border) solid;
        border-radius: 5px;
    }

    #plugin .field input,
    #plugin .field textarea {
        flex: 1;
    }

    #plugin .field input,
    #plugin .field select {
        height: 33px !important;
    }

    #plugin .field textarea {
        min-height: 107px;
        resize: none;
    }

    #plugin .field input:focus,
    #plugin .field select:focus,
    #plugin .field textarea:focus {
        outline: 0 none;
        border-color: var(--title-text);
    }

    #plugin .action {
        padding: 0 0 20px 0;
    }

    #plugin .add-accessory-button {
        padding: 10px 10px 10px 20px;
        display: block;
        margin: 10px 0 0 0;
        white-space: normal;
        display: flex;
        align-items: center;
        align-content: center;
        justify-content: space-between;
    }

    #plugin .add-accessory-button:first-child {
        margin: 0;
    }
</style>
