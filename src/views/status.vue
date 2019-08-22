<template>
    <div id="status">
        <div class="content">
            <grid-layout :layout.sync="grid" :col-num="12" :row-height="30" :is-draggable="true" :is-resizable="true" :is-mirrored="false" :vertical-compact="true" :margin="[10, 10]" :use-css-transforms="true" @layout-updated="updateDashboard">
                <grid-item class="widget" v-for="(item, index) in grid" :key="index" :x="item.x" :y="item.y" :w="item.w" :h="item.h" :i="item.i">
                    <component :is="item.component" />
                </grid-item>
            </grid-layout>
        </div>
    </div>
</template>

<script>
    import GridLayout from "vue-grid-layout";

    import FavoriteAccessories from "@/widgets/favorite-accessories.vue";
    import SetupPIN from "@/widgets/setup-pin.vue";
    import SystemLoad from "@/widgets/system-load.vue";
    import SystemInfo from "@/widgets/system-info.vue";
    import Weather from "@/widgets/weather.vue";

    export default {
        name: "status",

        components: {
            "grid-layout": GridLayout.GridLayout,
            "grid-item": GridLayout.GridItem,
            "favorite-accessories": FavoriteAccessories,
            "setup-pin": SetupPIN,
            "system-load": SystemLoad,
            "system-info": SystemInfo,
            "weather": Weather
        },

        data() {
            return {
                info: null,
                pin: false,
                grid: [{
                    x: 0,
                    y: 0,
                    w: 2,
                    h: 7,
                    i: "0",
                    component: "setup-pin"
                },{
                    x: 2,
                    y: 0,
                    w: 10,
                    h: 7,
                    i: "1",
                    component: "system-load"
                },{
                    x: 0,
                    y: 7,
                    w: 7,
                    h: 7,
                    i: "2",
                    component: "weather"
                },{
                    x: 0,
                    y: 14,
                    w: 7,
                    h: 8,
                    i: "3",
                    component: "favorite-accessories"
                },{
                    x: 7,
                    y: 7,
                    w: 5,
                    h: 15,
                    i: "4",
                    component: "system-info"
                }]
            };
        },

        async mounted() {
            this.info = await this.api.get("/");
        },

        methods: {
            updateDashboard() {
                console.log(JSON.stringify(this.grid, null, 4));
            }
        }
    };
</script>

<style scoped>
    #status {
        flex: 1;
        padding: 0;
        display: flex;
        flex-direction: row;
        overflow: hidden;
    }

    #status .pin {
        height: 290px;
        padding: 0 20px 10px 20px;
        background: var(--background);
        box-shadow: var(--elevation-small);
        border-radius: 3px;
    }

    #status .widget {
        background: var(--background-light);
        box-shadow: var(--elevation-small);
        border-radius: 3px;
        box-sizing: border-box;
        overflow: auto;
    }

    #status .content {
        flex: 1;
        overflow: auto;
    }
</style>
