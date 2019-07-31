<template>
    <div v-if="user.admin" id="plugins">
        <div class="info">
            <router-link to="/plugins" class="active">{{ $t("installed_packages") }}</router-link>
            <router-link to="/plugins/search">{{ $t("browse_packages") }}</router-link>
        </div>
        <div class="content">
            <plugin-list v-for="(plugin, index) in installed" :key="index" :plugin="plugin" />
        </div>
    </div>
</template>

<script>
    import PluginList from "@/components/plugin-list.vue";

    export default {
        name: "plugins",

        components: {
            "plugin-list": PluginList
        },

        computed: {
            installed() {
                return this.$store.state.installed;
            },

            user() {
                return this.$store.state.user;
            }
        },

        async mounted() {
            this.$store.commit("cache", await this.api.get("/plugins"));
        }
    }
</script>

<style scoped>
    #plugins {
        flex: 1;
        padding: 0;
        display: flex;
        overflow: hidden;
    }

    #plugins .info {
        width: 210px;
        padding: 20px 0 20px 20px;
    }

    #plugins .info a,
    #plugins .info a:link,
    #plugins .info a:active,
    #plugins .info a:visited {
        padding: 10px;
        border-bottom: 1px var(--border) solid;
        color: var(--text);
        text-decoration: none;
        display: block;
    }

    #plugins .info a:hover {
        color: var(--text-dark);
    }

    #plugins .info .active {
        font-weight: bold;
        color: var(--title-text) !important;
    }

    #plugins .content {
        flex: 1;
        padding: 20px 20px 0 20px;
        display: flex;
        flex-direction: column;
        overflow: auto;
    }
</style>
