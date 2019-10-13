<template>
    <div id="sensor">
        <div class="inner">
            <div>
                <div class="title">
                    <div class="title-inner">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                            <path fill="#cccccc" d="M12,12c3,0,5.5-2.5,5.5-5.5S15,1,12,1S6.5,3.5,6.5,6.5S9,12,12,12z M12,14.8c-3.7,0-11,1.8-11,5.5V23h22v-2.8 C23,16.6,15.7,14.8,12,14.8z" />
                        </svg>
                        {{ $t("occupancy") }}
                    </div>
                </div>
                <div :class="color">{{ sensorState }}</div>
                <div v-if="lock" class="name">
                    <input type="text" ref="field" v-model="value.alias" v-on:blur="rename()" @keyup.enter="rename()" :placeholder="value.name || value.service_name" />
                </div>
                <div v-else class="name">{{ value.alias || value.name || value.service_name }}</div>
            </div>
        </div>
        <div v-if="lock" class="lock"></div>
    </div>
</template>

<script>
    export default {
        name: "occupancy-sensor",

        props: {
            value: Object,
            lock: {
                type: Boolean,
                default: false
            }
        },

        computed: {
            sensorState() {
                return this.value.values.occupancy_detected ? this.$t("present"): this.$t("away");
            },

            color() {
                return this.value.values.occupancy_detected ? "value value-on": "value";
            }
        },

        methods: {
            rename() {
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
        width: 130px;
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
        justify-content: space-around;
        align-content: center;
        align-items: center;
        font-size: 18px;
    }

    #sensor .title svg {
        height: 24px;
        margin: 0 5px 0 0;
    }

    #sensor .title-inner {
        display: flex;
        margin: 0 auto;
        align-content: center;
        align-items: center;
    }

    #sensor .value {
        font-weight: bold;
        font-size: 24px;
        line-height: 24px;
        padding: 20px 0;
        color: var(--text);
    }

    #sensor .value-on {
        color: var(--title-text);
    }

    @media (min-width: 300px) and (max-width: 815px) {
        #sensor {
            padding: 0;
        }
    }
</style>
