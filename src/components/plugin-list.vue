<template>
    <div id="plugin">
        <div>
            <span v-if="plugin.installed && !plugin.local">
                <span v-if="checkVersion(plugin.installed, plugin.version)" class="status">{{ $t("update_available") }}</span>
                <span v-else class="status">{{ $t("updated") }}</span>
            </span>
            <div v-if="plugin.scope === 'hoobs' && system === 'hoobs'" class="certified">
                <svg width="20" height="20" viewBox="0 0 80 80.92" xmlns="http://www.w3.org/2000/svg">
                    <rect class="logo-svg" x="1.25" y="1.25" width="77" height="78" rx="16.3" />
                    <path class="logo-svg-inner" d="M17,44.62a3.78,3.78,0,0,0,5.56-.13q4.63-4.53,9.24-9.08c2.33-2.3,4.68-4.59,7-6.91.85-.84,1.52-.78,2.37.08,5,5,10,10,15.07,15.05,1.44,1.43,1.42,1.65,0,3.13-1.71,1.75-1.88,1.77-3.32.36q-5.1-5-10.21-10c-2.16-2.11-4.18-2.1-6.32,0q-5,5.07-10.06,10.17c-2.28,2.32-2.27,4.37,0,6.72.45.46.89.94,1.38,1.35a3.87,3.87,0,0,0,5.68-.25C35.16,53.42,37,51.71,38.73,50c.67-.66,1.33-.85,2.05-.13,1.79,1.79,3.57,3.59,5.36,5.39a1,1,0,0,1,0,1.69c-2.24,2-3.86,4.68-6.68,6a2,2,0,0,0-1,2.41,1.89,1.89,0,0,0,1.76,1.56,1.78,1.78,0,0,0,2-1.17,8,8,0,0,1,2.13-2.82c1.36-1.38,2.76-2.72,4.08-4.14a3.85,3.85,0,0,0,0-5.52c-1.92-2-3.86-3.86-5.85-5.74a3.8,3.8,0,0,0-5.67.13c-1.78,1.73-3.59,3.43-5.34,5.18-.86.86-1.59.87-2.39,0-.29-.33-.61-.65-.93-1-.87-.81-.87-1.53,0-2.39q5-5,10-10.07c.91-.93,1.64-1,2.61-.06,3.08,3.09,6.25,6.1,9.34,9.19,3.55,3.54,4.92,3.55,8.44,0,2.26-2.3,2.29-4.31,0-6.58-3.44-3.44-6.92-6.84-10.36-10.27-1.87-1.86-3.68-3.78-5.56-5.61a3.66,3.66,0,0,0-5.53,0c-.93.89-1.91,1.74-2.82,2.64-4.38,4.33-8.62,8.8-13.12,13-1.45,1.34-1.66,1.38-3,0-.21-.21-.4-.44-.63-.63-1-.83-.88-1.56,0-2.47Q28,28.25,38.26,17.78a1.55,1.55,0,0,1,2.61,0c3.12,3,6.29,6,9.46,9.06.33.31.6,1,1.13.75s.22-.91.23-1.39c0-1.45,0-2.9.05-4.35.08-1.79,1.43-1.56,2.62-1.59s2.07.24,2.07,1.69c0,1.6,0,3.2,0,4.8h0c0,1.2.08,2.4,0,3.6A5.48,5.48,0,0,0,58.3,35c1.51,1.46,3.25,2.75,4.05,4.89a1.69,1.69,0,0,0,2,.91,2,2,0,0,0,1.72-1.65,1.81,1.81,0,0,0-.92-2.18c-2.07-.86-3.23-2.73-4.82-4.11a3,3,0,0,1-1-2.52c0-2.5,0-5,0-7.5,0-4.17-1.45-5.59-5.56-5.48a13,13,0,0,0-1.76.21A3.29,3.29,0,0,0,49.14,20c-.35,1.32-.8.93-1.45.3-1.6-1.56-3.23-3.08-4.82-4.64-2.33-2.28-4.34-2.28-6.66.06C29.71,22.3,23.31,29,16.69,35.39,12.44,39.52,13.34,41.28,17,44.62Z" />
                </svg>
                <span><b>{{ title }}</b> Certified</span>
            </div>
            <div v-if="plugin.scope === 'hoobs' && system === 'rocket'" class="certified">
                <svg width="20" height="20" viewBox="0 0 27.1 27" xmlns="http://www.w3.org/2000/svg">
                    <path class="logo-svg" d="M27,8.9c-0.1-0.6-0.2-1.2-0.6-1.7c-0.4-0.7-1.1-1.1-1.8-1.5c-1.3-0.8-2.6-1.5-3.9-2.2 c-1.6-0.9-3.3-1.9-4.9-2.8C15.1,0.2,14.4,0,13.6,0c-1,0-2,0.4-2.8,0.9C9.2,1.8,7.6,2.7,6,3.6C4.7,4.4,3.4,5.1,2.2,5.9 C1.6,6.2,1.1,6.6,0.7,7.2C0.5,7.5,0.4,7.7,0.3,8C0.1,8.7,0,9.3,0,10c0,1.8,0,3.6,0,5.4c0,1.3,0,2.6,0,3.9c0,0.5,0,1,0.1,1.5 c0.1,0.9,0.5,1.7,1.2,2.4c0.1,0.1,0.2,0.2,0.3,0.1c0.5-0.3,1-0.3,1.5-0.3c1.4,0.1,2.5,0.8,3,2.2c0,0.1,0.1,0.2,0.2,0.2 c0.6-0.1,1.2,0.1,1.8,0.5C8.5,26.3,9,26.7,9.6,27c0.2,0,0.4,0,0.6,0c0.5-0.2,0.7-0.6,0.9-1.2c0.1,0.1,0.1,0.2,0.2,0.3 c0.6,0.7,1.3,0.7,1.8-0.1c0.3-0.4,0.4-0.9,0.4-1.4c0.1-0.2,0-0.3,0-0.5c0-1.2-0.2-2.4-0.4-3.6c0-0.2,0-0.3,0.2-0.2 c0.3,0.1,0.5,0,0.8,0c0.2,0,0.2,0,0.2,0.2c-0.1,0.5-0.2,1.1-0.3,1.6c-0.1,0.8-0.2,1.7-0.1,2.5c0,0.6,0.1,1.2,0.6,1.6 c0.5,0.5,1,0.4,1.4-0.1c0.1-0.1,0.2-0.3,0.3-0.4c0.1,0.5,0.4,0.9,0.8,1.1c0.2,0,0.4,0,0.6,0c0.6-0.2,1.1-0.7,1.5-1.2 c0.5-0.3,1.1-0.5,1.7-0.5c0.1,0,0.2,0,0.2-0.2c0.6-1.3,1.6-2,3-2.2c0.5,0,1.1,0.1,1.5,0.3c0.2,0.1,0.3,0,0.3-0.1 c0.6-0.6,0.9-1.3,1.1-2.1c0-0.2,0-0.3,0.1-0.5c0-0.4,0-0.8,0-1.2c0-3.4,0-6.8,0-10.2C27,9.1,27,9,27,8.9z M16.2,10 c0.3,1.1,0.5,2.1,0.6,3.2c0,1-0.1,2-0.4,2.9c0,0.1-0.1,0.3,0.1,0.3h0c1.1,0.9,1.4,2.1,1.2,3.4c-0.1,0.8-0.3,1.6-0.5,2.4 c-0.1-0.2-0.2-0.4-0.2-0.5c-0.4-1-0.9-1.9-1.7-2.7c-0.2-0.2-0.3-0.2-0.5,0c-0.2,0.3-0.5,0.4-0.8,0.4c-0.3,0-0.6,0-0.9,0 c-0.3,0-0.7-0.1-0.8-0.5c-0.1-0.3-0.3-0.2-0.4,0c-0.8,0.7-1.3,1.7-1.7,2.7C10,22,10,22.1,9.9,22.3c-0.1-0.2-0.1-0.4-0.2-0.6 c-0.2-0.7-0.3-1.4-0.4-2c-0.1-1.2,0.2-2.3,1.2-3.1c0.1-0.1,0.2-0.1,0.1-0.3c-0.4-1.2-0.5-2.4-0.4-3.6c0.1-0.9,0.3-1.8,0.6-2.7l0,0 c0.5-1.3,1.2-2.6,2.1-3.7c0.6-0.7,0.6-0.7,1.2,0C15.1,7.4,15.7,8.6,16.2,10" />
                    <path class="logo-svg" d="M13.5,11c-0.8,0-1.5,0.7-1.5,1.5c0,0.8,0.7,1.5,1.5,1.5c0.8,0,1.5-0.7,1.5-1.5C15.1,11.6,14.4,11,13.5,11z" />
                </svg>
                <span>{{ title }} Certified</span>
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
                <div v-on:click.stop="check()" class="button button-primary">{{ $t("install") }}</div>
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
            },

            system() {
                return this.$system;
            },

            title() {
                switch (this.$system) {
                    case "rocket":
                        return "Rocket";
                    
                    default:
                        return "HOOBS";
                }
            }
        },

        data() {
            return {
                working: false,
                formatted: "",
                server: ((this.plugin || {}).keywords || []).indexOf("hoobs-plugin") >= 0 || ((this.plugin || {}).keywords || []).indexOf("homebridge-plugin") >= 0,
                interface: ((this.plugin || {}).keywords || []).indexOf("hoobs-interface") >= 0
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

            async check() {
                if (!this.locked) {
                    const lookup = await this.api.get(`/plugins/certified/lookup/${encodeURIComponent(this.plugin.scope ? `@${this.plugin.scope}/${this.plugin.name}` : this.plugin.name)}`);

                    if (lookup.certified && lookup.package === this.plugin.scope ? `@${this.plugin.scope}/${this.plugin.name}` : this.plugin.name) {
                        await this.uninstall(undefined, lookup.base, true);
                        await this.install(this.plugin.scope, this.plugin.name);
                    } else if (lookup.base === this.plugin.name) {
                        const scope = lookup.package.split("/").replace(/@/gi, "");
                        const name = lookup.package.replace(`@${scope}/`, "");

                        await this.install(scope, name);
                    } else {
                        await this.install(this.plugin.scope, this.plugin.name);
                    }
                }
            },

            async install(scope, name) {
                if (!this.locked) {
                    this.working = true;

                    if (scope === undefined) {
                        scope = this.plugin.scope;
                    }

                    if (name === undefined) {
                        name = this.plugin.name;
                    }

                    const restart = this.running;

                    if (this.server && restart) {
                        this.$store.commit("lock");

                        await this.api.post("/service/stop");
                    }

                    const results = await this.api.put(`/plugins/${encodeURIComponent(scope ? `@${scope}/${name}` : name)}`);

                    if (this.server && restart) {
                        await this.api.post("/service/start");

                        this.$store.commit("unlock");
                    }

                    if (results.success && this.oninstall) {
                        this.oninstall(results.details.type, results.details.name, results.details.alias, results.plugin);
                    }
                }
            },

            async uninstall(scope, name, skipEvents) {
                if (!this.locked) {
                    this.working = true;

                    if (scope === undefined) {
                        scope = this.plugin.scope;
                    }

                    if (name === undefined) {
                        name = this.plugin.name;
                    }

                    const restart = this.running;

                    if (this.server && restart) {
                        this.$store.commit("lock");

                        await this.api.post("/service/stop");
                    }

                    await this.api.delete(`/plugins/${encodeURIComponent(scope ? `@${scope}/${name}` : name)}`);

                    if (this.server && restart) {
                        await this.api.post("/service/start");

                        this.$store.commit("unlock");
                    }

                    if (!skipEvents && this.onuninstall) {
                        this.onuninstall();
                    }
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

                    await this.api.post(`/plugins/${encodeURIComponent(this.plugin.scope ? `@${this.plugin.scope}/${this.plugin.name}` : this.plugin.name)}`);

                    if (this.server && restart) {
                        await this.api.post("/service/start");

                        this.$store.commit("unlock");
                    }

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

    #plugin .certified svg {
        margin: 0 5px 0 0;
    }

    #plugin .logo-svg {
        fill: var(--title-text);
    }

    #plugin .logo-svg-inner {
        fill: var(--background);
    }
</style>
