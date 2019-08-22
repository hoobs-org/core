<template>
    <div id="favorites">
        <div class="accessories">
            <div class="accessory" v-for="(accessory, index) in accessories" :key="index">
                <component :is="getComponent(accessory)" v-model="accessories[index]" @change="skip = true" />
            </div>
        </div>
        <div class="title">{{ $t("favorite_accessories") }}</div>
    </div>
</template>

<script>
    import SwitchControl from "@/accessories/switch-control.vue";
    import DimmerControl from "@/accessories/dimmer-control.vue";
    import HueControl from "@/accessories/hue-control.vue";
    import FanControl from "@/accessories/fan-control.vue";
    import ThermostatControl from "@/accessories/thermostat-control.vue";
    import LockControl from "@/accessories/lock-control.vue";
    import GarageControl from "@/accessories/garage-control.vue";

    import BatterySensor from "@/accessories/battery-sensor.vue";
    import HumiditySensor from "@/accessories/humidity-sensor.vue";
    import TempratureSensor from "@/accessories/temperature-sensor.vue";
    import ContactSensor from "@/accessories/contact-sensor.vue";
    import MotionSensor from "@/accessories/motion-sensor.vue";

    import UnknownDevice from "@/accessories/unknown-device.vue";

    export default {
        name: "favorite-accessories",

        components: {
            "switch-control": SwitchControl,
            "dimmer-control": DimmerControl,
            "hue-control": HueControl,
            "fan-control": FanControl,
            "thermostat-control": ThermostatControl,
            "lock-control": LockControl,
            "garage-control": GarageControl,
            "battery-sensor": BatterySensor,
            "humidity-sensor": HumiditySensor,
            "temperature-sensor": TempratureSensor,
            "contact-sensor": ContactSensor,
            "motion-sensor": MotionSensor,
            "unknown-device": UnknownDevice
        },

        data() {
            return {
                skip: false,
                interval: null,
                pollingSeconds: 15,
                accessories: []
            }
        },

        computed: {
            running() {
                return this.$store.state.running;
            },

            locked() {
                return this.$store.state.locked;
            }
        },

        async mounted() {
            this.pollingSeconds = this.$server.polling_seconds || 15 < 15 ? 15 : this.$server.polling_seconds || 15;
            this.accessories = await this.api.get("/accessories/favorites");

            if (this.pollingSeconds > 0) {
                this.interval = setInterval(() => {
                    this.heartbeat();
                }, this.pollingSeconds * 1000);
            }

            this.heartbeat();
        },

        destroyed() {
            if (this.interval) {
                clearInterval(this.interval);   
            } 
        },

        methods: {
            async heartbeat() {
                if (!this.skip && this.running && !this.locked) {
                    try {
                        this.accessories = await this.api.get("/accessories/favorites");
                    } catch {
                        this.skip = true;
                    }
                } else {
                    this.skip = false;
                }
            },

            getComponent(accessory) {
                switch (accessory.type) {
                    case "fan":
                        if (accessory.characteristics.filter(c => c.type === "rotation_speed").length > 0) {
                            return "fan-control";
                        }

                    case "lightbulb":
                    case "outlet":
                    case "switch":
                        const props = [];

                        for (let i = 0; i < accessory.characteristics.length; i++) {
                            props.push(accessory.characteristics[i].type);
                        }

                        if (props.indexOf("hue") >= 0) {
                            return "hue-control";
                        } else if (props.indexOf("brightness") >= 0) {
                            return "dimmer-control";
                        } else {
                            return "switch-control";
                        }

                    case "thermostat":
                        return "thermostat-control";

                    case "lock_mechanism":
                        return "lock-control"

                    case "garage_door_opener":
                        return "garage-control";

                    case "battery":
                        return "battery-sensor";

                    case "humidity_sensor":
                        return "humidity-sensor";

                    case "temperature_sensor":
                        return "temperature-sensor";

                    case "contact_sensor":
                        return "contact-sensor";

                    case "motion_sensor":
                        return "motion-sensor";
                }

                return "unknown-device";
            }
        }
    };
</script>

<style scoped>
    #favorites {
        width: 100%;
        height: 100%;
        overflow: auto;
    }

    #favorites .accessories {
        height: 100%;
        padding: 60px 20px 20px 20px;
        display: flex;
        flex-wrap: nowrap;
        align-items: center;
        align-content: center;
        box-sizing: border-box;
        position: relative;
    }

    #favorites .title {
        font-weight: bold;
        font-size: 18px;
        color: var(--title-text);
        position: absolute;
        top: 20px;
        left: 20px;
    }
</style>