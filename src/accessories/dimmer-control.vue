<template>
    <div id="control">
        <svg width="190" height="190" viewBox="0 0 100 100" v-on:click="setTarget" v-on:mousedown="captureMouse" v-on:mouseup="releaseMouse" v-on:touchstart="beginTouch" v-on:touchend="endTouch">
            <circle style="fill: var(--background); stroke: var(--text-light);" stroke-width="0.5" cx="50" cy="50" r="45" />
            <circle :fill="value.values.on ? $theme.accessories.light : $theme.accessories.off" cx="50" cy="50" r="43.5" />
            <path :d="`M ${this.min.x} ${this.min.y} A 40 40 0 1 1 ${this.max.x} ${this.max.y}`" stroke-width="5" :stroke="luminance(value.values.on ? $theme.accessories.light : $theme.accessories.off, 0.05)" fill="none" style="transition: stroke 0.1s ease-in; cursor: pointer;" />
            <path v-if="visible" :d="`M ${this.zero.x} ${this.zero.y} A 40 40 0 ${this.arc} ${this.sweep} ${this.position.x} ${this.position.y}`" stroke-width="5" :stroke="luminance(value.values.on ? $theme.accessories.light : $theme.accessories.off, -0.07)" fill="none" ref="path-value" :style="style" />
            <path fill="#ffffffef" d="M38.9,53.7l5.6,5.6v9.3h11.1v-9.3l5.6-5.6v-9.3H38.9V53.7z M48.2,31.5h3.7V37h-3.7V31.5z M34.3,38.7l2.6-2.6l3.9,3.9 l-2.6,2.6L34.3,38.7z M59.2,40l3.9-3.9l2.6,2.6l-3.9,3.9L59.2,40z" />
            <circle fill="#ffffff00" stroke="none" cx="50" cy="50" r="33.5" v-on:click.stop="toggleSwitch" v-on:mousedown.stop="nullEvent" v-on:mouseup.stop="nullEvent" v-on:touchstart.stop="nullEvent" v-on:touchend.stop="nullEvent" style="cursor: pointer;" />
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
        name: "dimmer-control",

        props: {
            value: Object,
            lock: {
                type: Boolean,
                default: false
            }
        },

        computed: {
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

            nullEvent() {

            },

            toggleSwitch(event) {
                event.preventDefault();
                event.stopPropagation();

                this.value.values.on = !this.value.values.on;

                this.control("on", this.value.values.on);

                return false;
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
</style>
