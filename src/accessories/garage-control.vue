<template>
    <div id="control">
        <svg version="1.1" width="190" height="190" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" @click="toggle">
            <path style="fill: var(--background-accent); stroke: var(--text-light);" stroke-width="0.5" d="M50,16.5L9.1,38v49.3h81.8V38L50,16.5z" />
            <polygon :fill="$theme.accessories.garage" points="5,35.2 50,12.7 95,35.2 95,41.3 95,43.4 50,20.9 5,43.4 5,41.3" />
            <g v-if="value.values.target_door_state === 1">
                <rect fill="#787878" x="19.3" y="50.5" width="61.4" height="36.8" style="cursor: pointer;" />
                <polygon fill="#686868" points="76.6,50.5 23.4,50.5 19.3,50.5 19.3,54.6 19.3,87.3 23.4,87.3 23.4,54.6 76.6,54.6 76.6,87.3  80.7,87.3 80.7,54.6 80.7,50.5" style="cursor: pointer;" />
                <path fill="#999999" d="M80.7,66.9H19.3v-4.1h61.4V66.9z M80.7,71H19.3V75h61.4V71z M80.7,79.1H19.3v4.1h61.4V79.1z M80.7,54.6H19.3 v4.1h61.4V54.6z" style="cursor: pointer;" />
                <path fill="#8a8a8a" d="M80.7,58.7h-4.1v-4.1h4.1V58.7z M80.7,62.8h-4.1v4.1h4.1V62.8z M80.7,71h-4.1V75h4.1V71z M80.7,79.1h-4.1v4.1 h4.1V79.1z M23.4,54.6h-4.1v4.1h4.1V54.6z M23.4,62.8h-4.1v4.1h4.1V62.8z M23.4,71h-4.1V75h4.1V71z M23.4,79.1h-4.1v4.1h4.1V79.1z" style="cursor: pointer;" />
            </g>
            <g v-else>
                <rect fill="#686868" x="19.3" y="50.5" width="61.4" height="4.1" style="cursor: pointer;" />
                <rect fill="#4f4f4f" x="19.3" y="54.6" width="61.4" height="32.7" style="cursor: pointer;" />
                <rect fill="#999999" x="19.3" y="54.6" width="61.4" height="4.1" style="cursor: pointer;" />
                <path fill="#8a8a8a" d="M80.7,58.7h-4.1v-4.1h4.1V58.7z M23.4,54.6h-4.1v4.1h4.1V54.6z" style="cursor: pointer;" />
                <polygon fill="#333333" points="19.3,58.7 19.3,77.1 19.3,87.3 29.5,77.1 70.5,77.1 80.7,87.3 80.7,77.1 80.7,58.7" style="cursor: pointer;" />
            </g>
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
        name: "garage-control",
        props: {
            value: Object,
            lock: {
                type: Boolean,
                default: false
            }
        },

        methods: {
            rename() {
                this.$emit("change", this.value);
            },

            toggle(event) {
                event.preventDefault();
                event.stopPropagation();

                this.value.values.target_door_state = this.value.values.target_door_state  === 1 ? 0 : 1;

                this.control("target_door_state", this.value.values.target_door_state);
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
