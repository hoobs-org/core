<template>
    <router-link id="plugin" :to="`/plugin/${encodeURIComponent(plugin.scope ? `@${plugin.scope}/${plugin.name}` : plugin.name)}`">
        <div>
            <h3>{{ humanize(plugin.name) }}</h3>
            <p>{{ plugin.description }}</p>
            <img style="width: 100%;" :src="plugin.image" />
        </div>
    </router-link>
</template>

<script>
    import Decamelize from "decamelize";
    import Inflection from "inflection";

    import Versioning from "../versioning";

    export default {
        name: "plugin-card",

        props: {
            plugin: Object,
            oninstall: Function,
            onuninstall: Function,
            onupdate: Function
        },

        computed: {
            locked() {
                return this.$store.state.locked;
            },

            running() {
                return this.$store.state.running;
            }
        },

        data() {
            return {
                working: false,
                formatted: "",
                server: this.plugin.keywords.indexOf("homebridge-plugin") >= 0,
                interface: this.plugin.keywords.indexOf("homebridge-x-plugin") >= 0
            }
        },

        methods: {
            checkVersion(version, latest) {
                return Versioning.checkVersion(version, latest);
            },

            humanize(string) {
                return Inflection.titleize(Decamelize(string.replace(/-/gi, " ").replace("homebridge-", "").trim()));
            },

            async install() {
                if (!this.locked) {
                    this.working = true;

                    const restart = this.running;

                    if (this.server && restart) {
                        this.$store.commit("lock");

                        await this.api.post("/service/stop");
                    }

                    const results = await this.api.put(`/plugins/${encodeURIComponent(this.plugin.scope ? `@${this.plugin.scope}/${this.plugin.name}` : this.plugin.name)}`);

                    if (this.server && restart) {
                        await this.api.post("/service/start");

                        this.$store.commit("unlock");
                    }

                    await this.api.post("/service/reload");

                    if (results.success && this.oninstall) {
                        this.oninstall(results.plugin.name, results.plugin, results.details);
                    }
                }
            },

            async uninstall() {
                if (!this.locked) {
                    this.working = true;

                    const restart = this.running;

                    if (this.server && restart) {
                        this.$store.commit("lock");

                        await this.api.post("/service/stop");
                    }

                    await this.api.delete(`/plugins/${encodeURIComponent(this.plugin.scope ? `@${this.plugin.scope}/${this.plugin.name}` : this.plugin.name)}`);

                    if (this.server && restart) {
                        await this.api.post("/service/start");

                        this.$store.commit("unlock");
                    }

                    await this.api.post("/service/reload");

                    if (this.onuninstall) {
                        this.onuninstall();
                    }
                }
            },

            async update() {
                if (!this.locked) {
                    this.working = true;

                    const restart = this.running;

                    if (this.server && restart) {
                        this.$store.commit("lock");

                        await this.api.post("/service/stop");
                    }

                    await this.api.post(`/plugins/${encodeURIComponent(this.plugin.scope ? `@${this.plugin.scope}/${this.plugin.name}` : this.plugin.name)}`);

                    if (this.server && restart) {
                        await this.api.post("/service/start");

                        this.$store.commit("unlock");
                    }

                    await this.api.post("/service/reload");

                    if (this.onupdate) {
                        this.onupdate();
                    }
                }
            }
        }
    };
</script>

<style scoped>
    #plugin {
        width: 192px;
        height: 300px;
        padding: 20px 20px 0 20px;
        margin: 0 20px 20px 0;
        background: var(--background-light);
        box-shadow: var(--elevation-small);
        border-radius: 3px;
        display: block;
        color: var(--text) !important;
        text-decoration: none !important;
        cursor: pointer;
    }

    #plugin h3 {
        font-size: 20px;
        line-height: normal;
        color: var(--title-text);
        padding: 0;
        margin: 0;
    }

    #plugin .actions {
        padding: 20px 0 0 0;
    }

    #plugin .actions .button {
        margin: 0 10px 20px 0;
    }

    #plugin p {
        width: 100%;
        height: 28px;
        margin: 5px 0 20px 0;
        text-overflow: ellipsis;
        overflow: hidden;
        font-size: 12px;
    }

    #plugin img {
        opacity: 0.75;
    }

    #plugin:hover img {
        opacity: 1;
    }
</style>
