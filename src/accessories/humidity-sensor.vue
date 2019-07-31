<template>
    <div id="sensor">
        <div class="inner">
            <div>
                <div class="title">
                    <div class="title-inner">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                            <path fill="#cccccc" d="M160.1 22.1C109.1 179.8 0 222.7 0 333.9 0 432.3 85.9 512 192 512s192-79.7 192-178.1c0-111.8-108.9-153.3-160.1-311.8-8.7-28.8-54-30.1-63.8 0zM416 0c-52.9 0-96 43.1-96 96s43.1 96 96 96 96-43.1 96-96-43.1-96-96-96zm0 128c-17.7 0-32-14.3-32-32s14.3-32 32-32 32 14.3 32 32-14.3 32-32 32z" />
                        </svg>
                        {{ $t("humidity") }}
                    </div>
                </div>
                <div class="value">{{ accessory.values.relative_humidity }}%</div>
                <div class="name">{{ accessory.name || accessory.service_name }}</div>
            </div>
        </div>
        <div v-if="lock" class="lock"></div>
    </div>
</template>

<script>
    export default {
        name: "humidity-sensor",
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
        margin: 0 10px 0 0;
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
