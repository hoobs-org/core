<template>
    <div id="plugin">
        <div>
            <span v-if="plugin.installed && !plugin.local">
                <span v-if="checkVersion(plugin.installed, plugin.version)" class="status">{{ $t("update_available") }}</span>
                <span v-else class="status">{{ $t("updated") }}</span>
            </span>
            <h3>{{ plugin.name }}</h3>
            <span class="version">
                {{ plugin.installed || plugin.version }}
                <span v-if="!plugin.local">{{ $t("published") }} {{ formatDate(plugin.date) }} {{ getAgeDisplay(plugin.date) }}</span>
            </span>
            <p v-if="!plugin.local">{{ plugin.description }}</p>
            <p v-if="plugin.local">{{ plugin.links.directory }}</p>
        </div>
        <div v-if="!plugin.local && !working" class="actions">
            <div v-if="plugin.installed">
                <router-link :to="`/plugin/${plugin.name}`" class="button">{{ $t("details") }}</router-link>
                <div v-if="checkVersion(plugin.installed, plugin.version)" v-on:click.stop="update()" class="button button-primary">{{ $t("update") }}</div>
                <div v-if="plugin.name !== 'homebridge'" v-on:click.stop="uninstall()" class="button">{{ $t("uninstall") }}</div>
            </div>
            <div v-else>
                <router-link :to="`/plugin/${plugin.name}`" class="button">{{ $t("details") }}</router-link>
                <div v-on:click.stop="install()" class="button button-primary">{{ $t("install") }}</div>
            </div>
        </div>
        <div v-if="plugin.local && !working" class="actions"></div>
        <div v-if="working" class="loader">
            <loading-marquee :height="3" color="--title-text" background="--title-text-dim" />
        </div>
        <div v-if="formatted !== ''" v-html="formatted" id="markdown"></div>
    </div>
</template>

<script>
    import Versioning from "../versioning";
    import Dates from "../dates";
    import Marquee from "@/components/loading-marquee.vue";

    export default {
        name: "plugin-list",
        components: {
            "loading-marquee": Marquee
        },
        props: {
            plugin: Object
        },
        computed: {
            locked() {
                return this.$store.state.locked;
            },

            running() {
                return this.$store.state.running;
            }
        },

        data() {
            return {
                working: false,
                formatted: "",
                server: this.plugin.keywords.indexOf("homebridge-plugin") >= 0,
                interface: this.plugin.keywords.indexOf("homebridge-x-plugin") >= 0
            }
        },

        methods: {
            formatDate(date) {
                return Dates.formatDate(date);
            },

            getAgeDisplay(date) {
                const age = Dates.getAgeDisplay(date);

                if (age !== "") {
                    return `• ${age}`;
                }

                return "";
            },

            checkVersion(version, latest) {
                return Versioning.checkVersion(version, latest);
            },

            async install() {
                if (!this.locked) {
                    this.working = true;

                    const restart = this.running;

                    if (this.server && restart) {
                        this.$store.commit("lock");

                        await this.api.post("/service/stop");
                    }

                    await this.api.put(`/plugins/${this.plugin.name}`);

                    if (this.server && restart) {
                        await this.api.post("/service/start");

                        this.$store.commit("unlock");
                    }

                    if (this.interface) {
                        await this.api.post("/service/reload");
                    }

                    this.plugin.installed = this.plugin.version;
                    this.working = false;
                }
            },

            async uninstall() {
                if (!this.locked) {
                    this.working = true;

                    const restart = this.running;

                    if (this.server && restart) {
                        this.$store.commit("lock");

                        await this.api.post("/service/stop");
                    }

                    await this.api.delete(`/plugins/${this.plugin.name}`);

                    if (this.server && restart) {
                        await this.api.post("/service/start");

                        this.$store.commit("unlock");
                    }

                    if (this.interface) {
                        await this.api.post("/service/reload");
                    }

                    this.plugin.installed = false;
                    this.working = false;
                }
            },

            async update() {
                if (!this.locked) {
                    this.working = true;

                    const restart = this.running;

                    if (this.server && restart) {
                        this.$store.commit("lock");

                        await this.api.post("/service/stop");
                    }

                    await this.api.post(`/plugins/${this.plugin.name}`);

                    if (this.server && restart) {
                        await this.api.post("/service/start");

                        this.$store.commit("unlock");
                    }

                    if (this.interface) {
                        await this.api.post("/service/reload");
                    }

                    this.plugin.installed = this.plugin.version;
                    this.working = false;
                }
            }
        }
    };
</script>

<style scoped>
    #plugin {
        padding: 20px 20px 0 20px;
        margin: 0 0 20px 0;
        background: var(--background);
        box-shadow: 0 1px 1px 0 rgba(0, 0, 0, 0.14),
                    0 2px 1px -1px rgba(0, 0, 0, 0.12),
                    0 1px 3px 0 rgba(0, 0, 0, 0.2);
        border-radius: 3px;
        display: block;
        color: var(--text) !important;
        text-decoration: none;
    }

    #plugin .loader {
        width: 100%;
        max-width: 390px;
        display: inline-block;
        padding: 0 0 20px 0;
    }

    #plugin h3 {
        font-size: 20px;
        line-height: normal;
        padding: 0;
        margin: 0;
    }

    #plugin .status {
        font-size: 14px;
        color: var(--title-text);
        font-weight: bold;
    }

    #plugin .upgradeable {
        color: var(--text-highlight);
    }

    #plugin .version {
        color: var(--text-dim);
        font-size: 14px;
    }

    #plugin .actions {
        padding: 20px 0 0 0;
    }

    #plugin .actions .button {
        margin: 0 10px 20px 0;
    }

    #plugin p {
        margin: 20px 0 0 0;
    }
</style>
