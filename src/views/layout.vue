<template>
    <div v-if="user.admin" id="layout">
        <div v-if="loaded" id="rooms" class="info">
            <div class="room-list">
                <draggable handle=".icon" ghost-class="ghost" v-model="layout.rooms" @end="saveLayout()">
                    <div v-for="(room, index) in layout.rooms" :key="index">
                        <div v-if="room.name !== 'Unassigned'" class="room-link" @click="showRoom(index)"><span class="icon">reorder</span> {{ room.name }}</div>
                    </div>
                </draggable>
                <div class="room-link" @click="showRoom(layout.rooms.length - 1)">{{ $t("unassigned") }}</div>
            </div>
            <div class="room-list-actions">
                <div class="button" @click="addRoom()">{{ $t("add_room") }}</div>
            </div>
        </div>
        <div v-if="loaded" class="content">
            <div v-if="current !== undefined && layout.rooms[current].name !== 'Unassigned'">
                <div class="form">
                    <h2>{{ $t("room_settings") }}</h2>
                    <p>
                        {{ $t("room_settings_message") }}
                    </p>
                    <text-field name="Room Name" description="Define the name of your room.." v-model="layout.rooms[current].name" @change="saveName()" />
                    <div class="action">
                        <div v-if="!confirm" class="button" @click="confirmDelete()">{{ $t("delete_room") }}</div>
                        <div v-if="confirm" class="button" @click="cancelDelete()">   {{ $t("cancel") }}   </div>
                        <div v-if="confirm" class="button button-warning" @click="deleteRoom()">   {{ $t("delete") }}   </div>
                    </div>
                    <h2>{{ $t("accessories") }}</h2>
                    <p>
                        {{ $t("accessories_message") }}
                    </p>
                    <draggable class="accessory-tiles" ghost-class="ghost" v-model="layout.rooms[current].accessories" @end="saveLayout()">
                        <div class="accessory" v-for="(aid, index) in layout.rooms[current].accessories" :key="index">
                            <component :is="getComponent(aid)" v-model="accessories[getAccessoryIndex(aid)]" :lock="true" />
                            <span class="icon delete" @click="removeAccessory(aid)">delete</span>
                            <span class="icon hide" @click="hideAccessory(aid)">visibility_off</span>
                        </div>
                    </draggable>
                    <div v-if="!add" class="action">
                        <div class="button" @click="showAvailable()">{{ $t("add_accessories") }}</div>
                    </div>
                    <h2 v-if="add">{{ $t("available_accessories") }}</h2>
                    <p v-if="add">
                        {{ $t("available_accessories_message") }}
                    </p>
                    <div v-if="add" class="available-acessories">
                        <div v-for="(accessory, index) in accessories" :key="index">
                            <div v-if="layout.rooms[current].accessories.indexOf(accessory.aid)" class="available-accessory">
                                <input type="checkbox" :id="`add-accessory-${index}`" :value="accessory.aid" v-model="selected"> <label :for="`add-accessory-${index}`">{{ accessory.name }}</label>
                            </div>
                        </div>
                    </div>
                    <div v-if="add" class="action">
                        <div class="button" @click="cancelAdd()">   {{ $t("cancel") }}   </div>
                        <div class="button button-primary" @click="addAccessories()">     {{ $t("add") }}     </div>
                    </div>
                </div>
            </div>
            <div v-else-if="current !== undefined">
                <div class="form">
                    <h2>{{ $t("unassigned_accessories") }}</h2>
                    <p>
                        {{ $t("unassigned_accessories_message") }}
                    </p>
                    <div class="accessory-tiles">
                        <div class="accessory" v-for="(aid, index) in layout.rooms[current].accessories" :key="index">
                            <component :is="getComponent(aid)" v-model="accessories[getAccessoryIndex(aid)]" :lock="true" />
                            <span class="icon hide" @click="hideAccessory(aid)">visibility_off</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import Draggable from "vuedraggable";
    import TextField from "@/components/text-field.vue";

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
        name: "layout",
        components: {
            "draggable": Draggable,
            "text-field": TextField,
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
                loaded: false,
                current: undefined,
                layout: {
                    rooms: []
                },
                accessories: [],
                confirm: false,
                selected: [],
                add: false
            }
        },

        computed: {
            user() {
                return this.$store.state.user;
            }
        },

        async mounted() {
            this.layout = await this.api.get("/layout");
            this.accessories = await this.api.get("/accessories/list");

            if (this.layout.rooms.length > 0) {
                this.current = 0;
            }

            this.loaded = true;
        },

        methods: {
            addRoom() {
                this.layout.rooms.unshift({
                    name: "",
                    accessories: []
                });

                this.saveLayout();
                this.current = 0;

                this.$el.querySelector("#rooms").scrollTo(0, 0);
            },

            showRoom(index) {
                this.current = index;
                this.confirm = false;
                this.add = false;
            },

            showAvailable() {
                this.selected = [],
                this.add = true;
            },

            cancelAdd() {
                this.selected = [],
                this.add = false;
            },

            confirmDelete() {
                this.confirm = true;
            },

            cancelDelete() {
                this.confirm = false;
            },

            deleteRoom() {
                const unassigned = this.layout.rooms.filter(r => r.name === "Unassigned")[0];

                for (let i = 0; i < this.layout.rooms[this.current].accessories.length; i++) {
                    unassigned.accessories.push(this.layout.rooms[this.current].accessories[i]);
                }

                this.layout.rooms.splice(this.current, 1);

                if (this.current >= this.layout.rooms.length - 1) {
                    this.current = this.layout.rooms.length - 2;
                }

                this.confirm = false;

                this.saveLayout();
            },

            addAccessories() {
                for (let i = 0; i < this.layout.rooms.length; i++) {
                    for (let j = 0; j < this.selected.length; j++) {
                        const index = this.layout.rooms[i].accessories.indexOf(parseInt(this.selected[j], 10));

                        if (index > -1) {
                            this.layout.rooms[i].accessories.splice(index, 1);
                        }
                    }
                }

                for (let i = 0; i < this.selected.length; i++) {
                    const index = this.layout.hidden.indexOf(parseInt(this.selected[i], 10));

                    if (index > -1) {
                        this.layout.hidden.splice(index, 1);
                    }
                }

                for (let i = 0; i < this.selected.length; i++) {
                    this.layout.rooms[this.current].accessories.push(parseInt(this.selected[i], 10));
                }

                this.add = false;
                this.selected = [];

                this.saveLayout();
            },

            removeAccessory(aid) {
                const unassigned = this.layout.rooms.filter(r => r.name === "Unassigned")[0];
                const index = this.layout.rooms[this.current].accessories.indexOf(aid);

                if (index > -1) {
                    this.layout.rooms[this.current].accessories.splice(index, 1);
                }

                if (unassigned.accessories.indexOf(aid) === -1) {
                    unassigned.accessories.push(aid);
                }

                this.saveLayout();
            },

            saveName() {
                if ((this.layout.rooms[this.current].name || "").toLowerCase() === "unassigned") {
                    this.layout.rooms[this.current].name = "";
                }

                this.saveLayout();
            },

            hideAccessory(aid) {
                const index = this.layout.rooms[this.current].accessories.indexOf(aid);

                if (index > -1) {
                    this.layout.rooms[this.current].accessories.splice(index, 1);
                }

                if (this.layout.hidden.indexOf(aid) === -1) {
                    this.layout.hidden.push(aid);
                }

                this.saveLayout();
            },

            getAccessoryIndex(aid) {
                return this.accessories.findIndex(a => a.aid === aid);
            },

            getComponent(aid) {
                const accessory = this.accessories[this.getAccessoryIndex(aid)];

                if (!accessory) {
                    for (let i = 0; i < this.layout.rooms.length; i++) {
                        const index = this.layout.rooms[i].accessories.indexOf(aid);

                        if (index >= 0) {
                            this.layout.rooms[i].accessories.splice(index, 1);

                            return "removed";
                        }
                    }

                    const hidden = this.layout.hidden.indexOf(aid);

                    this.layout.hidden.splice(hidden, 1);

                    return "removed";
                }

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
            },

            async saveLayout() {
                const data = JSON.parse(JSON.stringify(this.layout));
                const index = data.rooms.findIndex(r => r.name === "Unassigned");

                if (index > -1) {
                    data.rooms.splice(index, 1);
                }

                await this.api.post("/layout", data);
            }
        }
    }
