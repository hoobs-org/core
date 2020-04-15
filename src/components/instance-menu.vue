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
    <div id="instance-menu">
        <div v-for="(instance, index) in instances" :key="index" v-on:click.stop="changeInstance(index)" class="item">{{ instance }}</div>
        <div class="button mobile-show menu-cancel">{{ $t("cancel") }}</div>
    </div>
</template>

<script>
    export default {
        name: "instance-menu",

        data() {
            return {
                instances: []
            }
        },

        async mounted() {
            this.instances = await this.$instances();
        },

        methods: {
            async changeInstance(index) {
                await this.$active(index);
            }
        }
    };
</script>

<style scoped>
    #instance-menu {
        position: absolute;
        top: 45px;
        right: 50px;
        min-width: 180px;
        background: var(--background);
        box-shadow: var(--elevation-large);
        z-index: 300;
    }

    #instance-menu .item {
        padding: 10px 20px;
        color: var(--text);
        display: block;
        text-decoration: none;
        cursor: pointer;
        user-select: none;
    }

    #instance-menu .item:hover {
        background: var(--background-highlight);
        text-decoration: none;
        color: var(--text-dark);
    }

    @media (min-width: 300px) and (max-width: 815px) {
        #instance-menu {
            position: absolute;
            top: 0;
            right: 0;
            background: var(--background);
            box-shadow: unset;
            width: 100%;
            height: 100%;
            z-index: 300;
        }

        .menu-cancel {
            position: absolute;
            bottom: 10px;
            right: 0;
        }
    }
</style>
