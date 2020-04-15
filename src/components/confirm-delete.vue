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
    <div id="confirm-delete">
        <div v-if="!showConfirm" class="button" v-on:click="confirm()">{{ title }}</div>
        <div v-if="showConfirm" class="button" v-on:click="cancel()">{{ $t("cancel") }}</div>
        <div v-if="showConfirm" class="button button-warning" v-on:click="execute()">{{ subtitle }}</div>
    </div>
</template>

<script>
    export default {
        name: "confirm-delete",

        props: {
            title: String,
            subtitle: {
                type: String,
                default() {
                    return this.$t("delete");
                }
            },
            index: Number,
            confirmed: Function
        },

        data() {
            return {
                showConfirm: false
            };
        },

        methods: {
            confirm() {
                this.showConfirm = true;
            },

            cancel() {
                this.showConfirm = false;
            },

            execute() {
                this.showConfirm = false;
                this.confirmed(this.index);
            }
        }
    };
</script>

<style scoped>
    #confirm-delete .button {
        margin: 0 0 0 10px;
    }
</style>
