<template>
    <div v-if="user.admin" id="system">
        <div v-if="info" class="system-content">
            <div v-for="(section, title) in info" :key="title">
                <h2>{{ humanize(title) }}</h2>
                <table>
                    <tbody>
                        <tr v-for="(value, name) in section" :key="name">
                            <td style="min-width: 250px;">{{ humanize(name) }}</td>
                            <td style="width: 100%;">{{ value }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<script>
    import Decamelize from "decamelize";
    import Inflection from "inflection";

    export default {
        name: "system",

        computed: {
            user() {
                return this.$store.state.user;
            }
        },

        data() {
            return {
                info: null
            }
        },

        async mounted() {
            this.info = await this.api.get("/system");
        },

        methods: {
            humanize(string) {
                return Inflection.titleize(Decamelize(string.replace(/-/gi, " ").replace(/homebridge/gi, "").trim()));
            }
        }
    }
</script>

<style scoped>
    #system {
        flex: 1;
        padding: 20px;
        overflow: auto;
    }

    #system .system-content {
        width: 100%;
        max-width: 780px;
    }

    #system h2 {
        margin: 20px 0 5px 0;
        padding: 0;
        line-height: normal;
        font-size: 22px;
        color: var(--title-text);
    }

    #system  h2:first-child {
        margin: 0 0 5px 0;
    }

    #system .system-content table {
        width: 100%;
        border-spacing: 0;
        margin: 0 0 30px 0;
    }

    #system .system-content table tr th {
        padding: 10px;
        text-align: left;
        border-bottom: 2px var(--border-dark) solid;
        color: var(--pin-color);
    }

    #system .system-content table tr td {
        padding: 10px;
        text-align: left;
        border-bottom: 1px var(--border) solid;
    }

    #system .system-content table tr:last-child td {
        border-bottom: 0 none;
    }

    #system .system-content table .empty {
        padding: 30px;
        text-align: center;
    }
</style>
