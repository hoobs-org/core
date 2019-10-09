<template>
    <div id="device">
        <div class="inner">
            <div>
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
        name: "unknown-device",

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
        box-shadow: var(--elevation-small);
    }

    #device .lock {
        position: absolute;
        width: 100%;
        height: 100%;
        z-index: 10;
    }

    #device .name {
        height: 38px;
        overflow: hidden;
        position: relative;
        text-overflow: ellipsis;
        z-index: 20;
    }

    #device .name input {
        flex: 1;
        padding: 7px;
        font-size: 14px;
        background: var(--input-background);
        color: var(--input-text);
        border: 1px var(--border) solid;
        border-radius: 5px;
    }

    #device .name input:focus {
        outline: 0 none;
        border-color: var(--title-text);
    }

    @media (min-width: 300px) and (max-width: 815px) {
        #device {
            padding: 0;
        }
    }
</style>
