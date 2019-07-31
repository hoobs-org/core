<template>
    <div id="control">
        <div class="name">{{ accessory.name || accessory.service_name }}</div>
        <div v-if="lock" class="lock"></div>
    </div>
</template>

<script>
    export default {
        name: "fan-control",
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
    #control {
        width: 190px;
        height: 226px;
        display: flex;
        flex-direction: column;
        align-items: center;
        align-content: center;
        position: relative;
    }

    #control .lock {
        position: absolute;
        width: 100%;
        height: 100%;
    }

    #control .name {
        margin: 20px 0 0 0;
        text-align: center;
        height: 40px;
        font-size: 15px;
        overflow: hidden;
        text-overflow: ellipsis;
    }
</style>
