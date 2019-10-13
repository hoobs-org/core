<template>
    <div id="control">
        <div v-if="lock" class="name name-edit" v-show="edit === false" v-on:dblclick="mode()">{{ value.alias || value.name || value.service_name }}<span class="icon" v-on:click="mode()">edit</span></div>
        <div v-else class="name">{{ value.alias || value.name || value.service_name }}</div>
        <div v-if="lock" class="name" v-show="edit === true">
            <input type="text" ref="field" v-model="value.alias" v-on:blur="rename()" @keyup.enter="rename()" :placeholder="value.name || value.service_name" />
        </div>
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

    #control .name-edit {
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        align-content: center;
        box-sizing: border-box;
        border-top: 1px var(--border) solid;
        padding: 0 20px 0 20px;
        z-index: 20;
    }

    #control .name-edit .icon {
        font-size: 14px;
        margin: 0 0 0 5px;
        cursor: pointer;
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
