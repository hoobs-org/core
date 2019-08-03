<template>
    <div id="port-field">
        <span class="title">{{ name }}</span>
        <span v-if="description && description !== ''" class="description">{{ description }}</span>
        <input type="number" ref="field" autocomplete="false" min="1" step="1" max="65535" :value="value" @input="update()" @change="change" v-bind:required="required" />
    </div>
</template>

<script>
    export default {
        name: "port-field",
        props: {
            name: String,
            description: String,
            value: Number,
            required: {
                type: Boolean,
                default: false
            }
        },

        methods: {
            update() {
                this.$emit("input", parseInt(this.$refs.field.value, 10));
            },

            change() {
                this.$emit("change", this.$refs.field.value);
            }
        }
    };
</script>

<style scoped>
    #port-field {
        display: flex;
        flex-direction: column;
        padding: 0 0 20px 0;
    }

    #port-field .title {
        font-weight: bold;
    }

    #port-field .description {
        font-size: 12px;
    }

    #port-field input {
        flex: 1;
        padding: 7px;
        font-size: 14px;
        background: var(--input-background);
        color: var(--input-text);
        border: 1px var(--border) solid;
        border-radius: 5px;
    }

    #port-field input:focus {
        outline: 0 none;
        border-color: var(--title-text);
    }
</style>
