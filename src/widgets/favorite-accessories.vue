<template>
    <div id="favorites">
        <div class="accessories">
            <div class="accessory" v-for="(accessory, index) in accessories" :key="index">
                <component :is="getComponent(accessory)" v-model="accessories[index]" @change="skip = true" />
            </div>
        </div>
        <div class="title">{{ $t("favorite_accessories") }}</div>
        <div class="actions">
            <router-link to="/accessories/layout" class="icon">settings</router-link>
        </div>
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
    import WindowCovering from "@/accessories/window-covering.vue";
    import SecuritySystem from "@/accessories/security-system.vue";

    import BatterySensor from "@/accessories/battery-sensor.vue";
    import HumiditySensor from "@/accessories/humidity-sensor.vue";
    import TempratureSensor from "@/accessories/temperature-sensor.vue";
    import ContactSensor from "@/accessories/contact-sensor.vue";
    import MotionSensor from "@/accessories/motion-sensor.vue";
    import OccupancySensor from "@/accessories/occupancy-sensor.vue";

    import UnknownDevice from "@/accessories/unknown-device.vue";

    export default {
        name: "favorite-accessories",

        props: {
            item: Object,
            index: Number,
            change: Function
        },

        components: {
            "switch-control": SwitchControl,
            "dimmer-control": DimmerControl,
            "hue-control": HueControl,
            "fan-control": FanControl,
            "thermostat-control": ThermostatControl,
            "lock-control": LockControl,
            "garage-control": GarageControl,
            "window-covering": WindowCovering,
            "security-system": SecuritySystem,
            "battery-sensor": BatterySensor,
            "humidity-sensor": HumiditySensor,
            "temperature-sensor": TempratureSensor,
            "contact-sensor": ContactSensor,
            "motion-sensor": MotionSensor,
            "occupancy-sensor": OccupancySensor,
            "unknown-device": UnknownDevice
        },

        data() {
            return {
                skip: false,
                accessories: []
            }
        },

        computed: {
            running() {
                return this.$store.state.running;
            },

            locked() {
                return this.$store.state.locked;
            },

            user() {
                return this.$store.state.user;
            }
        },

        async mounted() {
            this.accessories = await this.api.get("/accessories/favorites");
        },

        async created() {
            this.$store.subscribe(async (mutation, state) => {
                switch (mutation.type) {
                    case "update":
                        if (!this.skip && this.running && !this.locked) {
                            try {
                                this.accessories = await this.api.get("/accessories/favorites");
                            } catch {
                                this.skip = true;
                            }
                        } else {
                            this.skip = false;
                        }

                        break;
                }
            });
        },

        methods: {
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

                    case "window_covering":
                        return "window-covering";

                    case "security_system":
                        return "security-system";

                    case "occupancy_sensor":
                        return "occupancy-sensor";
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
        cursor: default;
    }

    #favorites .accessories {
        height: 100%;
        padding: 60px 20px 20px 20px;
        display: flex;
        flex-wrap: wrap;
        align-items: flex-start;
        align-content: flex-start;
        box-sizing: border-box;
        position: relative;
    }

    #favorites .accessory {
        margin: .4rem 0;
        min-width: 190px;
        padding: 0 20px 0 0;
        height: 226px;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
    }

    #favorites .title {
        font-weight: bold;
        font-size: 18px;
        color: var(--title-text);
        position: absolute;
        top: 20px;
        left: 20px;
    }

    #favorites .actions {
        font-size: 14px;
        position: absolute;
        top: 20px;
        right: 20px;
        user-select: none;
    }

    #favorites .actions .icon,
    #favorites .actions a:link {
        font-size: 18px;
        color: var(--text) !important;
        text-decoration: none !important;
    }
</style>
