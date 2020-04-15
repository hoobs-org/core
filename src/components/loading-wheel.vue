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
    <svg xmlns="http://www.w3.org/2000/svg" :width="size" :height="size" viewBox="0 0 38 38" :style="`opacity: ${opacity};`">
        <g fill="none">
            <g transform="translate(1 1)" stroke-width="2">
                <circle cx="18" cy="18" r="18" :style="`stroke: var(${background});`" />
                <path d="M36 18c0-9.94-8.06-18-18-18" transform="rotate(138.09 18 18)" :style="`stroke: var(${color});`">
                    <animateTransform attributeName="transform" type="rotate" from="0 18 18" to="360 18 18" dur="1s" repeatCount="indefinite" />
                </path>
            </g>
        </g>
    </svg>
</template>

<script>
    export default {
        name: "loading-wheel",
        props: {
            background: String,
            color: String,
            size: Number
        },

        data() {
            return {
                opacity: 0
            }
        },

        mounted() {
            setTimeout(() => {
                this.opacity = 1;
            }, 250);
        }
    };
</script>
