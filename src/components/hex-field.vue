<template>
    <div id="hex-field">
        <span class="title">{{ name }}</span>
        <span v-if="description && description !== ''" class="description">{{ description }}</span>
        <div class="field-container">
            <input type="text" ref="field" autocomplete="false" :value="value" @input="update()" @change="change" v-bind:required="required" />
            <div class="regenerate-link" v-on:click="generate()">
                <span class="icon">autorenew</span>
            </div>
        </div>
    </div>
</template>

<script>
    export default {
        name: "hex-field",
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
            },

            async generate() {
                const username = (await this.api.get("/config/generate")).username || "";

                this.$emit("input", username);
            }
        }
    };
</script>

<style scoped>
    #hex-field {
        display: flex;
        flex-direction: column;
        padding: 0 0 20px 0;
    }

    #hex-field .title {
        font-weight: bold;
    }

    #hex-field .description {
        font-size: 12px;
    }

    #hex-field input {
        flex: 1;
        padding: 7px;
        font-size: 14px;
        background: var(--input-background);
        color: var(--input-text);
        border: 1px var(--border) solid;
        border-radius: 5px;
    }

    #hex-field input:focus {
        outline: 0 none;
        border-color: var(--title-text);
    }

    #hex-field .field-container {
        display: flex;
        position: relative;
    }

    #hex-field .regenerate-link {
        width: 33px;
        height: 33px;
        position: absolute;
        top: 0;
        right: 0;
        display: flex;
        align-items: center;
        align-content: center;
        justify-content: space-around;
        cursor: pointer;
    }

    #hex-field .regenerate-link .icon {
        font-size: 17px;
    }
</style>
