<template>
    <div id="platform-form">
        <div v-for="(field, index) in fields" :key="index">
            <div v-if="fieldType(field) === 'input'">
                <component :is="getComponent(field)" :name="field.title" :options="getOptions(field)" :required="field.required" v-model="value[field.name]" />
            </div>
            <div v-else-if="fieldType(field) === 'form'">
                <platform-form :schema="field.properties" v-model="value[field.name]" />
            </div>
            <div v-else-if="fieldType(field) === 'select-form'">

            </div>
        </div>
    </div>
</template>

<script>
    import TextField from "@/components/text-field.vue";
    import PasswordField from "@/components/password-field.vue";
    import NumberField from "@/components/number-field.vue";
    import IntegerField from "@/components/integer-field.vue";
    import SelectField from "@/components/select-field.vue";

    export default {
        name: "platform-form",

        components: {
            "text-field": TextField,
            "password-field": PasswordField,
            "number-field": NumberField,
            "integer-field": IntegerField,
            "select-field": SelectField
        },

        props: {
            schema: {
                type: Object,
                default: () => {
                    return {};
                }
            },
            value: {
                type: Object,
                default: () => {
                    return {};
                }
            }
        },

        computed: {
            fields() {
                const results = [];
                const keys = Object.keys(this.schema);

                for (let i = 0; i < keys.length; i++) {
                    const field = this.schema[keys[i]];

                    field.name = keys[i];

                    results.push(field);
                }

                return results;
            }
        },

        methods: {
            fieldType(field) {
                if (field && !field.readOnly && field.type.toLowerCase() !== "object") {
                    return "input";
                } else if (field && !field.readOnly && field.type.toLowerCase() === "object" && field.properties) {
                    return "form";
                } else if (field && !field.readOnly && field.type.toLowerCase() === "object" && field.oneOf) {
                    return "select-form";
                } else if (field && !field.readOnly && field.type.toLowerCase() === "object" && field.enum) {
                    return "complex-form";
                }

                return null;
            },

            getComponent(field) {
                switch((field.type || "").toLowerCase()) {
                    case "text":
                    case "string":
                        if (field.oneOf || field.enum) {
                            return "select-field";
                        }

                        if (field.options && field.options.hidden) {
                            return "password-field";
                        }

                        return "text-field";
                    
                    case "float":
                    case "decimal":
                    case "double":
                    case "number":
                        if (field.oneOf || field.enum) {
                            return "select-field";
                        }

                        return "number-field";

                    case "int":
                    case "integer":
                        if (field.oneOf || field.enum) {
                            return "select-field";
                        }

                        return "integer-field";

                    case "bool":
                    case "boolean":
                        return "select-field";

                    default:
                        return "unknown";
                }
            },

            getOptions(field) {
                const options = [];

                if (!field.required) {
                    options.push({
                        text: "",
                        value: null
                    });
                }

                if (field.enum && Array.isArray(field.enum)) {
                    for (let i = 0; i < field.enum.length; i++) {
                        if (field.enum[i].text && field.enum[i].value) {
                            options.push({
                                text: field.enum[i].text,
                                value: field.enum[i].value
                            });
                        } else if (typeof field.enum[i] !== "object") {
                            options.push({
                                text: `${field.enum[i]}`,
                                value: field.enum[i]
                            });
                        }
                    }
                } else if (field.oneOf && Array.isArray(field.oneOf)) {
                    for (let i = 0; i < field.enum.length; i++) {
                        if (field.enum[i].title && field.enum[i].enum && Array.isArray(field.enum[i].enum) && field.enum[i].enum.length > 0) {
                            options.push({
                                text: field.enum[i].title,
                                value: field.enum[i].enum[0]
                            });
                        } else if (field.enum[i].title) {
                            options.push({
                                text: field.enum[i].title,
                                value: field.enum[i].title
                            });
                        }
                    }
                } else if ((field.type || "").toLowerCase() === "boolean" || (field.type || "").toLowerCase() === "bool") {
                    options.push({
                        text: this.$t("yes"),
                        value: true
                    });

                    options.push({
                        text: this.$t("no"),
                        value: false
                    });
                }

                return options;
            }
        }
    };
</script>

<style scoped>
    
</style>
