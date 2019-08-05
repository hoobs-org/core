<template>
    <div id="pin">
        <qrcode :value="setup" :options="options" />
    </div>
</template>

<script>
    import QRCode from "@chenfengyuan/vue-qrcode";

    export default {
        name: "setup-pin",
        props: {
            code: String,
            setup: String
        },
        components: {
            "qrcode": QRCode
        },
        computed: {
            options() {
                return {
                    width: 258,
                    color: {
                        dark: (this.client.theme || "hoobs-light").endsWith("dark") ? "#feb400" : "#515151",
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
        border-radius: 3px;
    }

    #pin canvas {
        border-radius: 3px;
    }

    #pin .code {
        padding: 0 17px 11px 15px;
        border-radius: 3px;
    }
</style>
