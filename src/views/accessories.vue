<template>
    <div id="accessories">
        <div class="info">
            <div class="room-list">
                <div v-for="(room, index) in accessories.rooms" :key="index">
                    <a v-if="room.accessories.length > 0" class="room-link" :href="`#${room.name.toLowerCase().replace(/ /gi, '-')}`">{{ room.name }}</a>
                </div>
            </div>
            <div v-if="user.admin" class="room-list-actions">
                <router-link to="/accessories/layout" class="button">{{ $t("edit_rooms") }}</router-link>
            </div>
        </div>
        <div class="content">
            <div :id="room.name.toLowerCase().replace(/ /gi, '-')" v-for="(room, index) in accessories.rooms" :key="index" class="room-layout">
                <div v-if="room.accessories.length > 0">
                    <h2>{{ room.name }}</h2>
                    <div class="accessory-tiles">
                        <div class="accessory" v-for="(accessory, index) in room.accessories" :key="index">
                            <component :is="getComponent(accessory)" v-model="room.accessories[index]" @change="skip = true" />
                        </div>
                    </div>
                </div>
            </div>
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

    import BatterySensor from "@/accessories/battery-sensor.vue";
    import HumiditySensor from "@/accessories/humidity-sensor.vue";
    import TempratureSensor from "@/accessories/temperature-sensor.vue";
    import ContactSensor from "@/accessories/contact-sensor.vue";
    import MotionSensor from "@/accessories/motion-sensor.vue";

    import UnknownDevice from "@/accessories/unknown-device.vue";

    export default {
        name: "accessories",
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
                pollingSeconds: 15,
                accessories: {
                    rooms: []
                }
            }
        },

        computed: {
            user() {
                return this.$store.state.user;
            },

            running() {
                return this.$store.state.running;
            },

            locked() {
                return this.$store.state.locked;
            }
        },

        async created() {
            this.pollingSeconds = this.$server.polling_seconds || 15 < 15 ? 15 : this.$server.polling_seconds || 15;
            this.heartbeat();
        },

        methods: {
            async heartbeat() {
                if (!this.skip && this.running && !this.locked) {
                    this.accessories = await this.api.get("/accessories");
                } else {
                    this.skip = false;
                }

                if (this.pollingSeconds > 0) {
                    setTimeout(() => {
                        this.heartbeat();
                    }, this.$store.state.running ? (this.pollingSeconds * 1000) : 10);
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
    }
</script>

<style scoped>
    #accessories {
        flex: 1;
        padding: 0;
        display: flex;
        overflow: hidden;
    }

    #accessories .info {
        width: 210px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        overflow: auto;
    }

    #accessories .info .room-link {
        padding: 10px;
        border-bottom: 1px var(--border) solid;
        color: var(--text);
        text-decoration: none;
        display: block;
        cursor: pointer;
        user-select: none;
    }

    #accessories .info .room-link:hover {
        color: var(--text-dark);
    }

    #accessories .info .room-list {
        padding: 20px 0 20px 20px;
    }

    #accessories .info .room-list-actions {
        padding: 0 0 20px 20px;
    }

    #accessories .content {
        flex: 1;
        padding: 20px;
        display: flex;
        flex-direction: column;
        overflow: auto;
    }

    #accessories .content .room-layout {
        margin: 0 0 30px 0;
    }

    #accessories .content .room-layout h2 {
        margin: 0;
        padding: 0;
        line-height: normal;
        font-size: 22px;
        color: var(--title-text);
    }

    #accessories .content .accessory-tiles {
        flex-flow: row wrap;
        display: flex;
        justify-content: flex-start;
    }

    #accessories .content .accessory-tiles .accessory {
        margin: 0.4rem 0.8rem 0.4rem 0;
        width: 190px;
        height: 226px;
        user-select: none;
    }

    @media (min-width: 300px) and (max-width: 815px) {
        #accessories .info {
            display: none;
        }

        #accessories .content .accessory-tiles {
            flex-flow: unset;
            display: flex;
            flex-direction: column;
            align-content: center;
            align-items: center;
            justify-content: flex-start;
        }
    }
</style>
