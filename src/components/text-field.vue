<template>
    <div id="text-field">
        <span class="title">{{ name }}</span>
        <span v-if="description && description !== ''" class="description">{{ description }}</span>
        <input type="text" ref="field" autocomplete="false" autocorrect="off" autocapitalize="none" :value="value" @input="update()" @change="change" v-bind:required="required" />
    </div>
</template>

<script>
    export default {
        name: "text-field",
        props: {
            name: String,
            description: String,
            value: String,
            required: {
                type: Boolean,
                default: false
            }
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
    #text-field {
        display: flex;
        flex-direction: column;
        padding: 0 0 20px 0;
    }

    #text-field .title {
        font-weight: bold;
    }

    #text-field .description {
        font-size: 12px;
    }

    #text-field input {
        flex: 1;
        padding: 7px;
        font-size: 14px;
        background: var(--input-background);
        color: var(--input-text);
        border: 1px var(--border) solid;
        border-radius: 5px;
    }

    #text-field input:focus {
        outline: 0 none;
        border-color: var(--title-text);
    }
</style>
