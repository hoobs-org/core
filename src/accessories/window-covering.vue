<template>
    <div id="control">
        <svg version="1.1" width="100" height="100" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
            <rect x="13.3" y="7.1" style="fill: #fefefe; stroke: #cccccc; stroke-width: 0.25;" width="73.4" height="85.8" />
            <rect x="20.4" y="13.9" style="fill: #feb400; stroke: #cccccc;" width="59.2" height="72.2" />
            <g v-if="value.values.target_position > 0">
                <rect x="20.4" y="13.9" style="fill: #fefefe; stroke: #cccccc; stroke-width: 0.25;" width="59.2" height="7.6" />
                <circle style="fill: #fefefe; stroke: #cccccc; stroke-width: 0.5;" cx="50" cy="22" r="4.3" />
                <path style="fill: #cccccc;" d="M51.9,20.6L50,22.7l-1.9-2.1l-0.6,0.7l2.5,2.8l2.4-2.8L51.9,20.6z" />
            </g>
            <g v-else>
                <rect x="20.4" y="13.9" style="fill: #fefefe; stroke: #cccccc; stroke-width: 0.25;" width="59.2" height="72.2" />
                <circle style="fill: #fefefe; stroke: #cccccc; stroke-width: 0.5;" cx="50" cy="87" r="4.3" />
                <path style="fill: #cccccc;" d="M48.1,88.4l1.9-2.1l1.9,2.1l0.6-0.7L50,84.9l-2.4,2.8L48.1,88.4z" />
            </g>
        </svg>
        <div class="name">{{ value.name || value.service_name }}</div>
        <div v-if="lock" class="lock"></div>
    </div>
</template>

<script>
    export default {
        name: "window-covering",
        props: {
            value: Object,
            lock: {
                type: Boolean,
                default: false
            }
        },

        methods: {
            toggle(event) {
                event.preventDefault();
                event.stopPropagation();

                this.value.values.target_position = this.value.values.target_position  === 0 ? 100 : 0;

                this.control("target_position", this.value.values.target_position);
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
    }

    #control .name {
        text-align: center;
        height: 40px;
        font-size: 15px;
        overflow: hidden;
        text-overflow: ellipsis;
    }
</style>
