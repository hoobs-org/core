<template>
    <div id="status">
        <div v-if="showPin" class="info">
            <div v-if="info" class="pin" v-on:click="showPinDialog()">
                <setup-pin v-if="info" :code="info.home_setup_pin" :setup="info.home_setup_id" />
            </div>
            <p v-if="info" class="note">
                {{ $t("setup_id_message") }}
            </p>
        </div>
        <div class="content">
            <div class="chart">
                <line-chart id="system-load" height="100%" suffix="%" :discrete="true" :data="graph" :min="0" :max="100" :colors="colors" :curve="false" legend="bottom" />
            </div>
            <div :class="$client.hide_setup_pin ? 'details singluar' : 'details'">
                <table>
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
        <modal-dialog v-if="pin" :title="$t('home_pin')" :ok="closePinDialog">
            <div class="pin-scan-surface">
                <svg version="1.1" style="fill-rule: evenodd;" width="100%" viewBox="0 0 9534 2622" xmlns="http://www.w3.org/2000/svg">
                    <path fill="#000000" d="M566 26l1437 0c312,0 566,255 566,566l0 1438c0,311 -254,566 -566,566l-1437 0c-311,0 -566,-255 -566,-566l0 -1438c0,-311 255,-566 566,-566z" />
                    <path fill="#ffffff" d="M1974 2133l-1359 0c-28,0 -56,-28 -56,-55l0 -694 -194 0c-14,0 -42,-14 -42,-28 -13,-14 0,-41 14,-55l916 -902c14,-14 55,-14 69,0l291 292 0 -125c0,-28 28,-42 42,-42l319 0c28,0 42,28 42,42l0 513 222 222c14,14 14,28 14,55 -14,14 -28,28 -42,28l-194 0 0 694c0,27 -14,55 -42,55zm-1318 -97l1277 0 0 -694c0,-27 27,-41 41,-41l125 0 -153 -167c-13,-13 -13,-27 -13,-27l0 -486 -222 0 0 180c0,14 -14,42 -28,42 -14,14 -42,0 -56,-14l-333 -333 -804 791 125 0c27,0 41,28 41,42l0 707z" />
                    <path fill="#ffffff" d="M795 1356c-14,-14 -14,-55 0,-69 139,-125 305,-180 486,-180 180,0 360,69 485,180 14,14 28,42 0,69 -14,14 -42,28 -69,0 -111,-97 -264,-166 -430,-166 -153,0 -306,55 -430,166 14,14 -14,14 -42,0z" />
                    <path fill="#ffffff" d="M934 1523c-14,-14 -14,-56 14,-70 97,-69 222,-111 346,-111 125,0 250,42 347,111 28,14 28,42 14,70 -14,28 -42,28 -69,14 -84,-70 -194,-97 -292,-97 -111,0 -208,27 -291,97 -28,14 -55,14 -69,-14z" />
                    <path fill="#ffffff" d="M1447 1717c-97,-55 -222,-55 -305,0 -28,14 -56,14 -70,-14 -13,-28 -13,-55 14,-69 125,-83 292,-83 416,0 28,14 28,41 14,69 -27,28 -55,28 -69,14z" />
                    <path fill="#000000" d="M2807 0l6727 0 0 2622 -6727 0 0 -2622zm130 130l6467 0 0 2362 -6467 0 0 -2362z" />
                    <text class="svg-code" x="6204" y="1563" text-anchor="middle">{{ info.home_setup_pin }}</text>
                </svg>
            </div>
        </modal-dialog>
    </div>
</template>

<script>
    import ModalDialog from "@/components/modal-dialog.vue";
    import SetupPIN from "@/components/setup-pin.vue";

    export default {
        name: "status",

        components: {
            "modal-dialog": ModalDialog,
            "setup-pin": SetupPIN
        },

        computed: {
            graph() {
                return [{
                    name: `${this.$t("hoobs")} (${this.running ? this.$t("running") : this.$t("stopped")})`,
                    data: []
                }, {
                    name: `${this.$t("cpu")} ${(this.cpu || {}).used || 0}%`,
                    data: this.cpu.history
                }, {
                    name: `${this.$t("memory")} ${(this.memory || {}).load || 0}% (${((this.memory || {}).used || {}).value || 0} ${((this.memory || {}).used || {}).units || "MB"})`,
                    data: this.memory.history
                }, {
                    name: `${this.running ? this.$t("uptime") : this.$t("downtime")} ${(this.uptime || {}).days || 0} ${this.$t("days")} ${(this.uptime || {}).hours || 0} ${this.$t("hours")} ${(this.uptime || {}).minutes || 0} ${this.$t("minutes")}`,
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
                return !this.$client.hide_setup_pin;
            }
        },

        data() {
            return {
                info: null,
                pin: false
            };
        },

        async mounted() {
            this.info = await this.api.get("/");
        },

        methods: {
            showPinDialog() {
                this.pin = true;
            },

            closePinDialog() {
                this.pin = false;
            }
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
        cursor: pointer;
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

    #status .details table tr th {
        padding: 10px;
        text-align: left;
        border-bottom: 2px var(--border-dark) solid;
        color: var(--pin-color);
    }

    #status .details table tr td {
        padding: 10px;
        text-align: left;
        border-bottom: 1px var(--border) solid;
    }

    #status .details table tr:last-child td {
        border-bottom: 0 none;
    }

    #status .details table .empty {
        padding: 30px;
        text-align: center;
    }

    #status .pin-scan-surface {
        padding: 20px;
    }

    #status .svg-code {
        fill: #000000;
        font-weight: bold;
        font-size: 808.476px;
        font-family: "Scancardium";
    }

    @media (min-width: 300px) and (max-width: 815px) {
        #status .info,
        #status .chart {
            display: none;
        }

        #status .details {
            padding: 10px 20px 20px 20px;
        }

        #status .details table tr {
            display: flex;
            flex-direction: column;
        }

        #status .details table tr td {
            padding: 0 10px 10px 10px;
        }

        #status .details table tr td:first-child {
            border: 0 none;
            padding: 10px 10px 0 10px;
            font-weight: bold;
        }
    }
</style>
