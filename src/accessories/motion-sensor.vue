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
                <div class="value" :style="`color: ${color};`">{{ sensorState }}</div>
                <div class="name">{{ accessory.name || accessory.service_name }}</div>
            </div>
        </div>
        <div v-if="lock" class="lock"></div>
    </div>
</template>

<script>
    export default {
        name: "motion-sensor",
        props: {
            accessory: Object,
            value: Boolean,
            lock: {
                type: Boolean,
                default: false
            }
        },

        computed: {
            sensorState() {
                return this.accessory.values.motion_detected ? "Detected": "No Motion";
            },

            color() {
                return this.accessory.values.motion_detected ? "#00b9f1": "#999999";
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
        box-shadow: 0 1px 1px 0 rgba(0, 0, 0, 0.14),
                    0 2px 1px -1px rgba(0, 0, 0, 0.12),
                    0 1px 3px 0 rgba(0, 0, 0, 0.2);
    }

    #sensor .lock {
        position: absolute;
        width: 100%;
        height: 100%;
    }

    #sensor .name {
        height: 38px;
        overflow: hidden;
        text-overflow: ellipsis;
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
        align-content: center;
        align-items: center;
    }

    #sensor .value {
        font-weight: bold;
        font-size: 24px;
        line-height: 24px;
        padding: 20px 0;
        color: var(--title-text);
    }
</style>
