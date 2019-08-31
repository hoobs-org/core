<template>
    <div id="system">
        <table>
            <tbody v-if="running">
                <tr v-for="(value, name) in info" :key="name">
                    <td>{{ $t(name) }}</td>
                    <td v-if="name === 'hoobs_version'">{{ value }}&nbsp;&nbsp;&nbsp;<router-link to="/system">{{ $t("check_for_updates") }}</router-link></td>
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
                info: null
            }
        },

        computed: {
            running() {
                return this.$store.state.running;
            }
        },

        async mounted() {
            this.info = await this.api.get("/status");
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
        overflow: auto;
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
