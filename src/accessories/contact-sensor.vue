<template>
    <div id="sensor">
        <div class="inner">
            <div>
                <div class="title">
                    <div class="title-inner">
                        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                            <path fill="#cccccc" d="M416 448h-84c-6.6 0-12-5.4-12-12v-24c0-6.6 5.4-12 12-12h84c26.5 0 48-21.5 48-48V160c0-26.5-21.5-48-48-48h-84c-6.6 0-12-5.4-12-12V76c0-6.6 5.4-12 12-12h84c53 0 96 43 96 96v192c0 53-43 96-96 96zM167.1 83.5l-19.6 19.6c-4.8 4.8-4.7 12.5.2 17.1L260.8 230H12c-6.6 0-12 5.4-12 12v28c0 6.6 5.4 12 12 12h248.8L147.7 391.7c-4.8 4.7-4.9 12.4-.2 17.1l19.6 19.6c4.7 4.7 12.3 4.7 17 0l164.4-164c4.7-4.7 4.7-12.3 0-17l-164.4-164c-4.7-4.6-12.3-4.6-17 .1z" />
                        </svg>
                        {{ $t("contact") }}
                    </div>
                </div>
                <div class="value">{{ sensorState }}</div>
                <div class="name" v-show="edit === false" @dblclick="mode()">{{ value.alias || value.name || value.service_name }}</div>
                <div class="name" v-show="edit === true">
                    <input type="text" ref="field" v-model="value.alias" v-on:blur="rename()" @keyup.enter="rename()" :placeholder="value.name || value.service_name" />
                </div>
            </div>
        </div>
        <div v-if="lock" class="lock"></div>
    </div>
</template>

<script>
    export default {
        name: "contact-sensor",

        props: {
            value: Object,
            lock: {
                type: Boolean,
                default: false
            }
        },

        data() {
            return {
                edit: false
            }
        },

        computed: {
            sensorState() {
                return this.value.values.contact_sensor_state > 0 ? "Open": "Closed";
            }
        },

        methods: {
            mode() {
                if (this.lock) {
                    this.edit = true;

                    setTimeout(() => {
                        this.$refs.field.focus();
                    }, 10);
                }
            },

            rename() {
                this.edit = false;
                this.$emit("change", this.value);
            }
        }
    };
</script>

<style scoped>
    #sensor {
        width: 100%;
        height: 100%;
        box-sizing: border-box;
        padding: 20px 10px 40px 10px;
        display: flex;
        align-items: center;
        align-content: center;
        justify-content: space-around;
        text-align: center;
        font-size: 14px;
        position: relative;
    }

    #sensor .inner {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        align-content: center;
        justify-content: space-around;
        position: relative;
        text-align: center;
        background: var(--background);
        border-radius: 3px;
        box-shadow: var(--elevation-small);
    }

    #sensor .lock {
        position: absolute;
        width: 100%;
        height: 100%;
        z-index: 10;
    }

    #sensor .name {
        height: 38px;
        overflow: hidden;
        position: relative;
        text-overflow: ellipsis;
        z-index: 20;
    }

    #sensor .name input {
        flex: 1;
        padding: 7px;
        font-size: 14px;
        background: var(--input-background);
        color: var(--input-text);
        border: 1px var(--border) solid;
        border-radius: 5px;
    }

    #sensor .name input:focus {
        outline: 0 none;
        border-color: var(--title-text);
    }

    #sensor .title {
        margin: 15px 0 0 0;
        display: flex;
        align-content: center;
        align-items: center;
        font-size: 18px;
    }

    #sensor .title svg {
        height: 24px;
        margin: 0 10px 0 0;
    }

    #sensor .title-inner {
        display: flex;
        margin: 0 auto;
        align-content: center;
        align-items: center;
    }

    #sensor .value {
        font-weight: bold;
        font-size: 38px;
        padding: 7px 0;
        color: var(--title-text);
    }

    @media (min-width: 300px) and (max-width: 815px) {
        #sensor {
            padding: 0;
        }
    }
</style>
