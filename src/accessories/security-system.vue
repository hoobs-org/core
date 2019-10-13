<template>
    <div id="control">
        <div class="inner">
            <div>
                <div class="title">
                    <div v-if="!lock" class="title-inner">
                        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                            <path fill="#cccccc" d="M256,0L46.5,93.1v139.6c0,129.2,89.4,249.9,209.5,279.3c120.1-29.3,209.5-150.1,209.5-279.3V93.1L256,0z M256,255.8h162.9c-12.3,95.9-76.3,181.3-162.9,208.1V256H93.1V123.3L256,51C256,51,256,255.8,256,255.8z" />
                        </svg>
                        {{ $t("security") }}
                    </div>
                </div>
                <div class="actions">
                    <table cellpadding="0" cellspacing="0" border="0">
                        <tbody>
                            <tr>
                                <td v-if="value.values.security_system_target_state === 0" class="on">{{ $t("home") }}</td>
                                <td v-else v-on:click="set(0)">{{ $t("home") }}</td>
                                <td v-if="value.values.security_system_target_state === 1" class="on">{{ $t("away") }}</td>
                                <td v-else v-on:click="set(1)">{{ $t("away") }}</td>
                            </tr>
                            <tr>
                                <td v-if="value.values.security_system_target_state === 2" class="on">{{ $t("night") }}</td>
                                <td v-else v-on:click="set(2)">{{ $t("night") }}</td>
                                <td v-if="value.values.security_system_target_state === 3" class="on">{{ $t("off") }}</td>
                                <td v-else v-on:click="set(3)">{{ $t("off") }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
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
        name: "security-system",

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
            },

            set(state) {
                event.preventDefault();
                event.stopPropagation();

                this.value.values.security_system_target_state = state;

                this.control("security_system_target_state", this.value.values.security_system_target_state);
            },

            async control(type, value) {
                this.$emit("change", {
                    type,
                    value
                });
                
                await this.api.put(`/accessory/${this.value.aid}/${this.value.characteristics.filter(c => c.type === type)[0].iid}`, {
                    value
                });
            }
        }
    };
</script>

<style scoped>
    #control {
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

    #control .inner {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        align-content: center;
        justify-content: space-around;
        position: relative;
        text-align: center;
    }

    #control .lock {
        position: absolute;
        width: 100%;
        height: 100%;
        z-index: 10;
    }

    #control .name {
        height: 38px;
        overflow: hidden;
        position: relative;
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

    #control .title {
        height: 24px;
        margin: 30px 0 0 0;
        display: flex;
        align-content: center;
        align-items: center;
        font-size: 18px;
    }

    #control .title svg {
        height: 24px;
        margin: 0 10px 0 0;
    }

    #control .title-inner {
        display: flex;
        margin: 0 auto;
        align-content: center;
        align-items: center;
    }

    #control .actions {
        display: flex;
        margin: 12px 0 14px 0;
        align-items: center;
        align-content: center;
        flex-direction: column;
        border-radius: 5px;
        border: 1px var(--text-light) solid;
    }

    #control .actions table {
        width: 170px;
        border-radius: 3px;
        border: 2px var(--background) solid;
        box-sizing: border-box;
    }

    #control .actions table tr td {
        width: 50%;
        text-align: center;
        font-size: 17px;
        color: var(--text-light);
        padding: 14px 7px;
        cursor: pointer;
    }

    #control .actions table tr:first-child td:first-child {
        border-top-left-radius: 3px;
        border-top: 2px var(--title-text) solid;
        border-right: 1px var(--title-text) solid;
        border-bottom: 1px var(--title-text) solid;
        border-left: 2px var(--title-text) solid;
    }

    #control .actions table tr:first-child td:last-child {
        border-top-right-radius: 3px;
        border-top: 2px var(--title-text) solid;
        border-right: 2px var(--title-text) solid;
        border-bottom: 1px var(--title-text) solid;
    }

    #control .actions table tr:last-child td:first-child {
        border-bottom-left-radius: 3px;
        border-right: 1px var(--title-text) solid;
        border-bottom: 2px var(--title-text) solid;
        border-left: 2px var(--title-text) solid;
    }

    #control .actions table tr:last-child td:last-child {
        border-bottom-right-radius: 3px;
        border-right: 2px var(--title-text) solid;
        border-bottom: 2px var(--title-text) solid;
    }

    #control .actions table tr td.on {
        background: var(--title-text);
        color: var(--button-primary-text);
    }

    @media (min-width: 300px) and (max-width: 815px) {
        #control {
            padding: 0;
        }

        #control .title {
            margin: 15px 0 0 0;
        }

        #control .inner {
            border-radius: unset;
            box-shadow: unset;
        }
    }
</style>
