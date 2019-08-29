<template>
    <div v-if="user.admin" id="terminal">
        <div class="info">
            <router-link to="/system#software">{{ $t("software") }}</router-link>
            <div v-for="(section, title) in info" :key="title">
                <router-link :to="`/system#h-${title}`">{{ translate(title) }}</router-link>
            </div>
            <router-link to="/system/terminal" class="active">{{ $t("terminal") }}</router-link>
        </div>
        <div class="content" ref="console"></div>
    </div>
</template>

<script>
    import Decamelize from "decamelize";
    import Inflection from "inflection";

    import Client from "socket.io-client";
    import Terminal from "term.js-cockpit/src/term";

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
                socket: null,
                term: null
            }
        },

        async mounted() {
            this.info = await this.api.get("/system");
            this.socket = Client(this.$instance);

            const dimensions = this.size();

            this.socket.on("connect", () => {
                this.term = new Terminal({
                    cols: dimensions.cols,
                    rows: dimensions.rows,
                    useStyle: true,
                    screenKeys: true,
                    cursorBlink: true
                });

                this.term.on("data", (data) => {
                    this.socket.emit("data", data);
                });

                this.socket.on("data", (data) => {
                    this.term.write(data);
                });

                this.term.open(this.$refs.console);

                this.socket.on("disconnect", () => {
                    this.term.destroy();
                });

                this.socket.emit("data", "\n");
                this.socket.emit("data", "clear\n");
            });
        },

        destroyed() {
            this.term = null;
            this.socket = null;
        },

        methods: {
            translate(value) {
                let results = value;

                results = (results || "").replace(/-/gi, "_");
                results = this.$t(results);

                if (results !== value) {
                    return results;
                }

                return Inflection.titleize(Decamelize(results.replace(/-/gi, " ").replace(/homebridge/gi, "").trim()));
            },

            size() {
                const text = this.char();

                return {
                    rows: Math.floor(this.$refs.console.clientHeight / text.height),
                    cols: Math.floor(this.$refs.console.clientWidth / text.width) - 2
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
    .terminal {
        height: 100%;
        width: 100%;
        font-family: monospace;
        font-size: 14px;
        color: var(--log-text);
        background: var(--background-dark) !important;
        padding: 3px;
        border: none !important;
        box-sizing: border-box;
    }

    .terminal div {
        display: flex;
        flex-wrap: nowrap;
        white-space: nowrap;
    }

    .terminal-cursor {
        background: var(--log-text);
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
        width: 210px;
        padding: 20px;
    }

    #terminal .info a,
    #terminal .info a:link,
    #terminal .info a:active,
    #terminal .info a:visited {
        padding: 10px;
        border-bottom: 1px var(--border) solid;
        color: var(--text);
        text-decoration: none;
        display: block;
    }

    #terminal .info a:hover {
        color: var(--text-dark);
    }

    #terminal .info .active {
        font-weight: bold;
        color: var(--title-text) !important;
    }

    #terminal .content {
        flex: 1;
        display: block !important;
        height: 100%;
        width: 100%;
        padding: 3px 10px 3px 10px;
        font-size: 14px;
        font-family: "DejaVu Sans Mono", "Liberation Mono", monospace;
        background: var(--background-dark);
        border: none !important;
        box-sizing: border-box;
    }
</style>
