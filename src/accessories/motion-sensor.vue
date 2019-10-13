<template>
    <div id="sensor">
        <div class="inner">
            <div>
                <div class="title">
                    <div class="title-inner">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                            <path fill="#cccccc" d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" />
                        </svg>
                        {{ $t("motion") }}
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
        name: "motion-sensor",

        props: {
            value: Object,
            lock: {
                type: Boolean,
                default: false
            }
        },

        computed: {
            sensorState() {
                return this.value.values.motion_detected ? this.$t("detected"): this.$t("no_motion");
            },

            color() {
                return this.value.values.motion_detected ? "value value-on": "value";
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
