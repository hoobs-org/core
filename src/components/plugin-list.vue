<template>
    <div id="plugin">
        <div>
            <span v-if="plugin.installed && !plugin.local">
                <span v-if="checkVersion(plugin.installed, plugin.version)" class="status">{{ $t("update_available") }}</span>
                <span v-else class="status">{{ $t("updated") }}</span>
            </span>
            <div v-if="plugin.scope === 'hoobs'" class="certified">
                <div class="logo" v-html="$theme.logo.certified"></div>
                <span><b>HOOBS</b> Certified</span>
            </div>
            <h3>{{ humanize(plugin.name) }}</h3>
            <span class="version">
                {{ plugin.installed || plugin.version }}
                <span v-if="!plugin.local">{{ $t("published") }} {{ formatDate(plugin.date.replace(/\s/, "T")) }} {{ getAgeDisplay(plugin.date.replace(/\s/, "T")) }}</span>
            </span>
            <p v-if="!plugin.local">{{ plugin.description }}</p>
            <p v-if="plugin.local">{{ plugin.links.directory }}</p>
        </div>
        <div v-if="!plugin.local && !working" class="actions">
            <div v-if="plugin.installed">
                <router-link :to="`/plugin/${encodeURIComponent(plugin.scope ? `@${plugin.scope}/${plugin.name}` : plugin.name)}`" class="button">{{ $t("details") }}</router-link>
                <div v-if="checkVersion(plugin.installed, plugin.version)" v-on:click.stop="update()" class="button button-primary">{{ $t("update") }}</div>
                <confirm-delete class="uninstall" :title="$t('uninstall')" :subtitle="$t('uninstall')" :confirmed="uninstall" />
                <router-link class="config-link" :to="`/config/${plugin.name}`"><span class="icon">settings</span> {{ $t("config") }}</router-link>
            </div>
            <div v-else>
                <router-link :to="`/plugin/${encodeURIComponent(plugin.scope ? `@${plugin.scope}/${plugin.name}` : plugin.name)}`" class="button">{{ $t("details") }}</router-link>
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
    import Decamelize from "decamelize";
    import Inflection from "inflection";

    import Versioning from "../versioning";
    import Dates from "../dates";

    import Marquee from "@/components/loading-marquee.vue";
    import ConfirmDelete from "@/components/confirm-delete.vue";

    export default {
        name: "plugin-list",

        components: {
            "loading-marquee": Marquee,
            "confirm-delete": ConfirmDelete
        },

        props: {
            plugin: Object,
            oninstall: Function,
            onuninstall: Function,
            onupdate: Function
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
                formatted: ""
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

            async install() {
                if (!this.locked) {
                    this.working = true;

                    const restart = this.running;

                    if (restart) {
                        this.$store.commit("lock");

                        await this.api.post("/service/stop");
                    }

                    const results = await this.api.put(`/plugins/${encodeURIComponent(`${this.plugin.scope ? `@${this.plugin.scope}/${this.plugin.name}` : this.plugin.name}@${this.plugin.version}`)}`);

                    if (restart) {
                        await this.api.post("/service/start");

                        this.$store.commit("unlock");
                    }

                    this.working = false;

                    if (results.success && this.oninstall) {
                        this.oninstall(results.plugin.name, results.plugin, results.details);
                    } else if (this.onuninstall) {
                        this.onuninstall();
                    }
                }
            },

            async uninstall() {
                if (!this.locked) {
                    this.working = true;

                    const restart = this.running;

                    if (restart) {
                        this.$store.commit("lock");

                        await this.api.post("/service/stop");
                    }

                    await this.api.delete(`/plugins/${encodeURIComponent(`${this.plugin.scope ? `@${this.plugin.scope}/${this.plugin.name}` : this.plugin.name}`)}`);

                    if (restart) {
                        await this.api.post("/service/start");

                        this.$store.commit("unlock");
                    }

                    this.working = false;

                    if (this.onuninstall) {
                        this.onuninstall();
                    }
                }
            },

            async update() {
                if (!this.locked) {
                    this.working = true;

                    const restart = this.running;

                    if (restart) {
                        this.$store.commit("lock");

                        await this.api.post("/service/stop");
                    }

                    await this.api.post(`/plugins/${encodeURIComponent(`${this.plugin.scope ? `@${this.plugin.scope}/${this.plugin.name}` : this.plugin.name}@${this.plugin.version}`)}`);

                    if (restart) {
                        await this.api.post("/service/start");

                        this.$store.commit("unlock");
                    }

                    this.working = false;

                    if (this.onupdate) {
                        this.onupdate();
                    }
                }
            }
        }
    };
</script>

<style scoped>
    #plugin {
        padding: 20px 20px 0 20px;
        margin: 0 0 20px 0;
        background: var(--background-light);
        box-shadow: var(--elevation-small);
        border-radius: 3px;
        display: block;
        color: var(--text) !important;
        text-decoration: none;
    }

    #plugin .loader {
        width: 100%;
        max-width: 390px;
        display: inline-block;
        padding: 15px 0 20px 0;
    }

    #plugin h3 {
        font-size: 20px;
        line-height: normal;
        color: var(--title-text);
        padding: 0;
        margin: 0;
    }

    #plugin .status {
        font-size: 14px;
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

    #plugin .uninstall {
        display: inline;
        margin: 0 10px 0 -10px;
    }

    #plugin p {
        margin: 20px 0 0 0;
    }

    #plugin .config-link {
        padding: 3px 0 0 0;
        display: inline-flex;
        align-content: center;
        align-items: center;
        font-size: 14px;
        color: var(--text);
    }

    #plugin .config-link:hover {
        color: var(--text-dark);
        text-decoration: none;
    }

    #plugin .config-link .icon {
        font-size: 17px;
        margin: 0 2px 0 0;
    }

    #plugin .certified {
        font-size: 14px;
        color: var(--title-text);
        padding: 10px 0;
        display: flex;
        align-content: center;
        align-items: center;
    }

    #plugin .certified .logo {
        margin: 0 5px 0 0;
    }
</style>
