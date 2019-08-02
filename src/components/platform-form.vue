<template>
    <div id="platform-form">
        <div v-for="(field, index) in fields" :key="index">
            <div v-if="field && !field.readOnly && field.type.toLowerCase() === 'object'">
                <platform-form :schema="field.properties || {}" v-model="value[field.name]" />
            </div>
            <div v-else-if="field && !field.readOnly">
                <component :is="getComponent(field)" :name="field.title" :options="getOptions(field)" v-model="value[field.name]" />
            </div>
        </div>
    </div>
</template>

<script>
    import TextField from "@/components/text-field.vue";
    import PasswordField from "@/components/password-field.vue";
    import NumberField from "@/components/number-field.vue";
    import SelectField from "@/components/select-field.vue";

    export default {
        name: "platform-form",

        components: {
            "text-field": TextField,
            "password-field": PasswordField,
            "number-field": NumberField,
            "select-field": SelectField
        },

        props: {
            schema: {
                type: Object,
                default: {}
            },
            value: {
                type: Object,
                default: {}
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
            getComponent(field) {
                switch((field.type || "").toLowerCase()) {
                    case "string":
                        if (field.oneOf || field.enum) {
                            return "select-field";
                        }

                        if (field.options && field.options.hidden) {
                            return "password-field";
                        }

                        return "text-field";

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
                                text: field.enum[i].toString(),
                                value: field.enum[i].toString()
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
                }

                return options;
            }
        }
    };
</script>

<style scoped>
    
</style>
