<template>
    <div id="search">
        <div class="info">
            <router-link v-on:click="clearSearch()" to="/plugins">{{ $t("installed_packages") }}</router-link>
            <div v-for="(item, index) in categories" :key="`caregory-${index}`" :to="`/plugins/${item}`" v-on:click="changeCategory(item)" :class="(category || categories[0]) === item ? 'active category-link': 'category-link'">{{ categoryName(item) }}</div>
            <router-link v-if="user.admin" v-on:click="clearSearch()" to="/plugins/search" :class="category === 'search' ? 'active': ''">{{ $t("search") }}</router-link>
        </div>
        <div class="content">
            <div v-if="user.admin" class="search-field">
                <input type="text" v-model="query" :placeholder="$t('search_packages')" onfocus="this.placeholder = ''" :onblur="`this.placeholder = '${$t('search_packages')}'`" />
            </div>
            <loading-marquee v-if="searching" class="searching" :height="3" color="--title-text" background="--title-text-dim" />
            <div v-if="query !== ''" class="list">
                <plugin-list v-for="(plugin, index) in results" :key="`plugin-${index}`" :plugin="plugin" :oninstall="oninstall" :onuninstall="onuninstall" :onupdate="onupdate" />
                <div v-if="results.length === 0 && !working" class="empty">{{ $t("no_results") }}</div>
            </div>
            <div v-else class="cards">
                <plugin-card v-for="(plugin, index) in certified" :key="`certified-${index}`" :plugin="plugin" :oninstall="oninstall" :onuninstall="onuninstall" :onupdate="onupdate" />
                <div v-if="certified.length === 0 && !working && !searching" class="empty">{{ $t("no_results") }}</div>
            </div>
        </div>
    </div>
</template>

<script>
    import Decamelize from "decamelize";
    import Inflection from "inflection";

    import { debounce } from "lodash-es";

    import PluginList from "@/components/plugin-list.vue";
    import PluginCard from "@/components/plugin-card.vue";
    import Marquee from "@/components/loading-marquee.vue";

    export default {
        name: "search",

        components: {
            "plugin-list": PluginList,
            "plugin-card": PluginCard,
            "loading-marquee": Marquee
        },

        props: {
            category: String
        },

        computed: {
            user() {
                return this.$store.state.user;
            },

            categories() {
                return this.$store.state.categories;
            }
        },

        data() {
            return {
                working: true,
                searching: false,
                results: [],
                certified: [],
                query: ""
            };
        },

        async mounted() {
            if (!this.categories || this.categories.length === 0) {
                this.$store.commit("category", await this.api.get(`/plugins/certified/categories`));
            }

            this.query = this.$store.state.query;
            this.results = this.$store.state.results;

            this.fetchCertified(this.category || this.categories[0]);
        },

        created: function () {
            this.debouncedSearch = debounce(this.search, 500)
        },

        watch: {
            query: function () {
                this.search();
            },

            category: function () {
                this.fetchCertified(this.category);
            }
        },

        methods: {
            async search() {
                if (this.query.length >= 3) {
                    this.working = true

                    setTimeout(() => {
                        this.searching = this.working;
                    }, 500);

                    this.results = await this.api.post(`/plugins/${encodeURIComponent(this.query)}/50`);

                    this.searching = false;
                    this.working = false;
                    this.initial = false;

                    this.$store.commit("search", this.query);
                    this.$store.commit("last", this.results);
                } else {
                    this.$store.commit("search", "");
                    this.$store.commit("last", []);

                    this.results = [];
                }
            },

            changeCategory(category) {
                this.$store.commit("search", "");
                this.$store.commit("last", []);

                this.results = [];
                this.query = "";

                if (category !== this.category) {
                    this.certified = [];

                    this.$router.push({
                        path: `/plugins/${category}`,
                    });
                }
            },

            categoryName(value) {
                let results = value;

                results = (results || "").replace(/-/gi, "_");
                results = this.$t(results);

                if (results !== value) {
                    return results;
                }

                results = results.replace("category_", "");

                return Inflection.titleize(Decamelize(results.trim()));
            },

            async fetchCertified(category) {
                this.certified = [];

                if (!category || category.length === 0) {
                    return;
                }

                this.working = true

                setTimeout(() => {
                    this.searching = this.working;
                }, 500);

                this.certified = await this.api.get(`/plugins/certified/${category}`);

                this.searching = false;
                this.working = false;
            },

            oninstall(name, plugin, details) {
                this.$router.push({
                    path: `/config/${name}`
                });
            },

            onuninstall() {
                this.$router.push({
                    path: "/plugins"
                });
            },

            onupdate() {
                this.$router.push({
                    path: "/plugins"
                });
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
        width: 230px;
        padding: 20px 0 20px 20px;
        overflow: auto;
    }

    #search .info a,
    #search .info a:link,
    #search .info a:active,
    #search .info a:visited,
    #search .info .category-link {
        padding: 10px;
        border-bottom: 1px var(--border) solid;
        color: var(--text);
        text-decoration: none !important;
        display: block;
        cursor: pointer;
    }

    #search .info a:hover,
    #search .info .category-link:hover {
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

    #search .searching {
        margin: 0 22px;
    }

    #search .list {
        padding: 10px 20px 0 20px;
        flex: 1;
        overflow: auto;
    }

    #search .cards {
        display: flex;
        flex-wrap: wrap;
        padding: 10px 0 0 20px;
        overflow: auto;
    }

    #search .empty {
        width: 90%;
        padding: 20px;
        text-align: center;
    }
</style>
