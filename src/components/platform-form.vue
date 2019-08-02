<template>
    <div id="platform-form">
        <div v-for="(field, index) in fields" :key="index">
            <div v-if="field && !field.readOnly && field.type.toLowerCase() === 'object'">
                <platform-form :schema="field.properties || {}" v-model="value[field.name]" />
            </div>
            <div v-else-if="field && !field.readOnly">
                <component :is="getComponent(field)" :name="field.title" v-model="value[field.name]" />
            </div>
        </div>
    </div>
</template>

<script>
    import TextField from "@/components/text-field.vue";
    import PasswordField from "@/components/password-field.vue";

    export default {
        name: "platform-form",

        components: {
            "text-field": TextField,
            "password-field": PasswordField
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
                        if (field.options && field.options.hidden) {
                            return "password-field";
                        }

                        return "text-field";

                    default:
                        return "unknown";
                }
            }
        }
    };
</script>

<style scoped>
    
</style>
