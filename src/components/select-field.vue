<template>
    <div id="select-field">
        <span class="title">{{ name }}</span>
        <span v-if="description && description !== ''" class="description">{{ description }}</span>
        <select ref="field" v-model="value" @input="update()" @change="change()">
            <option v-for="option in options" v-bind:value="option.value" :key="option.value">
                {{ option.text }}
            </option>
        </select>
    </div>
</template>

<script>
    export default {
        name: "select-field",

        props: {
            name: String,
            description: String,
            value: [String, Number, Boolean],
            options: Array
        },

        methods: {
            update() {
                this.$emit("input", this.$refs.field.value);
            },

            change() {
                this.$emit("change", this.$refs.field.value);
            }
        }
    };
</script>

<style scoped>
    #select-field {
        display: flex;
        flex-direction: column;
        padding: 0 0 20px 0;
    }

    #select-field .title {
        font-weight: bold;
    }

    #select-field .description {
        font-size: 12px;
    }

    #select-field select {
        padding: 7px;
        font-size: 14px;
        height: 33px !important;
        background: var(--input-background);
        color: var(--input-text);
        border: 1px var(--border) solid;
        border-radius: 5px;
    }

    #select-field select:focus {
        outline: 0 none;
        border-color: var(--title-text);
    }
</style>
