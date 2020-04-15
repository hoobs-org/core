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
