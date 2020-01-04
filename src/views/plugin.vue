<template>
    <div id="plugin">
        <div class="info">
            <router-link to="/plugins">{{ $t("installed_packages") }}</router-link>
            <div v-for="(item, index) in categories" :key="`caregory-${index}`" :to="`/plugins/${item}`" v-on:click="changeCategory(item)" class="category-link">{{ categoryName(item) }}</div>
            <router-link v-on:click="clearSearch()" to="/plugins/search">{{ $t("search") }}</router-link>
        </div>
        <div class="content">
            <div class="details" v-if="plugin.version">
                <div v-if="plugin.installed" class="control">
                    <span v-if="!plugin.local">
                        <span v-if="checkVersion(plugin.installed, plugin.version)" class="status">{{ $t("update_available") }}</span>
                        <span v-else class="status">{{ $t("updated") }}</span>
                    </span>
                    <div v-if="plugin.scope === 'hoobs'" class="certified">
                        HOOBS Certified
                    </div>
                    <div class="version">
                        {{ plugin.installed || plugin.version }}
                        <span v-if="!plugin.local">{{ $t("published") }} {{ formatDate(plugin.date.replace(/\s/, "T")) }} {{ getAgeDisplay(plugin.date.replace(/\s/, "T")) }}</span>
                    </div>
                    <div v-if="!working" class="actions">
                        <span v-on:click="$router.go(-1)" class="icon">chevron_left</span>
                        <div v-if="checkVersion(plugin.installed, plugin.version)" v-on:click.stop="update()" class="button button-primary">{{ $t("update") }}</div>
                        <confirm-delete v-if="plugin.name !== 'homebridge'" class="uninstall" :title="$t('uninstall')" :subtitle="$t('uninstall')" :confirmed="uninstall" />
                        <a :href="`https://www.npmjs.com/package/${plugin.scope ? `@${plugin.scope}/${plugin.name}` : plugin.name}`" target="_blank">NPM</a>
                        <span v-if="plugin.homepage" class="link-seperator">|</span>
                        <a v-if="plugin.homepage" :href="plugin.homepage" target="_blank">{{ $t("details") }}</a>
                    </div>
                    <div v-else class="loader">
                        <loading-marquee :height="3" color="--title-text" background="--title-text-dim" />
                    </div>
                </div>
                <div v-else class="control">
                    <div v-if="plugin.scope === 'hoobs'" class="certified">
                        HOOBS Certified
                    </div>
                    <div class="version">
                        {{ plugin.installed || plugin.version }}
                        <span v-if="!plugin.local">{{ $t("published") }} {{ formatDate(plugin.date.replace(/\s/, "T")) }} {{ getAgeDisplay(plugin.date.replace(/\s/, "T")) }}</span>
                    </div>
                    <div v-if="!working" class="actions">
                        <span v-on:click="$router.go(-1)" class="icon">chevron_left</span>
                        <div v-on:click.stop="install()" class="button button-primary">{{ $t("install") }}</div>
                        <a :href="`https://www.npmjs.com/package/${plugin.scope ? `@${plugin.scope}/${plugin.name}` : plugin.name}`" target="_blank">NPM</a>
                        <span v-if="plugin.homepage" class="link-seperator">|</span>
                        <a v-if="plugin.homepage" :href="plugin.homepage" target="_blank">{{ $t("details") }}</a>
                    </div>
                    <div v-else class="loader">
                        <loading-marquee :height="3" color="--title-text" background="--title-text-dim" />
                    </div>
                </div>
                <div v-if="formatted !== ''" v-html="formatted" ref="markdown" id="markdown"></div>
            </div>
        </div>
    </div>
</template>