</script>

<style scoped>
    #layout {
        flex: 1;
        padding: 0;
        display: flex;
        overflow: hidden;
    }

    #layout .info {
        width: 210px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        overflow: auto;
    }

    #layout .info .room-link {
        padding: 10px;
        border-bottom: 1px var(--border) solid;
        color: var(--text);
        text-decoration: none;
        display: flex;
        align-content: center;
        align-items: center;
        cursor: pointer;
        user-select: none;
    }

    #layout .info .room-link .icon {
        margin: -2px 7px 0 0;
        font-size: 17px;
        color: var(--text-light);
    }

    #layout .info .room-link:hover {
        color: var(--text-dark);
    }

    #layout .info .ghost {
        background: var(--border);
    }

    #layout .info .room-list {
        padding: 20px 0 20px 20px;
    }

    #layout .info .room-list-actions {
        padding: 0 0 20px 20px;
    }

    #layout .content {
        flex: 1;
        padding: 20px;
        display: flex;
        flex-direction: column;
        overflow: auto;
    }

    #layout .content .form {
        width: 100%;
    }

    #layout .form h2 {
        width: 100%;
        max-width: 580px;
        margin: 20px 0 5px 0;
        padding: 0;
        line-height: normal;
        font-size: 22px;
        color: var(--title-text);
    }

    #layout .form h2:first-child {
        margin: 0 0 5px 0;
    }

    #layout .form p {
        width: 100%;
        max-width: 580px;
        margin: 0 0 20px 0;
    }

    #layout .form #text-field {
        width: 100%;
        max-width: 580px;
        box-sizing: border-box;
    }

    #layout .form .action {
        width: 100%;
        max-width: 580px;
        padding: 0 0 20px 0;
        box-sizing: border-box;
    }

    #layout .form  .accessory-tiles {
        width: 100%;
        flex-flow: row wrap;
        display: flex;
        justify-content: flex-start;
    }

    #layout .form  .accessory-tiles .accessory {
        margin: 0.4rem 0.8rem 0.4rem 0;
        width: 190px;
        height: 226px;
        user-select: none;
    }

    #layout .form  .accessory-tiles .ghost {
        background: var(--border);
    }

    #layout .form  .accessory {
        position: relative;
    }

    #layout .form  .accessory .delete {
        position: absolute;
        bottom: 45px;
        right: 15px;
        font-size: 14px;
        color: var(--text-dim);
        cursor: pointer;
    }

    #layout .form  .accessory .hide {
        position: absolute;
        bottom: 45px;
        left: 18px;
        font-size: 14px;
        color: var(--text-dim);
        cursor: pointer;
    }

    #layout .form  .accessory .delete:hover,
    #layout .form  .accessory .hide:hover {
        color: var(--text-dark);
    }

    #layout .form .available-acessories {
        padding: 0 20px 20px 20px;
    }

    #layout .form .available-acessories .available-accessory {
        display: flex;
        align-content: center;
        align-items: center;
        margin: 7px 0;
        font-size: 14px;
    }

    #layout .form .available-acessories .available-accessory input {
        margin: 0 7px 0 0;
    }
</style>
