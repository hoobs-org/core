<template>
    <div id="number-field">
        <span class="title">{{ name }}</span>
        <span v-if="description && description !== ''" class="description">{{ description }}</span>
        <input type="number" ref="field" autocomplete="false" :value="value" @input="update()" @change="change" />
    </div>
</template>

<script>
    export default {
        name: "number-field",
        props: {
            name: String,
            description: String,
            value: Number
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
    #number-field {
        display: flex;
        flex-direction: column;
        padding: 0 0 20px 0;
    }

    #number-field .title {
        font-weight: bold;
    }

    #number-field .description {
        font-size: 12px;
    }

    #number-field input {
        flex: 1;
        padding: 7px;
        font-size: 14px;
        background: var(--input-background);
        color: var(--input-text);
        border: 1px var(--border) solid;
        border-radius: 5px;
    }

    #number-field input:focus {
        outline: 0 none;
        border-color: var(--title-text);
    }
</style>
