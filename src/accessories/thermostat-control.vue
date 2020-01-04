<template>
    <div id="control">
        <svg width="190" height="190" viewBox="0 0 100 100" @click="setTarget" @mousedown="captureMouse" @mouseup="releaseMouse" @touchstart="beginTouch" @touchend="endTouch">
            <circle style="fill: var(--background); stroke: var(--text-light);" stroke-width="0.5" cx="50" cy="50" r="45" />
	        <circle :fill="$theme.accessories.thermostat" cx="50" cy="50" r="43.5" />
            <path :d="`M ${this.min.x} ${this.min.y} A 40 40 0 1 1 ${this.max.x} ${this.max.y}`" stroke-width="5" :stroke="right" fill="none" style="transition: stroke 0.1s ease-in; cursor: pointer;" />
            <path v-if="visible" :d="`M ${this.zero.x} ${this.zero.y} A 40 40 0 ${this.arc} ${this.sweep} ${this.position.x} ${this.position.y}`" stroke-width="5" :stroke="left" fill="none" ref="path-value" :style="style" />
            <path fill="none" stroke="#cccccc" stroke-width="0.3" stroke-miterlimit="10" d="M53.9,19.8l0.6-4.4 M57.7,20.5l1.1-4.2 M61.5,21.7l1.6-4 M65,23.4l2.1-3.8 M68.3,25.5l2.6-3.6 M71.3,28l3-3.2 M74,30.8l3.4-2.8 M76.3,34l3.7-2.3 M78.2,37.4l3.9-1.8 M79.6,41.1l4.2-1.4 M80.6,44.8l4.3-0.8 M81.1,48.7l4.3-0.2 M81.1,52.6 l4.3,0.3 M80.6,56.5l4.3,0.8 M79.6,60.3l4.2,1.4 M78.2,63.9l3.9,1.9 M76.3,67.4l3.7,2.3 M74,70.5l3.4,2.8 M71.3,73.4l3,3.2 M68.3,75.9l2.6,3.5 M31.7,75.9l-2.6,3.5 M28.7,73.4l-3,3.2 M26,70.5l-3.4,2.8 M23.7,67.4L20,69.7 M21.8,63.9l-3.9,1.9 M20.4,60.3 l-4.2,1.4 M19.4,56.5l-4.3,0.8 M18.9,52.6l-4.3,0.3 M18.9,48.7l-4.3-0.2 M19.4,44.8L15.1,44 M20.4,41.1l-4.2-1.4 M21.8,37.4 l-3.9-1.8 M23.7,34L20,31.7 M26,30.8L22.6,28 M28.7,28l-3-3.2 M31.7,25.5l-2.6-3.6 M35,23.4l-2.1-3.8 M38.5,21.7l-1.6-4 M42.3,20.5 l-1.1-4.2 M46.1,19.8l-0.6-4.4 M50,19.5v-4.3" />
            <circle v-if="!lock" fill="#ffffff" stroke="#cccccc" stroke-width="0.5" stroke-miterlimit="10" cx="50" cy="80" r="5.9" />
            <path v-if="!lock" fill="#999999" d="M50.4,76.6h-0.8v3.8h0.8V76.6z M52.2,77.4L51.7,78c0.6,0.5,1,1.2,1,2c0,1.5-1.2,2.6-2.6,2.6s-2.6-1.2-2.6-2.6 c0-0.8,0.4-1.6,1-2l-0.5-0.5c-0.7,0.6-1.2,1.5-1.2,2.6c0,1.9,1.5,3.4,3.4,3.4s3.4-1.5,3.4-3.4C53.4,79,52.9,78.1,52.2,77.4z" />
            <circle v-if="!lock" fill="#ffffff00" cx="50" cy="80" r="5.9" style="cursor: pointer;" @click="setMode" />
        </svg>
        <div class="temp" :style="`color: ${color}`">{{ getTemp(value.values.target_temperature) }}°</div>
        <div v-if="lock" class="name">
            <input type="text" ref="field" v-model="value.alias" v-on:blur="rename()" @keyup.enter="rename()" :placeholder="value.name || value.service_name" />
        </div>
        <div v-else class="name">{{ value.alias || value.name || value.service_name }}</div>
        <div v-if="lock" class="lock"></div>
    </div>
