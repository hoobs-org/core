<template>
    <div id="password-field">
        <span class="title">{{ name }}</span>
        <span v-if="description && description !== ''" class="description">{{ description }}</span>
        <input type="password" ref="field" autocomplete="false" :value="value" @input="update()" @change="change" />
    </div>
</template>

<script>
    export default {
        name: "password-field",
        props: {
            name: String,
            description: String,
            value: String
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
    #password-field {
        display: flex;
        flex-direction: column;
        padding: 0 0 20px 0;
    }

    #password-field .title {
        font-weight: bold;
    }

    #password-field .description {
        font-size: 12px;
    }

    #password-field input {
        flex: 1;
        padding: 7px;
        font-size: 14px;
        background: var(--input-background);
        color: var(--input-text);
        border: 1px var(--border) solid;
        border-radius: 5px;
    }

    #password-field input:focus {
        outline: 0 none;
        border-color: var(--title-text);
    }
</style>
