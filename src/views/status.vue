<template>
    <div id="status">
        <div v-if="showPin" class="info">
            <div v-if="info" class="pin">
                <setup-pin v-if="info" :code="info.home_setup_pin" :setup="info.home_setup_id" />
            </div>
            <p v-if="info" class="note">
                {{ $t("setup_id_message") }}
            </p>
        </div>
        <div class="content">
            <div class="chart">
                <line-chart v-if="cpu.used && memory.load" id="system-load" height="100%" suffix="%" :discrete="true" :data="graph" :min="0" :max="100" :colors="colors" :curve="false" legend="bottom" />
            </div>
            <div :class="client.hide_setup_pin ? 'details singluar' : 'details'">
                <table>
                    <thead>
                        <tr>
                            <th style="width: 30%;">{{ $t("name") }}</th>
                            <th style="width: 70%;">{{ $t("value") }}</th>
                        </tr>
                    </thead>
                    <tbody v-if="running">
                        <tr v-for="(value, name) in info" :key="name">
                            <td>{{ $t(name) }}</td>
                            <td>{{ value }}</td>
                        </tr>
                    </tbody>
                    <tbody v-else>
                        <tr>
                            <td colspan="2" class="empty">{{ $t("service_stoped_message") }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<script>
    import SetupPIN from "@/components/setup-pin.vue";

    export default {
        name: "status",
        components: {
            "setup-pin": SetupPIN
        },
        computed: {
            graph() {
                return [{
                    name: `${this.$t("hoobs")} (${this.running ? this.$t("running") : this.$t("stopped")})`,
                    data: []
                }, {
                    name: `${this.$t("cpu")} ${this.cpu.used}%`,
                    data: this.cpu.history
                }, {
                    name: `${this.$t("memory")} ${this.memory.load}% (${this.memory.used.value} ${this.memory.used.units})`,
                    data: this.memory.history
                }, {
                    name: `${this.running ? this.$t("uptime") : this.$t("downtime")} ${this.uptime.days} ${this.$t("days")} ${this.uptime.hours} ${this.$t("hours")} ${this.uptime.minutes} ${this.$t("minutes")}`,
                    data: []
                }];
            },

            colors() {
                return [
                    this.running ? "#019420" : "#940101",
                    "#f9bd2b",
                    "#e75a0e",
                    "#999999"
                ];
            },

            running() {
                return this.$store.state.running;
            },

            uptime() {
                return this.$store.state.uptime;
            },

            cpu() {
                return this.$store.state.cpu;
            },

            memory() {
                return this.$store.state.memory;
            },

            showPin() {
                return !this.client.hide_setup_pin;
            }
        },

        data() {
            return {
                info: null
            };
        },

        async mounted() {
            this.info = await this.api.get("/");
        }
    };
</script>

<style scoped>
    #status {
        flex: 1;
        padding: 0;
        display: flex;
        flex-direction: row;
        overflow: hidden;
    }

    #status .info {
        width: 258px;
        padding: 20px 0 20px 20px;
    }

    #status .pin {
        background: var(--background);
        box-shadow: var(--elevation-small);
        border-radius: 3px;
    }

    #status .info .note {
        font-size: 12px;
    }

    #status .content {
        flex: 1;
        display: flex;
        flex-direction: column;
    }

    #status .chart {
        height: 36%;
        padding: 20px 20px 0 10px;
    }

    #status .details {
        flex: 1;
        padding: 10px 20px 20px 57px;
        overflow: auto;
    }

    #status .singluar {
        padding: 10px 20px 20px 20px;
    }

    #status .details table {
        width: 100%;
        border-spacing: 0;
    }

    #status .details table th {
        padding: 10px;
        text-align: left;
        border-bottom: 2px var(--border-dark) solid;
        color: var(--pin-color);
    }

    #status .details table td {
        padding: 10px;
        text-align: left;
        border-bottom: 1px var(--border) solid;
    }

    #status .details table .empty {
        padding: 30px;
        text-align: center;
    }
</style>
