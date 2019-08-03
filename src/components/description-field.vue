<template>
    <div id="description-field">
        <span class="title">{{ name }}</span>
        <span v-if="description && description !== ''" class="description">{{ description }}</span>
        <textarea ref="field" autocomplete="false" :value="value" @input="update()" @change="change" v-bind:required="required"></textarea>
    </div>
</template>
required
<script>
    export default {
        name: "description-field",
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
    #description-field {
        display: flex;
        flex-direction: column;
        padding: 0 0 20px 0;
    }

    #description-field .title {
        font-weight: bold;
    }

    #description-field .description {
        font-size: 12px;
    }

    #description-field textarea {
        flex: 1;
        min-height: 107px;
        padding: 7px;
        font-size: 14px;
        background: var(--input-background);
        color: var(--input-text);
        border: 1px var(--border) solid;
        border-radius: 5px;
        resize: none;
    }

    #description-field textarea:focus {
        outline: 0 none;
        border-color: var(--title-text);
    }
</style>
