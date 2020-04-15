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
    <div id="system">
        <table>
            <tbody v-if="running">
                <tr v-for="(value, name) in info" :key="name">
                    <td>{{ $t(name) }}</td>
                    <td v-if="!$server.docker && name === 'hoobs_version' && updates.length > 0">{{ value }}<router-link class="data-addon-link" to="/system/software">{{ updates[0].version }} {{ $t("update_available") }}</router-link></td>
                    <td v-else>{{ value }}</td>
                </tr>
            </tbody>
            <tbody v-else>
                <tr>
                    <td colspan="2" class="empty">{{ $t("service_stoped_message") }}</td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<script>
    export default {
        name: "system-info",

        props: {
            item: Object,
            index: Number,
            change: Function
        },

        data() {
            return {
                info: null,
                updates: []
            }
        },

        computed: {
            running() {
                return this.$store.state.running;
            }
        },

        async mounted() {
            this.info = await this.api.get("/status");
            this.updates = await this.api.get("/system/updates");
        }
    };
</script>

<style scoped>
    #system {
        width: 100%;
        height: 100%;
        flex: 1;
        padding: 10px 20px;
        box-sizing: border-box;
        cursor: default;
        overflow: auto;
    }

    #system .data-addon-link {
        margin-left: 7px;
    }

    #system table {
        width: 100%;
        border-spacing: 0;
    }

    #system table tr td {
        height: 26px;
        min-height: 26px;
        padding: 10px;
        text-align: left;
        font-size: 13px;
        border-bottom: 1px var(--border) solid;
    }

    #system table tr td:last-child {
        word-break: break-all;
    }

    #system table tr:last-child td {
        border-bottom: 0 none;
    }

    #system table .empty {
        padding: 30px;
        text-align: center;
    }
</style>
