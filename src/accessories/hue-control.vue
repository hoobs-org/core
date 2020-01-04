<template>
    <div id="control">
        <div v-if="pickerVisible" class="picker-container">
            <svg width="190" height="190" viewBox="0 0 100 100">
                <circle style="fill: var(--background); stroke: var(--text-light);" stroke-width="0.5" cx="50" cy="50" r="45" />
            </svg>
            <div class="picker-inner">
                <div ref="wheel"></div>
            </div>
        </div>
        <svg v-else width="190" height="190" viewBox="0 0 100 100" @click="setTarget" @mousedown="captureMouse" @mouseup="releaseMouse" @touchstart="beginTouch" @touchend="endTouch">
            <circle style="fill: var(--background); stroke: var(--text-light);" stroke-width="0.5" cx="50" cy="50" r="45" />
            <circle :fill="value.values.on ? color : $theme.accessories.off" cx="50" cy="50" r="43.5" />
            <path :d="`M ${this.min.x} ${this.min.y} A 40 40 0 1 1 ${this.max.x} ${this.max.y}`" stroke-width="5" :stroke="value.values.on ? '#ffffff78' : luminance($theme.accessories.off, 0.05)" fill="none" style="transition: stroke 0.1s ease-in; cursor: pointer;" />
            <path v-if="visible" :d="`M ${this.zero.x} ${this.zero.y} A 40 40 0 ${this.arc} ${this.sweep} ${this.position.x} ${this.position.y}`" stroke-width="5" :stroke="value.values.on ? luminance(color, -0.2) : luminance($theme.accessories.off, -0.07)" fill="none" ref="path-value" :style="style" />
            <path fill="#ffffffef" d="M38.9,53.7l5.6,5.6v9.3h11.1v-9.3l5.6-5.6v-9.3H38.9V53.7z M48.2,31.5h3.7V37h-3.7V31.5z M34.3,38.7l2.6-2.6l3.9,3.9 l-2.6,2.6L34.3,38.7z M59.2,40l3.9-3.9l2.6,2.6l-3.9,3.9L59.2,40z" />
            <circle fill="#ffffff00" stroke="none" cx="50" cy="50" r="33.5" @click="toggleSwitch" style="cursor: pointer;" />
        </svg>
        <svg v-if="pickerVisible && !lock" class="control-switch" version="1.1" width="32" height="32" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 23 23" @click="togglePicker">
            <circle style="fill: var(--background); stroke: var(--text-light);" stroke-width="0.5" stroke-miterlimit="10" cx="11.5" cy="11.5" r="11.5" />
            <path fill="#999999" d="M7.5,12.8l2,2v3.3h4v-3.3l2-2V9.5h-8V12.8z M10.8,4.8h1.3v2h-1.3V4.8z M5.8,7.4l0.9-0.9l1.4,1.4L7.2,8.8L5.8,7.4z M14.8,7.9 l1.4-1.4l0.9,0.9l-1.4,1.4L14.8,7.9z" />
        </svg>
        <svg v-else-if="!lock" class="control-switch" version="1.1" width="32" height="32" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 23 23" @click="togglePicker">
            <circle style="fill: var(--background); stroke: var(--text-light);" stroke-width="0.5" stroke-miterlimit="10" cx="11.5" cy="11.5" r="11.5" />
            <path fill="#999999" d="M11.5,4.8c-3.7,0-6.7,3-6.7,6.7s3,6.7,6.7,6.7c0.6,0,1.1-0.5,1.1-1.1c0-0.3-0.1-0.5-0.3-0.7 c-0.2-0.2-0.3-0.5-0.3-0.7c0-0.6,0.5-1.1,1.1-1.1h1.3c2,0,3.7-1.7,3.7-3.7C18.2,7.5,15.2,4.8,11.5,4.8z M7.4,11.5 c-0.6,0-1.1-0.5-1.1-1.1s0.5-1.1,1.1-1.1s1.1,0.5,1.1,1.1S8,11.5,7.4,11.5z M9.6,8.5C9,8.5,8.5,8,8.5,7.4S9,6.3,9.6,6.3 s1.1,0.5,1.1,1.1S10.3,8.5,9.6,8.5z M13.4,8.5c-0.6,0-1.1-0.5-1.1-1.1s0.5-1.1,1.1-1.1s1.1,0.5,1.1,1.1S14,8.5,13.4,8.5z M15.6,11.5 c-0.6,0-1.1-0.5-1.1-1.1s0.5-1.1,1.1-1.1s1.1,0.5,1.1,1.1S16.2,11.5,15.6,11.5z" />
        </svg>
        <div v-if="lock" class="name">
            <input type="text" ref="field" v-model="value.alias" v-on:blur="rename()" @keyup.enter="rename()" :placeholder="value.name || value.service_name" />
        </div>
        <div v-else class="name">{{ value.alias || value.name || value.service_name }}</div>
        <div v-if="lock" class="lock"></div>
    </div>
</template>

