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
    }
</style>
