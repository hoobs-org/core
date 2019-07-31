<template>
    <div v-if="user.admin" id="search">
        <div class="info">
            <router-link to="/plugins">{{ $t("installed_packages") }}</router-link>
            <router-link to="/plugins/search" class="active">{{ $t("browse_packages") }}</router-link>
        </div>
        <div class="content">
            <div class="search-field">
                <input type="text" v-model="query" :placeholder="$t('search_packages')" onfocus="this.placeholder = ''" :onblur="`this.placeholder = '${$t('search_packages')}'`" />
            </div>
            <div class="list">
                <plugin-list v-for="(plugin, index) in results" :key="index" :plugin="plugin" />
                <div v-if="results.length === 0 && query !== '' && !working" class="empty">{{ $t("no_results") }}</div>
            </div>
        </div>
    </div>
</template>

<script>
    import _ from "lodash";
    import PluginList from "@/components/plugin-list.vue";

    export default {
        name: "search",

        components: {
            "plugin-list": PluginList
        },

        computed: {
            user() {
                return this.$store.state.user;
            }
        },

        data() {
            return {
                working: true,
                results: [],
                query: ""
            };
        },

        mounted() {
            this.query = this.$store.state.query;
            this.results = this.$store.state.results;
        },

        created: function () {
            this.debouncedSearch = _.debounce(this.search, 500)
        },

        watch: {
            query: function () {
                this.search();
            }
        },

        methods: {
            async search() {
                if (this.query.length > 3) {
                    this.working = true;

                    this.results = await this.api.post(`/plugins/${encodeURIComponent(this.query)}/50`);

                    this.working = false;
                    this.initial = false;

                    this.$store.commit("search", this.query);
                    this.$store.commit("last", this.results);
                } else {
                    this.$store.commit("search", "");
                    this.$store.commit("last", []);
                }
            }
        }
    }
</script>

<style scoped>
    #search {
        flex: 1;
        padding: 0;
        display: flex;
        overflow: hidden;
    }

    #search .info {
        width: 210px;
        padding: 20px 0 20px 20px;
    }

    #search .info a,
    #search .info a:link,
    #search .info a:active,
    #search .info a:visited {
        padding: 10px;
        border-bottom: 1px var(--border) solid;
        color: var(--text);
        text-decoration: none;
        display: block;
    }

    #search .info a:hover {
        color: var(--text-dark);
    }

    #search .info .active {
        font-weight: bold;
        color: var(--title-text) !important;
    }

    #search .content {
        flex: 1;
        padding: 0;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

    #search .search-field {
        padding: 20px 20px 10px 20px;
        display: flex;
    }

    #search .search-field input {
        flex: 1;
        padding: 10px;
        font-size: 15px;
        background: var(--input-background);
        color: var(--input-text);
        border: 1px var(--border) solid;
        border-radius: 5px;
    }

    #search .search-field input:placeholder-shown {
        background: var(--background-accent);
    }

    #search .search-field input:focus {
        outline: 0 none;
        background: var(--input-background);
        border: 1px var(--link-text) solid;
    }

    #search .list {
        padding: 10px 20px 0 20px;
        flex: 1;
        overflow: auto;
    }

    #search .empty {
        width: 90%;
        padding: 20px;
        text-align: center;
    }
</style>