<script>
    import Showdown from "showdown";
    import Prism from "prismjs";
    import Decamelize from "decamelize";
    import Inflection from "inflection";

    import Versioning from "../versioning";
    import Dates from "../dates";

    import Marquee from "@/components/loading-marquee.vue";
    import ConfirmDelete from "@/components/confirm-delete.vue";

    export default {
        name: "plugin",

        components: {
            "loading-marquee": Marquee,
            "confirm-delete": ConfirmDelete
        },

        computed: {
            locked() {
                return this.$store.state.locked;
            },

            running() {
                return this.$store.state.running;
            },

            user() {
                return this.$store.state.user;
            },

            categories() {
                return this.$store.state.categories;
            }
        },

        data() {
            return {
                working: false,
                markdown: "",
                formatted: "",
                plugin: {}
            }
        },

        async mounted() {
            if (!this.categories || this.categories.length === 0) {
                this.$store.commit("category", await this.api.get(`/plugins/certified/categories`));
            }

            this.api.get(`/plugins/${encodeURIComponent(this.$route.params.name)}`, true).then((response) => {
                this.plugin = response;

                if (response.readme && response.readme !== "") {
                    this.markdown = response.readme;
                } else {
                    this.markdown = `# ${this.$route.params.name}\n${this.$t("no_readme")}`;
                }
            }).catch(() => {
                this.markdown = `# ${this.$route.params.name}\n${this.$t("package_not_found")}`;
            }).finally(() => {
                this.formatted = new Showdown.Converter({
                    tables: true
                }).makeHtml(this.markdown);

                setTimeout(() => {
                    Prism.highlightAllUnder(this.$refs.markdown);

                    if (this.$refs.markdown) {
                        const links = this.$refs.markdown.querySelectorAll("a");

                        if (links) {
                            for (let i = 0; i < links.length; i++) {
                                const href = links[i].getAttribute("href");

                                if (href && !href.startsWith("#") && !href.startsWith("javascript:")) {
                                    links[i].setAttribute("target", "_blank");
                                }
                            }
                        }
                    }
                }, 100);
            });
        },

        methods: {
            formatDate(date) {
                return Dates.formatDate(date);
            },

            getAgeDisplay(date) {
                const age = Dates.getAgeDisplay(date);

                if (age !== "") {
                    return `• ${age}`;
                }

                return "";
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

            checkVersion(version, latest) {
                return Versioning.checkVersion(version, latest);
            },

            changeCategory(category) {
                this.$store.commit("search", "");
                this.$store.commit("last", []);

                this.results = [];

                this.$router.push({
                    path: `/plugins/${category}`,
                });
            },

            async install() {
                if (!this.locked) {
                    this.working = true;

                    const restart = this.running;

                    if (restart) {
                        this.$store.commit("lock");

                        await this.api.post("/service/stop");
                    }

                    const results = await this.api.put(`/plugins/${encodeURIComponent(`${this.plugin.scope ? `@${this.plugin.scope}/${this.plugin.name}` : this.plugin.name}@${this.plugin.version}`)}`);

                    if (restart) {
                        await this.api.post("/service/start");

                        this.$store.commit("unlock");
                    }

                    this.working = false;

                    if (results.success) {
                        this.$router.push({
                            path: `/config/${results.plugin.name}`
                        });
                    } else {
                        this.$router.push({
                            path: "/plugins"
                        });
                    }
                }
            },
            
            async uninstall() {
                if (!this.locked) {
                    this.working = true;

                    const restart = this.running;

                    if (restart) {
                        this.$store.commit("lock");

                        await this.api.post("/service/stop");
                    }

                    await this.api.delete(`/plugins/${encodeURIComponent(`${this.plugin.scope ? `@${this.plugin.scope}/${this.plugin.name}` : this.plugin.name}`)}`);

                    if (restart) {
                        await this.api.post("/service/start");

                        this.$store.commit("unlock");
                    }

                    this.working = false;

                    this.$router.push({
                        path: "/plugins"
                    });
                }
            },

            async update() {
                if (!this.locked) {
                    this.working = true;

                    const restart = this.running;

                    if (restart) {
                        this.$store.commit("lock");

                        await this.api.post("/service/stop");
                    }

                    await this.api.post(`/plugins/${encodeURIComponent(`${this.plugin.scope ? `@${this.plugin.scope}/${this.plugin.name}` : this.plugin.name}@${this.plugin.version}`)}`);

                    if (restart) {
                        await this.api.post("/service/start");

                        this.$store.commit("unlock");
                    }

                    this.working = false;

                    this.$router.push({
                        path: "/plugins"
                    });
                }
            }
        }
    }
</script>

<style scoped>
    #plugin {
        flex: 1;
        padding: 0;
        display: flex;
        overflow: hidden;
    }

    #plugin .loader {
        width: 100%;
        max-width: 390px;
        display: inline-block;
        padding: 15px 0 0 0;
    }

    #plugin .control {
        padding: 20px;
        margin: 0 0 20px 0;
        background: var(--background-light);
        box-shadow: var(--elevation-small);
        border-radius: 3px;
        display: block;
        color: var(--text) !important;
        text-decoration: none;
    }

    #plugin .info {
        width: 230px;
        padding: 20px 0 20px 20px;
        overflow: auto;
    }

    #plugin .actions {
        display: flex;
        align-content: center;
        align-items: center;
    }

    #plugin .link-seperator {
        margin: 0 7px;
    }

    #plugin .actions .icon {
        font-size: 32px;
        margin: 0 10px 0 0;
        cursor: pointer;
    }

    #plugin .actions .icon:hover {
        color: var(--text-dark);
    }

    #plugin .uninstall {
        display: inline;
        margin: 0 10px 0 -10px;
    }

    #plugin .info a,
    #plugin .info a:link,
    #plugin .info a:active,
    #plugin .info a:visited,
    #plugin .info .category-link {
        padding: 10px;
        border-bottom: 1px var(--border) solid;
        color: var(--text);
        text-decoration: none !important;
        display: block;
        cursor: pointer;
    }

    #plugin .info a:hover,
    #plugin .info .category-link:hover {
        color: var(--text-dark);
    }

    #plugin .content {
        flex: 1;
        padding: 20px 20px 0 20px;
        display: flex;
        flex-direction: column;
        overflow: auto;
    }

    #plugin .content .details {
        width: 100%;
        max-width: 780px;
    }

    #plugin .version {
        color: var(--text-dim);
        font-size: 14px;
        padding: 0 0 10px 0;
    }

    #plugin .certified {
        font-size: 12px;
        color: var(--title-text);
    }
