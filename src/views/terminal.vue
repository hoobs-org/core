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
    <div v-if="user.admin" id="terminal">
        <div v-if="info" class="info">
            <router-link to="/system/software">{{ $t("software") }}</router-link>
            <div v-for="(section, title) in info" :key="title">
                <router-link :to="`/system/${title}`">{{ translate(title) }}</router-link>
            </div>
            <router-link v-if="!$server.docker" to="/system/filesystem">{{ translate("file_system") }}</router-link>
            <router-link to="/system/terminal" class="active">{{ $t("terminal") }}</router-link>
        </div>
        <div class="content" ref="console">
            <div ref="terminal" class="shell"></div>
        </div>
    </div>
</template>

<script>
    import Cookies from "../cookies";

    import { Terminal } from "xterm";
    import { AttachAddon } from "xterm-addon-attach";
    import { FitAddon } from "xterm-addon-fit";
    import { WebLinksAddon } from "xterm-addon-web-links";

    export default {
        name: "terminal",

        computed: {
            user() {
                return this.$store.state.user;
            }
        },

        data() {
            return {
                info: null,
                term: null,
                socket: null,
                closing: false,
                opening: true
            }
        },

        async mounted() {
            this.closing = false;
            this.opening = true;

            this.info = await this.api.get("/system");

            this.term = new Terminal({
                cursorBlink: false,
                theme: {
                    background: this.$theme.terminal.background,
                    foreground: this.$theme.terminal.foreground
                }
            });

            this.screen = new FitAddon();

            this.term.loadAddon(this.screen);
            this.term.loadAddon(new WebLinksAddon());
            this.term.open(this.$refs.terminal);

            this.screen.fit();

            this.connect();
        },

        destroyed() {
            this.term = null;
            this.closing = true;

            if (this.socket) {
                this.socket.send("{EXIT}");
                this.socket.close();
                this.socket = null;
            }
        },

        methods: {
            connect() {
                let url = this.$instance;

                if (url === "") {
                    const uri = window.location.href.split("/");

                    url = `${uri[0]}//${uri[2]}`;
                }

                url = url.replace("http://", "ws://");
                url = url.replace("https://", "wss://");

                this.socket = new WebSocket(`${url}${url.endsWith("/") ? "shell" : "/shell"}?a=${Cookies.get("token") || ""}&t=${new Date().getTime()}`);

                this.socket.onopen = () => {
                    this.term.loadAddon(new AttachAddon(this.socket));

                    if (this.opening) {
                        this.term.clear();
                        this.term.focus();

                        this.socket.send("{CLEAR}");

                        this.opening = false;
                    }
                };

                this.socket.onclose = () => {
                    if (!this.closing) {
                        this.connect();
                    }
                };

                this.socket.onerror = () => {
                    this.socket.close();
                };
            },

            translate(value) {
                let results = value;

                results = (results || "").replace(/-/gi, "_");
                results = this.$t(results);

                if (results !== value) {
                    return results;
                }

                return this.$humanize(results);
            },

            size() {
                const text = this.char();

                return {
                    rows: Math.floor(this.$refs.console.clientHeight / text.height) - 1,
                    cols: Math.floor(this.$refs.console.clientWidth / text.width) - 3
                };
            },

            char() {
                const span = document.createElement("SPAN");

                span.innerText = "qwertyuiopasdfghjklzxcvbnm";

                this.$refs.console.appendChild(span);

                const results = {
                    width: span.offsetWidth / 26,
                    height: span.offsetHeight
                };

                span.remove();

                return results;
            }
        }
    }
</script>

<style>
    .shell {
        width: 100%;
        height: 100%;
    }

    .xterm {
        font-feature-settings: "liga" 0;
        position: relative;
        user-select: none;
        -ms-user-select: none;
        -webkit-user-select: none;
    }

    .xterm.focus,
    .xterm:focus {
        outline: none;
    }

    .xterm .xterm-helpers {
        position: absolute;
        top: 0;
        z-index: 10;
    }

    .xterm .xterm-helper-textarea {
        position: absolute;
        opacity: 0;
        left: -9999em;
        top: 0;
        width: 0;
        height: 0;
        z-index: -10;
        white-space: nowrap;
        overflow: hidden;
        resize: none;
    }

    .xterm .composition-view {
        background: var(--background-dark) !important;
        color: #fff;
        display: none;
        position: absolute;
        white-space: nowrap;
        z-index: 1;
    }

    .xterm .composition-view.active {
        display: block;
    }

    .xterm .xterm-viewport {
        background-color: var(--background-dark) !important;
        overflow-y: scroll;
        cursor: default;
        position: absolute;
        right: 0;
        left: 0;
        top: 0;
        bottom: 0;
    }

    .xterm .xterm-screen {
        position: relative;
    }

    .xterm .xterm-screen canvas {
        position: absolute;
        left: 0;
        top: 0;
    }

    .xterm .xterm-scroll-area {
        visibility: hidden;
    }

    .xterm-char-measure-element {
        display: inline-block;
        visibility: hidden;
        position: absolute;
        top: 0;
        left: -9999em;
        line-height: normal;
    }

    .xterm {
        cursor: text;
    }

    .xterm.enable-mouse-events {
        cursor: default;
    }

    .xterm.xterm-cursor-pointer {
        cursor: pointer;
    }

    .xterm.column-select.focus {
        cursor: crosshair;
    }

    .xterm .xterm-accessibility,
    .xterm .xterm-message {
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        right: 0;
        z-index: 100;
        color: transparent;
    }

    .xterm .live-region {
        position: absolute;
        left: -9999px;
        width: 1px;
        height: 1px;
        overflow: hidden;
    }

    .xterm-dim {
        opacity: 0.5;
    }

    .xterm-underline {
        text-decoration: underline;
    }
</style>

<style scoped>
    #terminal {
        flex: 1;
        padding: 0;
        display: flex;
        overflow: hidden;
    }

    #terminal .info {
        width: 230px;
        padding: 20px;
        background: var(--background-dark);
        overflow: auto;
    }

    #terminal .info a,
    #terminal .info a:link,
    #terminal .info a:active,
    #terminal .info a:visited {
        padding: 10px;
        border-bottom: 1px var(--background-dark-border) solid;
        color: var(--background-dark-text);
        text-decoration: none;
        display: block;
    }

    #terminal .info a:hover {
        color: var(--background-dark-text-dark);
    }

    #terminal .info .active {
        font-weight: bold;
        color: var(--title-text) !important;
    }

    #terminal .content {
        flex: 1;
        width: 100%;
        height: 100%;
        padding: 10px;
        background: var(--background-dark);
        box-sizing: border-box;
    }
</style>
