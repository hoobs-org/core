<template>
    <div id="integer-field">
        <span class="title">{{ name }}</span>
        <span v-if="description && description !== ''" class="description">{{ description }}</span>
        <input type="number" ref="field" autocomplete="false" step="1" :value="value" @input="update()" @change="change" />
    </div>
</template>

<script>
    export default {
        name: "integer-field",
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
    #integer-field {
        display: flex;
        flex-direction: column;
        padding: 0 0 20px 0;
    }

    #integer-field .title {
        font-weight: bold;
    }

    #integer-field .description {
        font-size: 12px;
    }

    #integer-field input {
        flex: 1;
        padding: 7px;
        font-size: 14px;
        background: var(--input-background);
        color: var(--input-text);
        border: 1px var(--border) solid;
        border-radius: 5px;
    }

    #integer-field input:focus {
        outline: 0 none;
        border-color: var(--title-text);
    }
</style>
