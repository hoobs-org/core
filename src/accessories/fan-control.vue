<template>
    <div id="control">
        <div v-if="lock" class="name">
            <input type="text" ref="field" v-model="value.alias" v-on:blur="rename()" @keyup.enter="rename()" :placeholder="value.name || value.service_name" />
        </div>
        <div v-else class="name">{{ value.alias || value.name || value.service_name }}</div>
        <div v-if="lock" class="lock"></div>
    </div>
</template>

<script>
    export default {
        name: "fan-control",

        props: {
            value: Object,
            lock: {
                type: Boolean,
                default: false
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
        z-index: 10;
    }

    #control .name {
        margin: 20px 0 0 0;
        text-align: center;
        height: 40px;
        font-size: 15px;
        overflow: hidden;
        text-overflow: ellipsis;
        z-index: 20;
    }

    #control .name input {
        flex: 1;
        padding: 7px;
        font-size: 14px;
        background: var(--input-background);
        color: var(--input-text);
        border: 1px var(--border) solid;
        border-radius: 5px;
    }

    #control .name input:focus {
        outline: 0 none;
        border-color: var(--title-text);
    }
</style>