</template>

<script>
    export default {
        name: "thermostat-control",

        props: {
            value: Object,
            lock: {
                type: Boolean,
                default: false
            }
        },

        computed: {
            target() {
                return Math.round((100 * (this.value.values.target_temperature - 10)) / 22);
            },

            style() {
                return {
                    strokeDasharray: this.length,
                    strokeDashoffset: this.length,
                    cursor: "pointer"
                }
            },

            visible() {
                return this.target >= 0 && this.target <= 100 && this.value.values.target_heating_cooling_state > 0;
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
                    x: 50 + Math.cos(this.getRange(this.target, 0, 100, (4 * Math.PI / 3), -(Math.PI / 3))) * 40,
                    y: 50 - Math.sin(this.getRange(this.target, 0, 100, (4 * Math.PI / 3), -(Math.PI / 3))) * 40,
                    radians: this.getRange(this.target, 0, 100, (4 * Math.PI / 3), -(Math.PI / 3))
                };
            },

            arc() {
                return Math.abs(this.zero.radians - this.position.radians) < Math.PI ? 0 : 1;
            },

            sweep() {
                return this.position.radians > this.zero.radians ? 0 : 1;
            },

            color() {
                switch (this.value.values.target_heating_cooling_state) {
                    case 1:
                        if (this.value.values.target_temperature > this.value.values.temperature) {
                            return "#f27c05";
                        } else {
                            return "#cccccc";
                        }

                    case 2:
                        if (this.value.values.target_temperature < this.value.values.temperature) {
                            return "#00b9f1";
                        } else {
                            return "#cccccc";
                        }

                    case 3:
                        if (this.value.values.target_temperature < this.value.values.temperature) {
                            return "#00b9f1";
                        } else if (this.value.values.target_temperature > this.value.values.temperature) {
                            return "#f27c05";
                        } else {
                            return "#cccccc";
                        }
                        return "#f27c05";

                    default:
                        return "#cccccc";
                }
            },

            left() {
                switch (this.value.values.target_heating_cooling_state) {
                    case 1:
                        return "#f27c05";

                    case 2:
                        return this.luminance("#00b9f1", 0.3);

                    case 3:
                        return "#f27c05";

                    default:
                        return "#cccccc";
                }
            },

            right() {
                switch (this.value.values.target_heating_cooling_state) {
                    case 1:
                        return this.luminance("#f27c05", 0.55);

                    case 2:
                        return "#00b9f1";

                    case 3:
                        return "#00b9f1";

                    default:
                        return "#cccccc";
                }
            }
        },

        methods: {
            rename() {
                this.$emit("change", this.value);
            },

            getTemp(value) {
                if (this.$client.temp_units && this.$client.temp_units === "celsius") {
                    return Math.round(value);
                }

                return Math.round((value * (9/5)) + 32);
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

                this.value.values.target_temperature = Math.round(((22 * value) / 100) + 10);

                this.control("target_temperature", this.value.values.target_temperature);
            },

            setMode(event) {
                event.preventDefault();
                event.stopPropagation();

                if (this.value.values.target_heating_cooling_state === 3) {
                    this.value.values.target_heating_cooling_state = 0;
                } else {
                    this.value.values.target_heating_cooling_state += 1;
                }

                this.control("target_heating_cooling_state", this.value.values.target_heating_cooling_state);
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

    #control .temp {
        font-family: 'Avenir-Black';
        font-size: 38px;
        text-align: center;
        width: 100%;
        position: absolute;
        top: 70px;
        box-sizing: border-box;
        padding: 0 0 0 7px;
        pointer-events: none;
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
