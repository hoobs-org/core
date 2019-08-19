<template>
    <div v-if="user.admin" id="plugins">
        <div class="info">
            <div v-for="(item, index) in categories" :key="`caregory-${index}`" :to="`/plugins/${item}`" v-on:click="changeCategory(item)" class="category-link">{{ categoryName(item) }}</div>
            <router-link to="/plugins/installed" class="active">{{ $t("installed_packages") }}</router-link>
        </div>
        <div class="content">
            <plugin-list v-for="(plugin, index) in installed" :key="`plugin-${index}`" :plugin="plugin" />
        </div>
    </div>
</template>

<script>
    import Decamelize from "decamelize";
    import Inflection from "inflection";

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
            },

            categories() {
                return this.$store.state.categories;
            }
        },

        async mounted() {
            if (!this.categories || this.categories.length === 0) {
                this.$store.commit("category", await this.api.get(`/plugins/certified/categories`));
            }

            this.$store.commit("cache", await this.api.get("/plugins"));
        },

        methods: {
            categoryName(value) {
                value = (value || "").replace(/-/gi, "_");
                value = this.$t(value);
                value = value.replace("category_", "");

                return Inflection.titleize(Decamelize(value.trim()));
            },

            changeCategory(category) {
                this.$store.commit("search", "");
                this.$store.commit("last", []);

                this.results = [];

                this.$router.push({
                    path: `/plugins/${category}`,
                });
            }
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
    #plugins .info a:visited,
    #plugins .info .category-link {
        padding: 10px;
        border-bottom: 1px var(--border) solid;
        color: var(--text);
        text-decoration: none !important;
        display: block;
        cursor: pointer;
    }

    #plugins .info a:hover,
    #plugins .info .category-link:hover {
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
