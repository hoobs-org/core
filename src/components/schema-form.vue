<template>
    <div id="schema-form">
        <div v-for="(field, index) in fields" :key="index">
            <div v-if="fieldType(field) === 'input'">
                <component :is="getComponent(field)" :name="field.title || humanize(field.name)" :options="getOptions(field)" :type="getType(field)" :required="field.required" :description="field.description || ''" v-model="value[field.name]" />
            </div>
            <div v-else-if="fieldType(field) === 'form'">
                <schema-form :schema="field.properties" v-model="value[field.name]" />
            </div>
            <div v-else-if="fieldType(field) === 'button'">
                <div class="field">
                    <div v-on:click.stop="configNav(field.url)" class="button">{{ field.title || humanize(field.name) }}</div>
                </div>
            </div>
            <div v-else-if="fieldType(field) === 'json'">
                <div class="field">
                    <span class="title">{{ field.title || humanize(field.name) }}</span>
                    <json-editor :name="field.name" :height="200" :index="0" :change="updateJson" :code="getJson(field)" />
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import Decamelize from "decamelize";
    import Inflection from "inflection";

    import JSONEditor from "@/components/json-editor.vue";
    import TextField from "@/components/text-field.vue";
    import PasswordField from "@/components/password-field.vue";
    import NumberField from "@/components/number-field.vue";
    import IntegerField from "@/components/integer-field.vue";
    import SelectField from "@/components/select-field.vue";

    export default {
        name: "schema-form",

        components: {
            "json-editor": JSONEditor,
            "text-field": TextField,
            "password-field": PasswordField,
            "number-field": NumberField,
            "integer-field": IntegerField,
            "select-field": SelectField
        },

        props: {
            value: Object,
            schema: {
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

                    if (field.default !== undefined && this.value[field.name] === undefined) {
                        this.value[field.name] = field.default;
                    }

                    if (field.const !== undefined) {
                        this.value[field.name] = field.const;
                    }

                    results.push(field);
                }

                return results;
            }
        },

        mounted() {
            const keys = Object.keys(this.schema);

            for (let i = 0; i < keys.length; i++) {
                const field = this.schema[keys[i]];

                if (field.default !== undefined && this.value[keys[i]] === undefined) {
                    this.value[keys[i]] = field.default;
                }

                if (field.const !== undefined) {
                    this.value[keys[i]] = field.const;
                }
            }

            this.$emit("input", this.value);
        },

        methods: {
            updateJson(name, code) {
                let current = null;

                try {
                    current = JSON.parse(JSON.stringify(this.value[name]));
                } catch {
                    current = null;
                }

                if (!code || (code || "").length === 0) {
                    delete this.value[name];
                } else {
                    try {
                        this.value[name] = JSON.parse(code);
                    } catch {
                        this.value[name] = current;
                    }
                }
            },

            getJson(field) {
                if (!this.value[field.name]) {
                    return "";
                }

                return JSON.stringify(this.value[field.name], null, 4);
            },

            configNav(url) {
                const regex = /\{\{(.*?)\}\}/mg;

                let match;
                let results = url;

                while ((match = regex.exec(url)) !== null) {
                    if (match.index === regex.lastIndex) {
                        regex.lastIndex++;
                    }

                    match.forEach((match, index) => {
                        if (index === 0) {
                            switch (match) {
                                case "{{domain}}":
                                    let domain = this.$instance;

                                    if (domain === "") {
                                        domain = `${window.location}`;
                                    }

                                    domain = domain.split("/")[2];
                                    domain = domain.split(":")[0];

                                    results = results.replace(/{{domain}}/gi, domain);
                                    break;
                                
                                default:
                                    const key = match.replace("{{", "").replace("}}", "");

                                    if (this.value[key]) {
                                        results = results.replace(new RegExp(match, "gi"), this.value[key]);
                                    }

                                    break;
                            }
                        }
                    });
                }

                window.open(results);
            },

            fieldType(field) {
                let type = "string";

                if (Array.isArray(field.type)) {
                    type = field.type[field.type.length - 1].toLowerCase();
                } else {
                    type = (field.type || "").toLowerCase();
                }

                if (type === "button" && field.url && field.url !== "") {
                    return "button";
                } else if (field && !field.readOnly && type !== "object" && type !== "array") {
                    return "input";
                } else if (field && !field.readOnly && type === "object" && field.properties) {
                    if (field.name && !this.value[field.name]) {
                        this.value[field.name] = {};
                    }

                    return "form";
                } else if (field && !field.readOnly && (type === "object" || type === "array")) {
                    if (!this.value[field.name] && type === "array") {
                        this.value[field.name] = [];
                    } else if (!this.value[field.name]) {
                        this.value[field.name] = {};
                    }

                    return "json";
                }

                return null;
            },

            getComponent(field) {
                let type = "string";

                if (Array.isArray(field.type)) {
                    type = field.type[field.type.length - 1].toLowerCase();
                } else {
                    type = (field.type || "").toLowerCase();
                }

                switch(type) {
                    case "text":
                    case "string":
                        if (field.enum) {
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
                        if (field.enum) {
                            return "select-field";
                        }

                        return "number-field";

                    case "int":
                    case "integer":
                        if (field.enum) {
                            return "select-field";
                        }

                        return "integer-field";

                    case "bool":
                    case "boolean":
                        return "select-field";
                }

                return null;
            },

            defaultValue(field) {
                let type = "string";

                if (Array.isArray(field.type)) {
                    type = field.type[field.type.length - 1].toLowerCase();
                } else {
                    type = (field.type || "").toLowerCase();
                }

                switch(type) {
                    case "text":
                    case "string":
                        return field.default || "";
                    
                    case "float":
                    case "decimal":
                    case "double":
                    case "number":
                    case "int":
                    case "integer":
                        return field.default || 0;

                    case "bool":
                    case "boolean":
                        return field.default || false;
                    
                    case "date":
                        return field.default ? new Date(field.default.replace(/\s/, "T")) : new Date();
                }

                return null;
            },

            getType(field) {
                let type = "string";

                if (Array.isArray(field.type)) {
                    type = field.type[field.type.length - 1].toLowerCase();
                } else {
                    type = (field.type || "").toLowerCase();
                }

                return type;
            },

            getOptions(field) {
                let type = "string";

                if (Array.isArray(field.type)) {
                    type = field.type[field.type.length - 1].toLowerCase();
                } else {
                    type = (field.type || "").toLowerCase();
                }

                const options = [];

                if (field.enum && Array.isArray(field.enum)) {
                    if (!field.required) {
                        options.push({
                            text: "",
                            value: this.defaultValue(field)
                        });
                    }

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
                } else if (type === "boolean" || type === "bool") {
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
            },

            humanize(string) {
                return Inflection.titleize(Decamelize(string.replace(/-/gi, " ").replace(/homebridge/gi, "").trim()));
            }
        }
    };
</script>
