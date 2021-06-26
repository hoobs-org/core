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
    <div id="system">
        <div v-if="info" class="info">
            <router-link to="/system/software" :class="section === 'software' ? 'active' : ''">{{ $t("software") }}</router-link>
            <div v-for="(item, title) in info" :key="title">
                <router-link :to="`/system/${title}`" :class="section === title ? 'active' : ''">{{ translate(title) }}</router-link>
            </div>
            <router-link v-if="!$server.docker" to="/system/filesystem" :class="section === 'filesystem' ? 'active' : ''">{{ translate("file_system") }}</router-link>
            <router-link v-if="user.admin" to="/system/terminal" class="mobile-hide">{{ $t("terminal") }}</router-link>
        </div>
        <div v-if="info" ref="content" class="content">
            <div v-if="section === 'software' || screen.width <= 815" class="system-content">
                <h2>{{ $t("software") }}</h2>
                <div v-if="!$server.docker && instances && tasks.length <= 0 && arch === 'arm' && $server.port === 80" class="update-card">
                    <b>HOOBS 4 is Available</b>
                    <ul>
                        <li>Easy Multi-Bridge Configuration</li>
                        <li>Isolate Plugins from Other Plugins</li>
                        <li>Redesigned Interface</li>
                        <li>Camera Support</li>
                        <li>Expanded Accessory Support</li>
                        <li>Desktop App</li>
                        <li>Redesigned Backup and Restore</li>
                        <li>Stable Upgrades</li>
                        <li>Intergrated Node Upgrades</li>
                        <li>Filtered Logs</li>
                        <li>Live Debug Log Switch</li>
                        <li>Encrypted Config Files</li>
                        <li>And Much More ...</li>
                    </ul>
                    <div v-if="!running" class="update-actions">
                        <checkbox id="split" v-model="split"> <label for="split">Seperate Plugins to Individual Bridges</label></checkbox>
                        <div class="button button-primary" v-on:click="prerun()">Start Migration</div>
                    </div>
                    <div v-else class="update-actions">
                        <loading-marquee :height="3" color="--title-text" background="--title-text-dim" />
                    </div>
                </div>
                <div v-if="!$server.docker && instances && tasks.length > 0" class="update-card">
                    <b>HOOBS 4 Migration Steps</b>
                    <ol>
                        <li v-for="(task, index) in tasks" :key="`task:${index}`">{{ task.description }}</li>
                    </ol>
                    <p class="warning" v-if="split">You have chosen to seperate plugins to individual bridges. This will require re-pairing with Apple&reg; Home. It is recommended to remove your old bridges from Apple&reg; Home before migrating.</p>
                    <div v-if="!running" class="update-actions">
                        <div class="button" v-on:click="cancel()">Cancel</div>
                        <div class="button button-primary" v-on:click="migrate()">Migrate</div>
                    </div>
                    <div v-else class="update-actions">
                        <loading-marquee :height="3" color="--title-text" background="--title-text-dim" />
                    </div>
                </div>
                <table v-if="tasks.length <= 0">
                    <tbody>
                        <tr v-for="(value, name) in status" :key="name">
                            <td style="min-width: 250px;">{{ translate(name) }}</td>
                            <td style="width: 100%;">{{ value }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div v-for="(item, title) in info" :key="title">
                <div v-if="tasks.length <= 0 && (section === title || screen.width <= 815)" class="system-content">
                    <h2>{{ translate(title) }}</h2>
                    <table>
                        <tbody>
                            <tr v-for="(value, name) in item" :key="name">
                                <td style="min-width: 250px;">{{ translate(name) }}</td>
                                <td style="width: 100%;">{{ value }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <div v-if="!$server.docker && tasks.length <= 0 && (section === 'filesystem' || screen.width <= 815)" class="system-content">
                <h2>{{ translate("file_system") }}</h2>
                <table>
                    <tbody>
                        <tr v-for="(item, index) in filesystem" :key="index">
                            <td style="min-width: 250px;">{{ item.mount }}</td>
                            <td style="width: 100%;">{{ $t("used") }} {{ item.use }}%</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<script>
    import Checkbox from "vue-material-checkbox";
    import Marquee from "@/components/loading-marquee.vue";

    export default {
        name: "system",

        components: {
            "checkbox": Checkbox,
            "loading-marquee": Marquee
        },

        props: {
            section: String
        },

        computed: {
            user() {
                return this.$store.state.user;
            },

            screen() {
                return this.$store.state.screen;
            }
        },

        data() {
            return {
                arch: null,
                info: null,
                status: null,
                running: false,
                filesystem: null,
                instances: false,
                formatted: "",
                split: false,
                tasks: []
            }
        },

        async mounted() {
            this.tasks = [];

            this.filesystem = await this.api.get("/system/filesystem");
            this.status = await this.api.get("/status");
            this.info = await this.api.get("/system");
            this.instances = (await this.api.get("/migration/instances")).find((item) => item.name === "hoobs") !== undefined;
            this.arch = this.info.operating_system.arch;

            if (window.location.hash && window.location.hash !== "" && window.location.hash !== "#") {
                if (document.querySelector(window.location.hash)) {
                    document.querySelector(window.location.hash).scrollIntoView();
                }
            }
        },

        methods: {
            translate(value) {
                let results = value;

                results = (results || "").replace(/-/gi, "_");
                results = this.$t(results);

                if (results !== value) {
                    return results;
                }

                return this.$humanize(results);
            },

            getTemp(value) {
                if (this.$client.temp_units && this.$client.temp_units === "celsius") {
                    return Math.round(value);
                }

                return Math.round((value * (9/5)) + 32);
            },

            async prerun() {
                this.running = true;

                const response = await this.api.get(`/migration/prerun/hoobs?split=${this.split ? "true": "false"}`);

                if (response.error) {
                    this.instances = false;
                    this.split = false;
                    this.tasks = [];
                } else {
                    this.tasks = response.tasks;
                }

                this.running = false;
            },

            async migrate() {
                this.running = true;

                await this.api.get(`/migration/execute/hoobs?split=${this.split ? "true": "false"}`);

                this.$store.commit("migrate");
            },

            cancel() {
                this.split = false;
                this.tasks = [];
                this.running = false;
            }
        }
    }
</script>

<style scoped>
    #system {
        flex: 1;
        padding: 0;
        display: flex;
        overflow: hidden;
    }

    #system .info {
        width: 230px;
        padding: 20px 0 20px 20px;
        overflow: auto;
    }

    #system .info a,
    #system .info a:link,
    #system .info a:active,
    #system .info a:visited {
        padding: 10px;
        border-bottom: 1px var(--border) solid;
        color: var(--text);
        text-decoration: none;
        display: block;
    }

    #system .info a:hover {
        color: var(--text-dark);
    }

    #system .info .active {
        font-weight: bold;
        color: var(--title-text) !important;
    }

    #system .content {
        flex: 1;
        padding: 20px;
        display: flex;
        flex-direction: column;
        overflow: auto;
    }

    #system .system-content {
        width: 100%;
        max-width: 780px;
        margin: 0;
    }

    #system .update-card {
        padding: 20px;
        display: flex;
        flex-direction: column;
        background: var(--background-light);
        box-shadow: var(--elevation-small);
        border-radius: 3px;
        color: var(--text) !important;
        margin: 10px 0;
    }

    #system .update-card .warning {
        font-weight: bold;
        color: #feb400;
    }

    #system .update-card .update-actions {
        margin: 20px 0 0 0;
    }

    #system .update-card .update-actions .button {
        margin: 10px 10px 0 0;
    }

    #system h2 {
        margin: 20px 0 5px 0;
        padding: 0;
        line-height: normal;
        font-size: 22px;
        color: var(--title-text);
    }

    #system  h2:first-child {
        margin: 0 0 5px 0;
    }

    #system .system-content table {
        width: 100%;
        border-spacing: 0;
        margin: 0 0 30px 0;
    }

    #system .system-content table tr th {
        padding: 10px;
        text-align: left;
        border-bottom: 2px var(--border-dark) solid;
        color: var(--pin-color);
    }

    #system .system-content table tr td {
        padding: 10px;
        text-align: left;
        border-bottom: 1px var(--border) solid;
    }

    #system .system-content table tr:last-child td {
        border-bottom: 0 none;
    }

    #system .system-content table .empty {
        padding: 30px;
        text-align: center;
    }

    @media (min-width: 300px) and (max-width: 815px) {
        #system .info {
            display: none;
        }

        #system .system-content table {
            margin: 0 20px 30px 0;
        }

        #system .system-content table tr {
            display: flex;
            flex-direction: column;
        }

        #system .system-content table tr td {
            padding: 0 10px 10px 10px;
            min-width: unset !important;
            width: unset !important;
        }

        #system .system-content table tr td:first-child {
            border: 0 none;
            padding: 10px 10px 0 10px;
            font-weight: bold;
        }
    }
</style>
