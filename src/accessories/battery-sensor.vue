<template>
    <div id="sensor">
        <div class="inner">
            <div>
                <div class="title">
                    <div class="title-inner">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 256">
                            <path fill="#cccccc" d="M434.2,50.2v51.2h25.6v51.2h-25.6v51.2h-384V50.2H434.2 M447-1H37.4C16.2-1-1,16.2-1,37.4v179.2 c0,21.2,17.2,38.4,38.4,38.4H447c21.2,0,38.4-17.2,38.4-38.4v-12.8h6.4c10.6,0,19.2-8.6,19.2-19.2V69.4c0-10.6-8.6-19.2-19.2-19.2 h-6.4V37.4C485.4,16.2,468.2-1,447-1z" />
                            <rect v-if="value.values.battery_level > 20" fill="#17d149" x="76.8" y="76.8" :width="(332.8 * this.value.values.battery_level) / 100" height="102.4" />
                            <rect v-else fill="#eb0505" x="76.8" y="76.8" :width="(332.8 * this.value.values.battery_level) / 100" height="102.4" />
                        </svg>
                        {{ $t("battery") }}
                    </div>
                </div>
                <div class="value">{{ value.values.battery_level }}%</div>
                <div class="name">{{ value.name || value.service_name }}</div>
            </div>
        </div>
        <div v-if="lock" class="lock"></div>
    </div>
</template>

<script>
    export default {
        name: "battery-sensor",
        props: {
            value: Object,
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
        box-shadow: var(--elevation-small);
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
        height: 18px;
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

    @media (min-width: 300px) and (max-width: 815px) {
        #sensor {
            padding: 0;
        }

        #sensor .inner {
            border-radius: unset;
            box-shadow: unset;
        }
    }
</style>