</style>

<style>
    #markdown {
        padding: 5px 0 20px 0;
        font-size: 14px;
    }

    #markdown .pl-c {
        color: #6a737d;
    }

    #markdown .pl-c1,
    #markdown .pl-s .pl-v {
        color: #005cc5;
    }

    #markdown .pl-e,
    #markdown .pl-en {
        color: #6f42c1;
    }

    #markdown .pl-smi,
    #markdown .pl-s .pl-s1 {
        color: #24292e;
    }

    #markdown .pl-ent {
        color: #22863a;
    }

    #markdown .pl-k {
        color: #d73a49;
    }

    #markdown .pl-s,
    #markdown .pl-pds,
    #markdown .pl-s .pl-pse .pl-s1,
    #markdown .pl-sr,
    #markdown .pl-sr .pl-cce,
    #markdown .pl-sr .pl-sre,
    #markdown .pl-sr .pl-sra {
        color: #032f62;
    }

    #markdown .pl-v,
    #markdown .pl-smw {
        color: #e36209;
    }

    #markdown .pl-bu {
        color: #b31d28;
    }

    #markdown .pl-ii {
        color: #fafbfc;
        background-color: #b31d28;
    }

    #markdown .pl-c2 {
        color: #fafbfc;
        background-color: #d73a49;
    }

    #markdown .pl-c2::before {
        content: "^M";
    }

    #markdown .pl-sr .pl-cce {
        font-weight: bold;
        color: #22863a;
    }

    #markdown .pl-ml {
        color: #735c0f;
    }

    #markdown .pl-mh,
    #markdown .pl-mh .pl-en,
    #markdown .pl-ms {
        font-weight: bold;
        color: #005cc5;
    }

    #markdown .pl-mi {
        font-style: italic;
        color: #24292e;
    }

    #markdown .pl-mb {
        font-weight: bold;
        color: #24292e;
    }

    #markdown .pl-md {
        color: #b31d28;
        background-color: #ffeef0;
    }

    #markdown .pl-mi1 {
        color: #22863a;
        background-color: #f0fff4;
    }

    #markdown .pl-mc {
        color: #e36209;
        background-color: #ffebda;
    }

    #markdown .pl-mi2 {
        color: #f6f8fa;
        background-color: #005cc5;
    }

    #markdown .pl-mdr {
        font-weight: bold;
        color: #6f42c1;
    }

    #markdown .pl-ba {
        color: #586069;
    }

    #markdown .pl-sg {
        color: #959da5;
    }

    #markdown .pl-corl {
        text-decoration: underline;
        color: #032f62;
    }

    #markdown .octicon {
        display: inline-block;
        vertical-align: text-top;
        fill: currentColor;
    }

    #markdown a {
        background-color: transparent;
    }

    #markdown a:active,
    #markdown a:hover {
        outline-width: 0;
    }

    #markdown strong {
        font-weight: inherit;
    }

    #markdown strong {
        font-weight: bolder;
    }

    #markdown h1 {
        margin: 0.67em 0;
    }

    #markdown img {
        border-style: none;
    }

    #markdown code,
    #markdown kbd,
    #markdown pre {
        font-family: monospace, monospace;
        font-size: 1em;
    }

    #markdown hr {
        box-sizing: content-box;
        height: 0;
        overflow: visible;
    }

    #markdown input {
        font: inherit;
        margin: 0;
    }

    #markdown input {
        overflow: visible;
    }

    #markdown [type="checkbox"] {
        box-sizing: border-box;
        padding: 0;
    }

    #markdown * {
        box-sizing: border-box;
    }

    #markdown input {
        font-family: inherit;
        font-size: inherit;
        line-height: inherit;
    }

    #markdown a {
        color: #0366d6;
        text-decoration: none;
    }

    #markdown a:hover {
        text-decoration: underline;
    }

    #markdown strong {
        font-weight: 600;
    }

    #markdown hr {
        height: 0;
        margin: 15px 0;
        overflow: hidden;
        background: transparent;
        border: 0;
        border-bottom: 1px solid var(--border);
    }

    #markdown hr::before {
        display: table;
        content: "";
    }

    #markdown hr::after {
        display: table;
        clear: both;
        content: "";
    }

    #markdown table {
        border-spacing: 0;
        border-collapse: collapse;
    }

    #markdown table th {
        padding: 10px;
        text-align: left;
        border-bottom: 1px var(--border-dark) solid;
        color: var(--pin-color);
    }

    #markdown table td {
        padding: 10px;
        background-color: var(--background);
        border-bottom: 1px var(--border) solid;
    }

    #markdown h1,
    #markdown h2,
    #markdown h3,
    #markdown h4,
    #markdown h5,
    #markdown h6 {
        margin-top: 0;
        margin-bottom: 0;
    }

    #markdown h1 {
        font-size: 24px;
        color: var(--title-text);
        font-weight: 600;
    }

    #markdown h2 {
        font-size: 20px;
        font-weight: 600;
    }

    #markdown h3 {
        font-size: 18px;
        font-weight: 600;
    }

    #markdown h4,
    #markdown h5,
    #markdown h6 {
        font-size: 14px;
        font-weight: 600;
    }

    #markdown p {
        margin-top: 0;
        margin-bottom: 10px;
    }

    #markdown blockquote {
        margin: 0;
    }

    #markdown ul,
    #markdown ol {
        padding-left: 0;
        margin-top: 0;
        margin-bottom: 0;
    }

    #markdown ol ol,
    #markdown ul ol {
        list-style-type: lower-roman;
    }

    #markdown ul ul ol,
    #markdown ul ol ol,
    #markdown ol ul ol,
    #markdown ol ol ol {
        list-style-type: lower-alpha;
    }

    #markdown dd {
        margin-left: 0;
    }

    #markdown code {
        font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier,
            monospace;
        font-size: 12px;
    }

    #markdown pre {
        margin-top: 0;
        margin-bottom: 0;
        font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier,
            monospace;
        font-size: 12px;
    }

    #markdown .octicon {
        vertical-align: text-bottom;
    }

    #markdown .pl-0 {
        padding-left: 0 !important;
    }

    #markdown .pl-1 {
        padding-left: 4px !important;
    }

    #markdown .pl-2 {
        padding-left: 8px !important;
    }

    #markdown .pl-3 {
        padding-left: 16px !important;
    }

    #markdown .pl-4 {
        padding-left: 24px !important;
    }

    #markdown .pl-5 {
        padding-left: 32px !important;
    }

    #markdown .pl-6 {
        padding-left: 40px !important;
    }

    #markdown::before {
        display: table;
        content: "";
    }

    #markdown::after {
        display: table;
        clear: both;
        content: "";
    }

    #markdown > *:first-child {
        margin-top: 0 !important;
    }

    #markdown > *:last-child {
        margin-bottom: 0 !important;
    }

    #markdown a:not([href]) {
        color: inherit;
        text-decoration: none;
    }

    #markdown .anchor {
        float: left;
        padding-right: 4px;
        margin-left: -20px;
        line-height: 1;
    }

    #markdown .anchor:focus {
        outline: none;
    }

    #markdown p,
    #markdown blockquote,
    #markdown ul,
    #markdown ol,
    #markdown dl,
    #markdown table,
    #markdown pre {
        margin-top: 0;
        margin-bottom: 16px;
    }

    #markdown hr {
        height: 0.25em;
        padding: 0;
        margin: 24px 0;
        background-color: #e1e4e8;
        border: 0;
    }

    #markdown blockquote {
        padding: 0 1em;
        color: #6a737d;
        border-left: 0.25em solid #dfe2e5;
    }

    #markdown blockquote > :first-child {
        margin-top: 0;
    }

    #markdown blockquote > :last-child {
        margin-bottom: 0;
    }

    #markdown kbd {
        display: inline-block;
        padding: 3px 5px;
        font-size: 11px;
        line-height: 10px;
        color: #444d56;
        vertical-align: middle;
        background-color: #fafbfc;
        border: solid 1px #c6cbd1;
        border-bottom-color: #959da5;
        border-radius: 3px;
        box-shadow: inset 0 -1px 0 #959da5;
    }

    #markdown h1,
    #markdown h2,
    #markdown h3,
    #markdown h4,
    #markdown h5,
    #markdown h6 {
        margin-top: 24px;
        margin-bottom: 16px;
        font-weight: 600;
        line-height: 1.25;
    }

    #markdown h1 .octicon-link,
    #markdown h2 .octicon-link,
    #markdown h3 .octicon-link,
    #markdown h4 .octicon-link,
    #markdown h5 .octicon-link,
    #markdown h6 .octicon-link {
        color: #1b1f23;
        vertical-align: middle;
        visibility: hidden;
    }

    #markdown h1:hover .anchor,
    #markdown h2:hover .anchor,
    #markdown h3:hover .anchor,
    #markdown h4:hover .anchor,
    #markdown h5:hover .anchor,
    #markdown h6:hover .anchor {
        text-decoration: none;
    }

    #markdown h1:hover .anchor .octicon-link,
    #markdown h2:hover .anchor .octicon-link,
    #markdown h3:hover .anchor .octicon-link,
    #markdown h4:hover .anchor .octicon-link,
    #markdown h5:hover .anchor .octicon-link,
    #markdown h6:hover .anchor .octicon-link {
        visibility: visible;
    }

    #markdown h1 {
        padding-bottom: 0.3em;
        border-bottom: 1px solid var(--border);
    }

    #markdown h2 {
        padding-bottom: 0.3em;
        border-bottom: 1px solid var(--border);
    }

    #markdown ul,
    #markdown ol {
        padding-left: 2em;
    }

    #markdown ul ul,
    #markdown ul ol,
    #markdown ol ol,
    #markdown ol ul {
        margin-top: 0;
        margin-bottom: 0;
    }

    #markdown li {
        word-wrap: break-all;
    }

    #markdown li > p {
        margin-top: 16px;
    }

    #markdown li + li {
        margin-top: 0.25em;
    }

    #markdown dl {
        padding: 0;
    }

    #markdown dl dt {
        padding: 0;
        margin-top: 16px;
        font-size: 1em;
        font-style: italic;
        font-weight: 600;
    }

    #markdown dl dd {
        padding: 0 16px;
        margin-bottom: 16px;
    }

    #markdown table {
        width: 100%;
        overflow: auto;
    }

    #markdown table th {
        font-weight: 600;
    }

    #markdown table th,
    #markdown table td {
        padding: 6px 13px;
    }

    #markdown table tr {
        background-color: var(--background);
    }

    #markdown table tr:nth-child(2n) {
        background-color: var(--background);
    }

    #markdown img {
        max-width: 100%;
        box-sizing: content-box;
        background-color: var(--background);
    }

    #markdown img[align="right"] {
        padding-left: 20px;
    }

    #markdown img[align="left"] {
        padding-right: 20px;
    }

    #markdown code {
        padding: 0.2em 0.4em;
        margin: 0;
        font-size: 85%;
        background-color: rgba(27, 31, 35, 0.05);
        border-radius: 3px;
    }

    #markdown pre {
        word-wrap: normal;
    }

    #markdown pre > code {
        padding: 0;
        margin: 0;
        font-size: 100%;
        word-break: normal;
        white-space: pre;
        background: transparent;
        border: 0;
    }

    #markdown .highlight {
        margin-bottom: 16px;
    }

    #markdown .highlight pre {
        margin-bottom: 0;
        word-break: normal;
    }

    #markdown .highlight pre,
    #markdown pre {
        padding: 16px;
        overflow: auto;
        font-size: 85%;
        line-height: 1.45;
        background-color: var(--background-highlight);
        border-radius: 3px;
    }

    #markdown pre code {
        display: inline;
        max-width: auto;
        padding: 0;
        margin: 0;
        overflow: visible;
        line-height: inherit;
        word-wrap: normal;
        background-color: transparent;
        border: 0;
    }

    #markdown .full-commit .btn-outline:not(:disabled):hover {
        color: #005cc5;
        border-color: #005cc5;
    }

    #markdown kbd {
        display: inline-block;
        padding: 3px 5px;
        font: 11px "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier,
            monospace;
        line-height: 10px;
        color: #444d56;
        vertical-align: middle;
        background-color: #fafbfc;
        border: solid 1px #d1d5da;
        border-bottom-color: #c6cbd1;
        border-radius: 3px;
        box-shadow: inset 0 -1px 0 #c6cbd1;
    }

    #markdown :checked + .radio-label {
        position: relative;
        z-index: 1;
        border-color: #0366d6;
    }

    #markdown .task-list-item {
        list-style-type: none;
    }

    #markdown .task-list-item + .task-list-item {
        margin-top: 3px;
    }

    #markdown .task-list-item input {
        margin: 0 0.2em 0.25em -1.6em;
        vertical-align: middle;
    }

    #markdown hr {
        border-bottom-color: var(--border);
    }

    #markdown .token.comment,
    #markdown .token.prolog,
    #markdown .token.doctype,
    #markdown .token.cdata {
        color: #008000;
        font-style: italic;
    }

    #markdown .token.namespace {
        opacity: 0.7;
    }

    #markdown .token.string {
        color: #a31515;
    }

    #markdown .token.punctuation,
    #markdown .token.operator {
        color: #393a34;
    }

    #markdown .token.url,
    #markdown .token.symbol,
    #markdown .token.number,
    #markdown .token.boolean,
    #markdown .token.variable,
    #markdown .token.constant,
    #markdown .token.inserted {
        color: #36acaa;
    }

    #markdown .token.atrule,
    #markdown .token.keyword,
    #markdown .token.attr-value,
    #markdown .language-autohotkey .token.selector,
    #markdown .language-json .token.boolean,
    #markdown .language-json .token.number,
    #markdown code[class*="language-css"] {
        color: #0000ff;
    }

    #markdown .token.function {
        color: #393a34;
    }

    #markdown .token.deleted,
    #markdown .language-autohotkey .token.tag {
        color: #9a050f;
    }

    #markdown .token.selector,
    #markdown .language-autohotkey .token.keyword {
        color: #00009f;
    }

    #markdown .token.important,
    #markdown .token.bold {
        font-weight: bold;
    }

    #markdown .token.italic {
        font-style: italic;
    }

    #markdown .token.class-name,
    #markdown .language-json .token.property {
        color: #2b91af;
    }

    #markdown .token.tag,
    #markdown .token.selector {
        color: #800000;
    }

    #markdown .token.attr-name,
    #markdown .token.property,
    #markdown .token.regex,
    #markdown .token.entity {
        color: #ff0000;
    }

    #markdown .token.directive.tag .tag {
        background: #ffff00;
        color: #393a34;
    }
</style>