<script>
    import Iro from "@jaames/iro";

    export default {
        name: "hue-control",

        props: {
            value: Object,
            lock: {
                type: Boolean,
                default: false
            }
        },

        data() {
            return {
                picker: null,
                colorPicker: null,
                pickerVisible: false
            }
        },

        computed: {
            color() {
                return new Iro.Color({
                    h: this.value.values.hue,
                    s: 100,
                    l: 50
                }).hexString;
            },

            style() {
                return {
                    strokeDasharray: this.length,
                    strokeDashoffset: this.length,
                    cursor: "pointer"
                }
            },

            visible() {
                return this.value.values.brightness >= 0 && this.value.values.brightness <= 100;
            },

            min() {
                return {
                    x: 50 + Math.cos((4 * Math.PI / 3)) * 40,
                    y: 50 - Math.sin((4 * Math.PI / 3)) * 40
                };
            },

            max() {
                return {
                    x: 50 + Math.cos(-(Math.PI / 3)) * 40,
                    y: 50 - Math.sin(-(Math.PI / 3)) * 40
                };
            },

            zero() {
                return {
                    x: 50 + Math.cos(this.getRange(0, 0, 100, (4 * Math.PI / 3), -(Math.PI / 3))) * 40,
                    y: 50 - Math.sin(this.getRange(0, 0, 100, (4 * Math.PI / 3), -(Math.PI / 3))) * 40,
                    radians: this.getRange(0, 0, 100, (4 * Math.PI / 3), -(Math.PI / 3))
                }
            },

            position() {
                return {
                    x: 50 + Math.cos(this.getRange(this.value.values.brightness, 0, 100, (4 * Math.PI / 3), -(Math.PI / 3))) * 40,
                    y: 50 - Math.sin(this.getRange(this.value.values.brightness, 0, 100, (4 * Math.PI / 3), -(Math.PI / 3))) * 40,
                    radians: this.getRange(this.value.values.brightness, 0, 100, (4 * Math.PI / 3), -(Math.PI / 3))
                };
            },

            arc() {
                return Math.abs(this.zero.radians - this.position.radians) < Math.PI ? 0 : 1;
            },

            sweep() {
                return this.position.radians > this.zero.radians ? 0 : 1;
            }
        },

        methods: {
            rename() {
                this.$emit("change", this.value);
            },

            togglePicker() {
                this.pickerVisible = !this.pickerVisible;

                if (this.pickerVisible) {
                    setTimeout(() => {
                        this.picker = new Iro.ColorPicker(this.$refs.wheel, {
                            width: 165.3,
                            color: {
                                h: this.value.values.hue,
                                s: this.value.values.saturation,
                                l: 50
                            },
                            wheelLightness: false
                        });

                        this.picker.on("input:end", this.setHue);
                    }, 10);
                } else {
                    this.picker = null;
                }
            },

            setHue(color) {
                this.value.values.hue = color.hsl.h;
                this.value.values.saturation = color.hsl.s;

                this.control("hue", this.value.values.hue);
                this.control("saturation", this.value.values.saturation);
            },

            getRange(x, inMin, inMax, outMin, outMax) {
                return (x - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
            },

            updateSweep(offsetX, offsetY) {
                const positionX = offsetX - 95;
                const positionY = 95 - offsetY;
                const angle = Math.atan2(positionY, positionX);
                const start = -Math.PI / 2 - Math.PI / 6;

                let value;

                if (angle > -(Math.PI / 3)) {
                    value = this.getRange(angle, (4 * Math.PI / 3), -(Math.PI / 3), 0, 100);
                } else if (angle < start) {
                    value = this.getRange(angle + 2 * Math.PI, (4 * Math.PI / 3), -(Math.PI / 3), 0, 100);
                } else {
                    return;
                }

                this.value.values.brightness = Math.round(value);
                this.value.values.on = true;

                this.control("brightness", this.value.values.brightness);
            },

            setTarget(event) {
                this.updateSweep(event.offsetX, event.offsetY);
            },

            captureMouse(event) {
                event.preventDefault();

                window.addEventListener("mousemove", this.touchMove);
                window.addEventListener("mouseup", this.releaseMouse);
            },

            releaseMouse(event) {
                event.preventDefault();

                window.removeEventListener("mousemove", this.touchMove);
                window.removeEventListener("mouseup", this.releaseMouse);
            },

            beginTouch(event) {
                event.preventDefault();

                window.addEventListener("touchmove", this.touch);
                window.addEventListener("touchend", this.endTouch);
            },

            endTouch(event) {
                event.preventDefault();

                window.removeEventListener("touchmove", this.touch);
                window.removeEventListener("touchend", this.endTouch);
            },

            touch(event) {
                const boundingClientRect = this.$el.getBoundingClientRect();
                const touch = event.targetTouches.item(0);
                const offsetX = touch.clientX - boundingClientRect.left;
                const offsetY = touch.clientY - boundingClientRect.top;

                this.updateSweep(offsetX, offsetY);
            },

            touchMove(event) {
                event.preventDefault();

                this.updateSweep(event.offsetX, event.offsetY);
            },

            toggleSwitch(event) {
                event.preventDefault();
                event.stopPropagation();

                this.value.values.on = !this.value.values.on;

                this.control("on", this.value.values.on);
            },

            load() {
                let element = this.$refs["path-value"];

                if (element && element.getTotalLength) {
                    let length = element.getTotalLength();

                    element.dataset.dash = length;
                    this.length = length;
                } else {
                    this.length = 0;
                }
            },

            luminance(color, interval) {
                color = String(color).replace(/[^0-9a-f]/gi, "");

                if (color.length < 6) {
                    color = color[0] + color[0] + color[1] + color[1] + color[2] + color[2];
                }

                interval = interval || 0;

                let results = "#";

                for (let i = 0; i < 3; i++) {
                    let current = parseInt(color.substr(i * 2, 2), 16);

                    current = Math.round(Math.min(Math.max(0, current + (current * interval)), 255)).toString(16);
                    results += ("00" + current).substr(current.length);
                }

                return results;
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
        },

        mounted() {
            this.load();
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

    #control .picker-container {
        width: 190px;
        height: 186.7px;
        position: relative;
        overflow: hidden;
    }

    #control .picker-container .picker-inner {
        width: 165.3px;
        height: 165.3px;
        position: absolute;
        top: 12.35px;
        left: 12.35px;
        overflow: hidden;
    }

    #control .control-switch {
        position: absolute;
        top: 3px;
        right: 3px;
        cursor: pointer;
    }
</style>
