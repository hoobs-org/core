<!-------------------------------------------------------------------------------------------------
 | hoobs-core                                                                                     |
 | Copyright (C) 2020 HOOBS                                                                       |
 |                                                                                                |
 | This program is free software: you can redistribute it and/or modify                           |
 | it under the terms of the GNU General Public License as published by                           |
 | the Free Software Foundation, either version 3 of the License, or                              |
 | (at your option) any later version.                                                            |
 |                                                                                                |
 | This program is distributed in the hope that it will be useful,                                |
 | but WITHOUT ANY WARRANTY; without even the implied warranty of                                 |
 | MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the                                  |
 | GNU General Public License for more details.                                                   |
 |                                                                                                |
 | You should have received a copy of the GNU General Public License                              |
 | along with this program.  If not, see <http://www.gnu.org/licenses/>.                          |
 -------------------------------------------------------------------------------------------------->

<template>
    <div id="plugin">
        <div>
            <span v-if="plugin.installed && !plugin.local">
                <span v-if="plugin.replaces || checkVersion(plugin.installed, plugin.version)" class="status">{{ $t("update_available") }}</span>
                <span v-else class="status">{{ $t("updated") }}</span>
            </span>
            <div v-if="plugin.certified" class="certified">
                <div class="logo" v-html="$theme.logo.certified"></div>
                <span><b>HOOBS</b> Certified</span>
            </div>
            <h3>{{ humanize(plugin) }}</h3>
            <span class="version">
                {{ plugin.installed || plugin.version }}
                <span v-if="!plugin.local">{{ $t("published") }} {{ formatDate(plugin.date.replace(/\s/, "T")) }} {{ getAgeDisplay(plugin.date.replace(/\s/, "T")) }}</span>
            </span>
            <p v-if="!plugin.local">{{ plugin.description }}</p>
            <p v-if="plugin.local">{{ plugin.links.directory }}</p>
        </div>
        <div v-if="!plugin.local && !working" class="actions">
            <div v-if="plugin.installed">
                <router-link :to="`/plugin/${identifier()}`" class="button">{{ $t("details") }}</router-link>
                <div v-if="plugin.replaces" v-on:click.stop="replace()" class="button button-primary">{{ $t("update") }}</div>                
                <div v-else-if="checkVersion(plugin.installed, plugin.version)" v-on:click.stop="update()" class="button button-primary">{{ $t("update") }}</div>
                <confirm-delete class="uninstall" :title="$t('uninstall')" :subtitle="$t('uninstall')" :confirmed="uninstall" />
                <router-link class="config-link" :to="`/config/${plugin.name}`"><span class="icon">settings</span> {{ $t("config") }}</router-link>
            </div>
            <div v-else>
                <router-link :to="`/plugin/${identifier()}`" class="button">{{ $t("details") }}</router-link>
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

            identifier() {
                if (this.plugin.replaces) {
                    return encodeURIComponent(this.plugin.replaces)
                }

                return encodeURIComponent(this.plugin.scope ? `@${this.plugin.scope}/${this.plugin.name}` : this.plugin.name)
            },

            humanize(plugin) {
                let name = Inflection.titleize(Decamelize(plugin.name.replace(/-/gi, " ").replace(/homebridge/gi, "").trim()));

                name = name.replace(/smart things/gi, "SmartThings");
                name = name.replace(/smartthings/gi, "SmartThings");
                name = name.replace(/my q/gi, "myQ");
                name = name.replace(/myq/gi, "myQ");
                name = name.replace(/rgb/gi, "RGB");
                name = name.replace(/ffmpeg/gi, "FFMPEG");
                name = name.replace(/hoobs/gi, "HOOBS");

                return name;
            },

            async install() {
                this.working = true;

                await this.api.put(`/plugin/${encodeURIComponent(`${this.plugin.scope ? `@${this.plugin.scope}/${this.plugin.name}` : this.plugin.name}@${this.plugin.version}`)}?socketed=true`);
            },

            async replace() {
                this.working = true;

                await this.api.put(`/plugin/${encodeURIComponent(`${this.plugin.scope ? `@${this.plugin.scope}/${this.plugin.name}` : this.plugin.name}@${this.plugin.version}`)}?replace=${encodeURIComponent(this.plugin.replaces)}&socketed=true`);
            },

            async uninstall() {
                this.working = true;

                await this.api.delete(`/plugin/${this.identifier()}?socketed=true`);
            },

            async update() {
                this.working = true;

                await this.api.post(`/plugin/${encodeURIComponent(`${this.plugin.scope ? `@${this.plugin.scope}/${this.plugin.name}` : this.plugin.name}@${this.plugin.version}`)}?socketed=true`);
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
