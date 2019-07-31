<template>
    <div id="device">
        <div class="inner">
            <div>
                <div class="name">{{ accessory.name || accessory.service_name }}</div>
            </div>
        </div>
        <div v-if="lock" class="lock"></div>
    </div>
</template>

<script>
    export default {
        name: "unknown-device",
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
    #device {
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

    #device .inner {
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

    #device .lock {
        position: absolute;
        width: 100%;
        height: 100%;
    }

    #device .name {
        height: 38px;
        overflow: hidden;
        text-overflow: ellipsis;
    }
</style>
