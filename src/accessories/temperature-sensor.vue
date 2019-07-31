<template>
    <div id="sensor">
        <div class="inner">
            <div>
                <div class="title">
                    <div class="title-inner">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                            <path fill="#cccccc" d="M320,384c0,35.3-28.7,64-64,64s-64-28.7-64-64c0-23.7,12.9-44.3,32-55.4V288c0-17.7,14.3-32,32-32s32,14.3,32,32v40.6 C307.1,339.7,320,360.3,320,384z M352,299.3c19.9,22.6,32,52.2,32,84.7c0,70.7-57.3,128-128,128c-0.3,0-0.6,0-0.9,0 c-70.3-0.5-127.4-58.4-127.1-128.7c0.2-32.2,12.2-61.6,32-84V96c0-53,43-96,96-96s96,43,96,96V299.3z M336,384 c0-34.3-19.4-52.2-32-66.5V96c0-26.5-21.5-48-48-48s-48,21.5-48,48v221.5c-12.7,14.4-31.8,32.1-32,66.1 c-0.2,43.9,35.6,80.1,79.4,80.4l0.6,0C300.1,464,336,428.1,336,384z" />
                        </svg>
                        {{ $t("temperature") }}
                    </div>
                </div>
                <div class="value">{{ Math.round((accessory.values.temperature * (9/5)) + 32) }}°</div>
                <div class="name">{{ accessory.name || accessory.service_name }}</div>
            </div>
        </div>
        <div v-if="lock" class="lock"></div>
    </div>
</template>

<script>
    export default {
        name: "temperature-sensor",
        props: {
            accessory: Object,
            value: Boolean,
            lock: {
                type: Boolean,
                default: false
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
        font-size: 42px;
        padding: 5px 0;
        color: var(--title-text);
    }
</style>
