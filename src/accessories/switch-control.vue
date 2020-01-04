<template>
    <div id="control">
        <svg width="190" height="190" viewBox="0 0 100 100">
            <circle style="fill: var(--background); stroke: var(--text-light);" stroke-width="0.5" cx="50" cy="50" r="45" />
            <circle :fill="value.values[characteristic] ? color : $theme.accessories.off" cx="50" cy="50" r="43.5" />
            <path fill="#ffffffef" :d="icon" />
            <circle fill="#ffffff00" stroke="none" cx="50" cy="50" r="45" @click="toggle" style="cursor: pointer;" />
        </svg>
        <div v-if="lock" class="name">
            <input type="text" ref="field" v-model="value.alias" v-on:blur="rename()" @keyup.enter="rename()" :placeholder="value.name || value.service_name" />
        </div>
        <div v-else class="name">{{ value.alias || value.name || value.service_name }}</div>
        <div v-if="lock" class="lock"></div>
    </div>
</template>

<script>
    export default {
        name: "switch-control",

        props: {
            value: Object,
            lock: {
                type: Boolean,
                default: false
            }
        },

        data() {
            return {
                icons: {
                    light: "M38.9,53.7l5.6,5.6v9.3h11.1v-9.3l5.6-5.6v-9.3H38.9V53.7z M48.2,31.5h3.7V37h-3.7V31.5z M34.3,38.7l2.6-2.6l3.9,3.9 l-2.6,2.6L34.3,38.7z M59.2,40l3.9-3.9l2.6,2.6l-3.9,3.9L59.2,40z",
                    garbage: "M50,31.5c-10.2,0-18.5,8.3-18.5,18.5S39.8,68.6,50,68.6S68.6,60.2,68.6,50S60.2,31.5,50,31.5z M42.6,60.2 c-2.6,0-4.6-2.1-4.6-4.6s2.1-4.6,4.6-4.6c2.6,0,4.6,2.1,4.6,4.6C47.2,58.1,45.1,60.2,42.6,60.2z M45.4,42.6c0-2.6,2.1-4.6,4.6-4.6 s4.6,2.1,4.6,4.6c0,2.6-2.1,4.6-4.6,4.6S45.4,45.1,45.4,42.6z M57.4,60.2c-2.6,0-4.6-2.1-4.6-4.6s2.1-4.6,4.6-4.6 c2.6,0,4.6,2.1,4.6,4.6C62.1,58.1,60,60.2,57.4,60.2z",
                    fan: "M50,50c-4.2-4.2-4.2-11.2,0-15.4s11.2-4.2,15.4,0L50,50z M50,50c4.2,4.2,4.2,11.2,0,15.4s-11.2,4.2-15.4,0L50,50z M50,50 c-4.2,4.2-11.2,4.2-15.4,0s-4.2-11.2,0-15.4L50,50z M50,50c4.2-4.2,11.2-4.2,15.4,0s4.2,11.2,0,15.4L50,50z",
                    fireplace: "M52.6,31.5c0,0,1.3,4.6,1.3,8.3c0,3.6-2.3,6.5-5.9,6.5c-3.6,0-6.3-2.9-6.3-6.5l0.1-0.6c-3.5,4.2-5.6,9.6-5.6,15.5 c0,7.7,6.2,13.9,13.9,13.9s13.9-6.2,13.9-13.9C63.9,45.3,59.4,36.9,52.6,31.5z M49.5,63.3c-3.1,0-5.6-2.4-5.6-5.5 c0-2.8,1.8-4.8,4.9-5.4c3.1-0.6,6.3-2.1,8-4.5c0.7,2.2,1,4.6,1,7C57.8,59.6,54.1,63.3,49.5,63.3z",
                    outlet: "M58.3,39.7l0-8.2h-4.1v8.2h-8.2v-8.2h-4.1v8.2h0c-2,0-4.1,2-4.1,4.1v11.3l7.2,7.3v6.2h10.3v-6.2l7.2-7.2V43.8 C62.4,41.7,60.3,39.7,58.3,39.7z",
                    off: "M59.3,40.7H40.7c-5.1,0-9.3,4.2-9.3,9.3s4.2,9.3,9.3,9.3h18.6c5.1,0,9.3-4.2,9.3-9.3S64.4,40.7,59.3,40.7z M40.7,55.6 c-3.1,0-5.6-2.5-5.6-5.6s2.5-5.6,5.6-5.6s5.6,2.5,5.6,5.6S43.8,55.6,40.7,55.6z",
                    on: "M40.7,59.3h18.6c5.1,0,9.3-4.2,9.3-9.3s-4.2-9.3-9.3-9.3H40.7c-5.1,0-9.3,4.2-9.3,9.3S35.6,59.3,40.7,59.3z M59.3,44.4 c3.1,0,5.6,2.5,5.6,5.6s-2.5,5.6-5.6,5.6s-5.6-2.5-5.6-5.6S56.2,44.4,59.3,44.4z"
                }
            }
        },

        computed: {
            characteristic() {
                if (this.value.characteristics.filter(c => c.type === "active").length > 0) {
                    return "active"
                }

                return "on";
            },

            icon() {
                if (this.value.name.toLowerCase().includes("light") || this.value.name.toLowerCase().includes("lamp")) {
                    return this.icons.light;
                } else if (this.value.name.toLowerCase().includes("garbage")) {
                    return this.icons.garbage;
                } else if (this.value.name.toLowerCase().includes("fireplace")) {
                    return this.icons.fireplace;
                } else if (this.value.type === "switch") {
                    return this.value.values[this.characteristic] ? this.icons.on : this.icons.off;
                } else if (this.value.name.toLowerCase().includes("fan") || this.value.type === "fan") {
                    return this.icons.fan;
                } else if (this.value.type === "outlet") {
                    return this.icons.outlet;
                }

                return this.icons.light;
            },

            color() {
                if (this.value.name.toLowerCase().includes("light") || this.value.name.toLowerCase().includes("lamp")) {
                    return this.$theme.accessories.light;
                } else if (this.value.name.toLowerCase().includes("garbage")) {
                    return this.$theme.accessories.disposal;
                } else if (this.value.name.toLowerCase().includes("fireplace")) {
                    return this.$theme.accessories.fireplace;
                } else if (this.value.type === "switch") {
                    return this.$theme.accessories.switch;
                } else if (this.value.name.toLowerCase().includes("fan") || this.value.type === "fan") {
                    return this.$theme.accessories.fan;
                } else if (this.value.type === "outlet") {
                    return this.$theme.accessories.outlet;
                }

                return this.$theme.accessories.light;
            }
        },

        methods: {
            rename() {
                this.$emit("change", this.value);
            },

            toggle(event) {
                event.preventDefault();
                event.stopPropagation();

                this.value.values[this.characteristic] = !this.value.values[this.characteristic];

                this.control(this.characteristic, this.value.values[this.characteristic]);
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
