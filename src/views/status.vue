<!-------------------------------------------------------------------------------------------------
 | hoobs-core                                                                                     |
 | Copyright (C) 2020 HOOBS                                                                       |
 |                                                                                                |
 | This program is free software: you can redistribute it and/or modify                           |
 | it under the terms of the GNU General Public License as published by                           |
 | the Free Software Foundation, either version 3 of the License, or                              |
 | (at your option) any later version.                                                            |
 |                                                                                                |
 | This program is distributed in the hope that it will be useful,                                |
 | but WITHOUT ANY WARRANTY; without even the implied warranty of                                 |
 | MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the                                  |
 | GNU General Public License for more details.                                                   |
 |                                                                                                |
 | You should have received a copy of the GNU General Public License                              |
 | along with this program.  If not, see <http://www.gnu.org/licenses/>.                          |
 -------------------------------------------------------------------------------------------------->

<template>
    <div id="status">
        <div class="content mobile-hide">
            <grid-layout :layout.sync="grid" :col-num="12" :row-height="30" :is-draggable="true" :is-resizable="true" :is-mirrored="false" :vertical-compact="true" :margin="[10, 10]" :use-css-transforms="true" @layout-updated="updateDashboard">
                <grid-item class="widget" v-for="(item, index) in grid" :key="index" :x="item.x" :y="item.y" :w="item.w" :h="item.h" :i="item.i">
                    <component :is="item.component" :item="item" :index="index" :change="updateItem" />
                </grid-item>
            </grid-layout>
        </div>
        <div class="mobile-content mobile-show">
            <system-info />
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
    import Log from "@/widgets/log.vue";

    export default {
        name: "status",

        components: {
            "grid-layout": GridLayout.GridLayout,
            "grid-item": GridLayout.GridItem,
            "favorite-accessories": FavoriteAccessories,
            "setup-pin": SetupPIN,
            "system-load": SystemLoad,
            "system-info": SystemInfo,
            "weather": Weather,
            "log": Log
        },

        data() {
            return {
                grid: [],
                loaded: false,
            };
        },

        async mounted() {
            if (this.$cluster) {
                this.$router.push({
                    path: "/users"
                });
            } else {
                this.grid = await this.api.get("/layout/dashboard");
                this.loaded = true;
            }
        },

        methods: {
            async updateItem(index, name, value) {
                this.grid[index][name] = value;

                await this.updateDashboard();
             },

            async updateDashboard() {
                if (this.loaded) {
                    const data = JSON.parse(JSON.stringify(this.grid));

                    for (let i = 0; i < data.length; i++) {
                        delete data[i].moved;
                    }

                    await this.api.post("/layout/dashboard", data);
                }
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

    #status .empty {
        width: 90%;
        padding: 20px;
        text-align: center;
    }

    #status .mobile-content {
        flex: 1;
        overflow: auto;
        display: none;
    }

    @media (min-width: 300px) and (max-width: 815px) {
        #status .mobile-content {
            display: flex;
        }
    }
</style>
