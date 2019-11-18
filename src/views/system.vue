<template>
    <div id="system">
        <div v-if="info" class="info">
            <router-link to="/system/software" :class="section === 'software' ? 'active' : ''">{{ $t("software") }}</router-link>
            <div v-for="(item, title) in info" :key="title">
                <router-link :to="`/system/${title}`" :class="section === title ? 'active' : ''">{{ translate(title) }}</router-link>
            </div>
            <router-link to="/system/filesystem" :class="section === 'filesystem' ? 'active' : ''">{{ translate("file_system") }}</router-link>
            <router-link v-if="temp && (temp || {}).main >= 0" to="/system/temp" :class="section === 'temp' ? 'active' : ''">{{ translate("temperature") }}</router-link>
            <router-link v-if="user.admin" to="/system/terminal" class="mobile-hide">{{ $t("terminal") }}</router-link>
        </div>
        <div v-if="info" ref="content" class="content">
            <div v-if="section === 'software' || screen.width <= 815" class="system-content">
                <h2>{{ $t("software") }}</h2>
                <div v-if="system === 'hoobs'" class="update-card">
                    <b>HOOBS Core</b>
                    <span v-if="status">Current Version: {{ status[`${system}_version`] }}</span>
                    <div v-if="checking" class="update-actions">
                        <loading-marquee :height="3" color="--title-text" background="--title-text-dim" />
                    </div>
                    <div v-else-if="updates.length > 0" class="update-actions">
                        <b>{{ updates[0].version }} {{ $t("update_available") }}</b><br>
                        <div class="button button-primary" v-on:click="update()">{{ $t("update") }}</div>
                    </div>
                    <div v-else class="update-actions">
                        <b>{{ $t("up_to_date") }}</b>
                    </div>
                </div>
                <div v-if="system === 'rocket'" class="update-card">
                    <b>Rocket Core</b>
                    <span v-if="status">Current Version: {{ status[`${system}_version`] }}</span>
                </div>
                <table>
                    <tbody>
                        <tr v-for="(value, name) in status" :key="name">
                            <td style="min-width: 250px;">{{ translate(name) }}</td>
                            <td style="width: 100%;">{{ value }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div v-for="(item, title) in info" :key="title">
                <div v-if="section === title || screen.width <= 815" class="system-content">
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
            <div v-if="section === 'filesystem' || screen.width <= 815" class="system-content">
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
            <div v-if="temp && (temp || {}).main >= 0 && (section === 'temp' || screen.width <= 815)" class="system-content">
                <h2>{{ translate("temperature") }}</h2>
                <table>
                    <tbody>
                        <tr>
                            <td style="min-width: 250px;">{{ $t("current") }}</td>
                            <td style="width: 100%;">{{ getTemp(temp.main) }}°</td>
                        </tr>
                        <tr>
                            <td style="min-width: 250px;">{{ $t("max") }}</td>
                            <td style="width: 100%;">{{ getTemp(temp.max) }}°</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<script>
    import Decamelize from "decamelize";
    import Inflection from "inflection";

    import Marquee from "@/components/loading-marquee.vue";

    import { setTimeout } from "timers";

    export default {
        name: "system",

        components: {
            "loading-marquee": Marquee
        },

        props: {
            section: String
        },

        computed: {
            user() {
                return this.$store.state.user;
            },

            system() {
                return this.$system;
            },

            screen() {
                return this.$store.state.screen;
            }
        },

        data() {
            return {
                info: null,
                status: null,
                filesystem: null,
                temp: null,
                checking: true,
                updates: []
            }
        },

        async mounted() {
            this.filesystem = await this.api.get("/system/filesystem");
            this.temp = await this.api.get("/system/temp");
            this.status = await this.api.get("/status");
            this.info = await this.api.get("/system");

            if (window.location.hash && window.location.hash !== "" && window.location.hash !== "#") {
                if (document.querySelector(window.location.hash)) {
                    document.querySelector(window.location.hash).scrollIntoView();
                }
            }

            this.checkVersion();
        },

        methods: {
            async checkVersion() {
                this.checking = true;
                this.updates = await this.api.get("/system/updates");

                setTimeout(() => {
                    this.checking = false;
                }, 1000);
            },

            translate(value) {
                let results = value;

                results = (results || "").replace(/-/gi, "_");
                results = this.$t(results);

                if (results !== value) {
                    return results;
                }

                return Inflection.titleize(Decamelize(results.replace(/-/gi, " ").replace(/homebridge/gi, "").trim()));
            },

            async update() {
                this.checking = true;
                this.$store.commit("lock");

                await this.api.post("/service/stop");

                this.api.put("/update");
            },

            getTemp(value) {
                if (this.$client.temp_units && this.$client.temp_units === "celsius") {
                    return Math.round(value);
                }

                return Math.round((value * (9/5)) + 32);
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
