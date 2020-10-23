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
    <div id="chart">
        <line-chart id="system-load" height="100%" suffix="%" :discrete="true" :data="graph" :min="0" :max="100" :colors="colors" :curve="false" legend="bottom" />
    </div>
</template>

<script>
    import QRCode from "@chenfengyuan/vue-qrcode";

    export default {
        name: "system-load",

        props: {
            item: Object,
            index: Number,
            change: Function
        },

        components: {
            "qrcode": QRCode
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
                    this.running ? this.$theme.charts.running : this.$theme.charts.stopped,
                    this.$theme.charts.cpu,
                    this.$theme.charts.memory,
                    this.$theme.charts.uptime
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
            }
        }
    };
</script>

<style scoped>
    #chart {
        height: 100%;
        padding: 30px 20px 15px 10px;
        background: var(--background-light);
        box-shadow: var(--elevation-small);
        border-radius: 3px;
        box-sizing: border-box;
        cursor: default;
    }
</style>
