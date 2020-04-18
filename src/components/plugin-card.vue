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
    <router-link id="plugin" :to="`/plugin/${encodeURIComponent(plugin.scope ? `@${plugin.scope}/${plugin.name}` : plugin.name)}`">
        <div>
            <h3>{{ humanize(plugin.name) }}</h3>
            <p>{{ plugin.description }}</p>
            <img style="width: 100%;" :src="plugin.image" />
        </div>
    </router-link>
</template>

<script>
    import Decamelize from "decamelize";
    import Inflection from "inflection";

    import Versioning from "../versioning";

    export default {
        name: "plugin-card",

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
                formatted: ""
            }
        },

        methods: {
            checkVersion(version, latest) {
                return Versioning.checkVersion(version, latest);
            },

            humanize(string) {
                return Inflection.titleize(Decamelize(string.replace(/-/gi, " ").replace("homebridge-", "").trim()));
            }
        }
    };
</script>

<style scoped>
    #plugin {
        width: 192px;
        height: 300px;
        padding: 20px 20px 0 20px;
        margin: 0 20px 20px 0;
        background: var(--background-light);
        box-shadow: var(--elevation-small);
        border-radius: 3px;
        display: block;
        color: var(--text) !important;
        text-decoration: none !important;
        cursor: pointer;
    }

    #plugin h3 {
        font-size: 20px;
        line-height: normal;
        color: var(--title-text);
        padding: 0;
        margin: 0;
    }

    #plugin .actions {
        padding: 20px 0 0 0;
    }

    #plugin .actions .button {
        margin: 0 10px 20px 0;
    }

    #plugin p {
        width: 100%;
        height: 28px;
        margin: 5px 0 20px 0;
        text-overflow: ellipsis;
        overflow: hidden;
        font-size: 12px;
    }

    #plugin img {
        opacity: 0.75;
    }

    #plugin:hover img {
        opacity: 1;
    }
</style>
