<template>
    <div id="pin">
        <qrcode v-if="info" :value="info.home_setup_id" :options="options" />
        <p v-if="info" class="note">
            {{ $t("setup_id_message") }}
        </p>
    </div>
</template>

<script>
    import QRCode from "@chenfengyuan/vue-qrcode";

    export default {
        name: "setup-pin",

        props: {
            value: Array,
            index: Number
        },

        components: {
            "qrcode": QRCode
        },

        data() {
            return {
                info: null
            }
        },

        async mounted() {
            this.info = await this.api.get("/");
        },

        computed: {
            options() {
                return {
                    width: 238,
                    color: {
                        dark: (this.$client.theme || "hoobs-light").endsWith("dark") ? "#feb400" : "#515151",
                        light: "#ffffff00"
                    }
                };
            }
        }
    };
</script>

<style scoped>
    #pin {
        padding: 0;
        display: flex;
        flex-direction: column;
        align-content: center;
        align-items: center;
        border-radius: 3px;
    }

    #pin canvas {
        margin: 0 0 -40px 0;
    }

    #pin .note {
        padding: 10px 30px;
        font-size: 12px;
    }
</style>
