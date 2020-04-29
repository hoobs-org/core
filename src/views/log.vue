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
    <div id="logs">
        <span class="message" v-for="(message, index) in messages" :key="index"><span class="dim">{{ new Date(message.time).toLocaleString() }}</span> {{ message.message }}</span>
    </div>
</template>

<script>
    export default {
        name: "logs",

        computed: {
            messages() {
                return this.$store.state.messages;
            },

            user() {
                return this.$store.state.user;
            }
        },

        mounted() {
            this.$el.scrollTo(0, this.$el.scrollHeight);
        },

        updated() {
            this.$el.scrollTo(0, this.$el.scrollHeight);
        }
    }
</script>

<style scoped>
    #logs {
        flex: 1;
        padding: 20px;
        background: var(--background-dark);
        overflow: auto;
    }

    #logs .message {
        display: block;
        unicode-bidi: embed;
        font-family: monospace;
        white-space: pre-wrap;
        color: var(--log-text);
    }

    #logs .dim {
        opacity: 0.5;
    }

    @media (min-width: 300px) and (max-width: 815px) {
        #logs .message {
            font-size: 10px;
        }
    }
</style>
