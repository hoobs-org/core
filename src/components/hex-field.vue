<!-------------------------------------------------------------------------------------------------
 | hoobs-core                                                                                     |
 | Copyright (C) 2020 HOOBS                                                                       |
 |                                                                                                |
 | This program is free software: you can redistribute it and/or modify                           |
 | it under the terms of the GNU General Public License as published by                           |
 | the Free Software Foundation, either version 3 of the License, or                              |
 | (at your option) any later version.                                                            |
 |                                                                                                |
 | This program is distributed in the hope that it will be useful,                                |
 | but WITHOUT ANY WARRANTY; without even the implied warranty of                                 |
 | MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the                                  |
 | GNU General Public License for more details.                                                   |
 |                                                                                                |
 | You should have received a copy of the GNU General Public License                              |
 | along with this program.  If not, see <http://www.gnu.org/licenses/>.                          |
 -------------------------------------------------------------------------------------------------->

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
