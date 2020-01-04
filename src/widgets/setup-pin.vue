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
            item: Object,
            index: Number,
            change: Function
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
            this.info = await this.api.get("/status");
        },

        computed: {
            options() {
                return {
                    width: 238,
                    color: {
                        dark: this.$theme.qr.background,
                        light: this.$theme.qr.foreground
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
        cursor: default;
    }

    #pin canvas {
        margin: 0 0 -40px 0;
    }

    #pin .note {
        padding: 10px 30px;
        font-size: 12px;
    }
</style>
