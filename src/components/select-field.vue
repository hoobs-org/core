<template>
    <div id="select-field">
        <span class="title">{{ name }}</span>
        <span v-if="description && description !== ''" class="description">{{ description }}</span>
        <select ref="field" v-model="value" @input="update()" @change="change()" v-bind:required="required">
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
            value: [String, Number, Boolean, Object, Date],
            type: String,
            options: Array,
            required: {
                type: Boolean,
                default: false
            }
        },

        methods: {
            update() {
                let value = null;

                switch ((this.type || "string").toLowerCase()) {
                    case "bool":
                    case "boolean":
                        this.$emit("input", (this.$refs.field.value || "").toLowerCase() === "true");
                        break;

                    case "float":
                    case "double":
                    case "decimal":
                    case "number":
                        value = parseFloat(this.$refs.field.value);

                        if (Number.isNaN(value)) {
                            value = null;
                        }

                        this.$emit("input", value);
                        break;

                    case "int":
                    case "integer":
                        value = parseInt(this.$refs.field.value, 10);

                        if (Number.isNaN(value)) {
                            value = null;
                        }

                        this.$emit("input", value);
                        break;

                    default:
                        this.$emit("input", this.$refs.field.value);
                        break;
                }
            },

            change() {
                let value = null;

                switch ((this.type || "string").toLowerCase()) {
                    case "bool":
                    case "boolean":
                        this.$emit("change", (this.$refs.field.value || "").toLowerCase() === "true");
                        break;

                    case "float":
                    case "double":
                    case "decimal":
                    case "number":
                        value = parseFloat(this.$refs.field.value);

                        if (Number.isNaN(value)) {
                            value = null;
                        }

                        this.$emit("change", value);
                        break;

                    case "int":
                    case "integer":
                        value = parseInt(this.$refs.field.value, 10);

                        if (Number.isNaN(value)) {
                            value = null;
                        }

                        this.$emit("change", value);
                        break;

                    default:
                        this.$emit("change", this.$refs.field.value);
                        break;
                }
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
