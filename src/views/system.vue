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
    <div id="system">
        <div v-if="info" class="info">
            <router-link to="/system/software" :class="section === 'software' ? 'active' : ''">{{ $t("software") }}</router-link>
            <div v-for="(item, title) in info" :key="title">
                <router-link :to="`/system/${title}`" :class="section === title ? 'active' : ''">{{ translate(title) }}</router-link>
            </div>
            <router-link v-if="!$server.docker" to="/system/filesystem" :class="section === 'filesystem' ? 'active' : ''">{{ translate("file_system") }}</router-link>
            <router-link v-if="user.admin" to="/system/terminal" class="mobile-hide">{{ $t("terminal") }}</router-link>
        </div>
        <div v-if="info" ref="content" class="content">
            <div v-if="section === 'software' || screen.width <= 815" class="system-content">
                <h2>{{ $t("software") }}</h2>
                <div v-if="!$server.docker" class="update-card">
                    <b>HOOBS Core</b>
                    <span v-if="status">Current Version: {{ status["hoobs_version"] }}</span>
                    <div v-if="checking" class="update-actions">
                        <loading-marquee :height="3" color="--title-text" background="--title-text-dim" />
                    </div>
                    <div v-else-if="updates.length > 0" class="update-actions">
                        <b>{{ updates[0].version }} {{ $t("update_available") }}</b><br>
                        <div class="button button-primary" v-on:click="update()">{{ $t("update") }}</div>
                        <div v-if="updates[0].changelog" class="button" v-on:click="showChangelog(updates[0])">{{ $t("whats_new") }}</div>
                    </div>
                    <div v-else class="update-actions">
                        <b>{{ $t("up_to_date") }}</b>
                    </div>
                </div>
                <table>
                    <tbody>
                        <tr v-for="(value, name) in status" :key="name">
                            <td style="min-width: 250px;">{{ translate(name) }}</td>
                            <td style="width: 100%;">{{ value }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div v-for="(item, title) in info" :key="title">
                <div v-if="section === title || screen.width <= 815" class="system-content">
                    <h2>{{ translate(title) }}</h2>
                    <table>
                        <tbody>
                            <tr v-for="(value, name) in item" :key="name">
                                <td style="min-width: 250px;">{{ translate(name) }}</td>
                                <td style="width: 100%;">{{ value }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <div v-if="!$server.docker && (section === 'filesystem' || screen.width <= 815)" class="system-content">
                <h2>{{ translate("file_system") }}</h2>
                <table>
                    <tbody>
                        <tr v-for="(item, index) in filesystem" :key="index">
                            <td style="min-width: 250px;">{{ item.mount }}</td>
                            <td style="width: 100%;">{{ $t("used") }} {{ item.use }}%</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
        <modal-dialog v-if="changelog" width="550px" :ok="closeChangelog">
            <div v-if="formatted !== ''" v-html="formatted" ref="changelog" id="changelog"></div>
        </modal-dialog>
    </div>
</template>

<script>
    import Showdown from "showdown";
    import Prism from "prismjs";

    import Marquee from "@/components/loading-marquee.vue";
    import ModalDialog from "@/components/modal-dialog.vue";

    import { setTimeout } from "timers";

    export default {
        name: "system",

        components: {
            "loading-marquee": Marquee,
            "modal-dialog": ModalDialog
        },

        props: {
            section: String
        },

        computed: {
            user() {
                return this.$store.state.user;
            },

            screen() {
                return this.$store.state.screen;
            }
        },

        data() {
            return {
                info: null,
                status: null,
                filesystem: null,
                checking: true,
                updates: [],
                changelog: false,
                formatted: ""
            }
        },

        async mounted() {
            this.filesystem = await this.api.get("/system/filesystem");
            this.status = await this.api.get("/status");
            this.info = await this.api.get("/system");

            if (window.location.hash && window.location.hash !== "" && window.location.hash !== "#") {
                if (document.querySelector(window.location.hash)) {
                    document.querySelector(window.location.hash).scrollIntoView();
                }
            }

            this.checkVersion();
        },

        methods: {
            async checkVersion() {
                this.checking = true;
                this.updates = await this.api.get("/system/updates");

                setTimeout(() => {
                    this.checking = false;
                }, 100);
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

            showChangelog(update) {
                this.changelog = true;

                this.formatted = new Showdown.Converter({
                    tables: true
                }).makeHtml(`## HOOBS ${update.version}\n${update.changelog}`);

                setTimeout(() => {
                    Prism.highlightAllUnder(this.$refs.changelog);

                    if (this.$refs.changelog) {
                        const links = this.$refs.changelog.querySelectorAll("a");

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
            },

            closeChangelog() {
                this.changelog = false;
            },

            async update() {
                this.checking = true;

                this.$store.commit("lock");

                await this.api.post("/service/stop");
                await this.api.put("/update");

                setTimeout(() => {
                    this.$store.commit("reboot");
                }, 1000 * 60 * 2);
            },

            getTemp(value) {
                if (this.$client.temp_units && this.$client.temp_units === "celsius") {
                    return Math.round(value);
                }

                return Math.round((value * (9/5)) + 32);
            }
        }
    }
</script>

<style scoped>
    #system {
        flex: 1;
        padding: 0;
        display: flex;
        overflow: hidden;
    }

    #system .info {
        width: 230px;
        padding: 20px 0 20px 20px;
        overflow: auto;
    }

    #system .info a,
    #system .info a:link,
    #system .info a:active,
    #system .info a:visited {
        padding: 10px;
        border-bottom: 1px var(--border) solid;
        color: var(--text);
        text-decoration: none;
        display: block;
    }

    #system .info a:hover {
        color: var(--text-dark);
    }

    #system .info .active {
        font-weight: bold;
        color: var(--title-text) !important;
    }

    #system .content {
        flex: 1;
        padding: 20px;
        display: flex;
        flex-direction: column;
        overflow: auto;
    }

    #system .system-content {
        width: 100%;
        max-width: 780px;
        margin: 0;
    }

    #system .update-card {
        padding: 20px;
        display: flex;
        flex-direction: column;
        background: var(--background-light);
        box-shadow: var(--elevation-small);
        border-radius: 3px;
        color: var(--text) !important;
        margin: 10px 0;
    }

    #system .update-card .update-actions {
        margin: 20px 0 0 0;
    }

    #system .update-card .update-actions .button {
        margin: 10px 10px 0 0;
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

    @media (min-width: 300px) and (max-width: 815px) {
        #system .info {
            display: none;
        }

        #system .system-content table {
            margin: 0 20px 30px 0;
        }

        #system .system-content table tr {
            display: flex;
            flex-direction: column;
        }

        #system .system-content table tr td {
            padding: 0 10px 10px 10px;
            min-width: unset !important;
            width: unset !important;
        }

        #system .system-content table tr td:first-child {
            border: 0 none;
            padding: 10px 10px 0 10px;
            font-weight: bold;
        }
    }
</style>

<style>
    #changelog {
        padding: 5px 0 20px 0;
        font-size: 14px;
    }

    #changelog .pl-c {
        color: #6a737d;
    }

    #changelog .pl-c1,
    #changelog .pl-s .pl-v {
        color: #005cc5;
    }

    #changelog .pl-e,
    #changelog .pl-en {
        color: #6f42c1;
    }

    #changelog .pl-smi,
    #changelog .pl-s .pl-s1 {
        color: #24292e;
    }

    #changelog .pl-ent {
        color: #22863a;
    }

    #changelog .pl-k {
        color: #d73a49;
    }

    #changelog .pl-s,
    #changelog .pl-pds,
    #changelog .pl-s .pl-pse .pl-s1,
    #changelog .pl-sr,
    #changelog .pl-sr .pl-cce,
    #changelog .pl-sr .pl-sre,
    #changelog .pl-sr .pl-sra {
        color: #032f62;
    }

    #changelog .pl-v,
    #changelog .pl-smw {
        color: #e36209;
    }

    #changelog .pl-bu {
        color: #b31d28;
    }

    #changelog .pl-ii {
        color: #fafbfc;
        background-color: #b31d28;
    }

    #changelog .pl-c2 {
        color: #fafbfc;
        background-color: #d73a49;
    }

    #changelog .pl-c2::before {
        content: "^M";
    }

    #changelog .pl-sr .pl-cce {
        font-weight: bold;
        color: #22863a;
    }

    #changelog .pl-ml {
        color: #735c0f;
    }

    #changelog .pl-mh,
    #changelog .pl-mh .pl-en,
    #changelog .pl-ms {
        font-weight: bold;
        color: #005cc5;
    }

    #changelog .pl-mi {
        font-style: italic;
        color: #24292e;
    }

    #changelog .pl-mb {
        font-weight: bold;
        color: #24292e;
    }

    #changelog .pl-md {
        color: #b31d28;
        background-color: #ffeef0;
    }

    #changelog .pl-mi1 {
        color: #22863a;
        background-color: #f0fff4;
    }

    #changelog .pl-mc {
        color: #e36209;
        background-color: #ffebda;
    }

    #changelog .pl-mi2 {
        color: #f6f8fa;
        background-color: #005cc5;
    }

    #changelog .pl-mdr {
        font-weight: bold;
        color: #6f42c1;
    }

    #changelog .pl-ba {
        color: #586069;
    }

    #changelog .pl-sg {
        color: #959da5;
    }

    #changelog .pl-corl {
        text-decoration: underline;
        color: #032f62;
    }

    #changelog .octicon {
        display: inline-block;
        vertical-align: text-top;
        fill: currentColor;
    }

    #changelog a {
        background-color: transparent;
    }

    #changelog a:active,
    #changelog a:hover {
        outline-width: 0;
    }

    #changelog strong {
        font-weight: inherit;
    }

    #changelog strong {
        font-weight: bolder;
    }

    #changelog h1 {
        margin: 0.67em 0;
    }

    #changelog img {
        border-style: none;
    }

    #changelog code,
    #changelog kbd,
    #changelog pre {
        font-family: monospace, monospace;
        font-size: 1em;
    }

    #changelog hr {
        box-sizing: content-box;
        height: 0;
        overflow: visible;
    }

    #changelog input {
        font: inherit;
        margin: 0;
    }

    #changelog input {
        overflow: visible;
    }

    #changelog [type="checkbox"] {
        box-sizing: border-box;
        padding: 0;
    }

    #changelog * {
        box-sizing: border-box;
    }

    #changelog input {
        font-family: inherit;
        font-size: inherit;
        line-height: inherit;
    }

    #changelog a {
        color: #0366d6;
        text-decoration: none;
    }

    #changelog a:hover {
        text-decoration: underline;
    }

    #changelog strong {
        font-weight: 600;
    }

    #changelog hr {
        height: 0;
        margin: 15px 0;
        overflow: hidden;
        background: transparent;
        border: 0;
        border-bottom: 1px solid #e5e5e5;
    }

    #changelog hr::before {
        display: table;
        content: "";
    }

    #changelog hr::after {
        display: table;
        clear: both;
        content: "";
    }

    #changelog table {
        border-spacing: 0;
        border-collapse: collapse;
    }

    #changelog table th {
        padding: 10px;
        text-align: left;
        border-bottom: 1px #acacac solid;
        color: #515151;
    }

    #changelog table td {
        padding: 10px;
        background-color: #fff;
        border-bottom: 1px #e5e5e5 solid;
    }

    #changelog h1,
    #changelog h2,
    #changelog h3,
    #changelog h4,
    #changelog h5,
    #changelog h6 {
        margin-top: 0;
        margin-bottom: 0;
    }

    #changelog h1 {
        font-size: 24px;
        color: #feb400;
        font-weight: 600;
    }

    #changelog h2 {
        font-size: 20px;
        font-weight: 600;
    }

    #changelog h3 {
        font-size: 18px;
        font-weight: 600;
    }

    #changelog h4,
    #changelog h5,
    #changelog h6 {
        font-size: 14px;
        font-weight: 600;
    }

    #changelog p {
        margin-top: 0;
        margin-bottom: 10px;
    }

    #changelog blockquote {
        margin: 0;
    }

    #changelog ul,
    #changelog ol {
        padding-left: 0;
        margin-top: 0;
        margin-bottom: 0;
    }

    #changelog ol ol,
    #changelog ul ol {
        list-style-type: lower-roman;
    }

    #changelog ul ul ol,
    #changelog ul ol ol,
    #changelog ol ul ol,
    #changelog ol ol ol {
        list-style-type: lower-alpha;
    }

    #changelog dd {
        margin-left: 0;
    }

    #changelog code {
        font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier,
            monospace;
        font-size: 12px;
    }

    #changelog pre {
        margin-top: 0;
        margin-bottom: 0;
        font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier,
            monospace;
        font-size: 12px;
    }

    #changelog .octicon {
        vertical-align: text-bottom;
    }

    #changelog .pl-0 {
        padding-left: 0 !important;
    }

    #changelog .pl-1 {
        padding-left: 4px !important;
    }

    #changelog .pl-2 {
        padding-left: 8px !important;
    }

    #changelog .pl-3 {
        padding-left: 16px !important;
    }

    #changelog .pl-4 {
        padding-left: 24px !important;
    }

    #changelog .pl-5 {
        padding-left: 32px !important;
    }

    #changelog .pl-6 {
        padding-left: 40px !important;
    }

    #changelog::before {
        display: table;
        content: "";
    }

    #changelog::after {
        display: table;
        clear: both;
        content: "";
    }

    #changelog > *:first-child {
        margin-top: 0 !important;
    }

    #changelog > *:last-child {
        margin-bottom: 0 !important;
    }

    #changelog a:not([href]) {
        color: inherit;
        text-decoration: none;
    }

    #changelog .anchor {
        float: left;
        padding-right: 4px;
        margin-left: -20px;
        line-height: 1;
    }

    #changelog .anchor:focus {
        outline: none;
    }

    #changelog p,
    #changelog blockquote,
    #changelog ul,
    #changelog ol,
    #changelog dl,
    #changelog table,
    #changelog pre {
        margin-top: 0;
        margin-bottom: 16px;
    }

    #changelog hr {
        height: 0.25em;
        padding: 0;
        margin: 24px 0;
        background-color: #e1e4e8;
        border: 0;
    }

    #changelog blockquote {
        padding: 0 1em;
        color: #6a737d;
        border-left: 0.25em solid #dfe2e5;
    }

    #changelog blockquote > :first-child {
        margin-top: 0;
    }

    #changelog blockquote > :last-child {
        margin-bottom: 0;
    }

    #changelog kbd {
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

    #changelog h1,
    #changelog h2,
    #changelog h3,
    #changelog h4,
    #changelog h5,
    #changelog h6 {
        margin-top: 24px;
        margin-bottom: 16px;
        font-weight: 600;
        line-height: 1.25;
    }

    #changelog h1 .octicon-link,
    #changelog h2 .octicon-link,
    #changelog h3 .octicon-link,
    #changelog h4 .octicon-link,
    #changelog h5 .octicon-link,
    #changelog h6 .octicon-link {
        color: #1b1f23;
        vertical-align: middle;
        visibility: hidden;
    }

    #changelog h1:hover .anchor,
    #changelog h2:hover .anchor,
    #changelog h3:hover .anchor,
    #changelog h4:hover .anchor,
    #changelog h5:hover .anchor,
    #changelog h6:hover .anchor {
        text-decoration: none;
    }

    #changelog h1:hover .anchor .octicon-link,
    #changelog h2:hover .anchor .octicon-link,
    #changelog h3:hover .anchor .octicon-link,
    #changelog h4:hover .anchor .octicon-link,
    #changelog h5:hover .anchor .octicon-link,
    #changelog h6:hover .anchor .octicon-link {
        visibility: visible;
    }

    #changelog h1 {
        padding-bottom: 0.3em;
        border-bottom: 1px solid #e5e5e5;
    }

    #changelog h2 {
        padding-bottom: 0.3em;
        border-bottom: 1px solid #e5e5e5;
    }

    #changelog ul,
    #changelog ol {
        padding-left: 2em;
    }

    #changelog ul ul,
    #changelog ul ol,
    #changelog ol ol,
    #changelog ol ul {
        margin-top: 0;
        margin-bottom: 0;
    }

    #changelog li {
        word-wrap: break-all;
    }

    #changelog li > p {
        margin-top: 16px;
    }

    #changelog li + li {
        margin-top: 0.25em;
    }

    #changelog dl {
        padding: 0;
    }

    #changelog dl dt {
        padding: 0;
        margin-top: 16px;
        font-size: 1em;
        font-style: italic;
        font-weight: 600;
    }

    #changelog dl dd {
        padding: 0 16px;
        margin-bottom: 16px;
    }

    #changelog table {
        width: 100%;
        overflow: auto;
    }

    #changelog table th {
        font-weight: 600;
    }

    #changelog table th,
    #changelog table td {
        padding: 6px 13px;
    }

    #changelog table tr {
        background-color: #fff;
    }

    #changelog table tr:nth-child(2n) {
        background-color: #fff;
    }

    #changelog img {
        max-width: 100%;
        box-sizing: content-box;
        background-color: #fff;
    }

    #changelog img[align="right"] {
        padding-left: 20px;
    }

    #changelog img[align="left"] {
        padding-right: 20px;
    }

    #changelog code {
        padding: 0.2em 0.4em;
        margin: 0;
        font-size: 85%;
        background-color: rgba(27, 31, 35, 0.05);
        border-radius: 3px;
    }

    #changelog pre {
        word-wrap: normal;
    }

    #changelog pre > code {
        padding: 0;
        margin: 0;
        font-size: 100%;
        word-break: normal;
        white-space: pre;
        background: transparent;
        border: 0;
    }

    #changelog .highlight {
        margin-bottom: 16px;
    }

    #changelog .highlight pre {
        margin-bottom: 0;
        word-break: normal;
    }

    #changelog .highlight pre,
    #changelog pre {
        padding: 16px;
        overflow: auto;
        font-size: 85%;
        line-height: 1.45;
        background-color: #f1f1f1;
        border-radius: 3px;
    }

    #changelog pre code {
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

    #changelog .full-commit .btn-outline:not(:disabled):hover {
        color: #005cc5;
        border-color: #005cc5;
    }

    #changelog kbd {
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

    #changelog :checked + .radio-label {
        position: relative;
        z-index: 1;
        border-color: #0366d6;
    }

    #changelog .task-list-item {
        list-style-type: none;
    }

    #changelog .task-list-item + .task-list-item {
        margin-top: 3px;
    }

    #changelog .task-list-item input {
        margin: 0 0.2em 0.25em -1.6em;
        vertical-align: middle;
    }

    #changelog hr {
        border-bottom-color: #e5e5e5;
    }

    #changelog .token.comment,
    #changelog .token.prolog,
    #changelog .token.doctype,
    #changelog .token.cdata {
        color: #008000;
        font-style: italic;
    }

    #changelog .token.namespace {
        opacity: 0.7;
    }

    #changelog .token.string {
        color: #a31515;
    }

    #changelog .token.punctuation,
    #changelog .token.operator {
        color: #393a34;
    }

    #changelog .token.url,
    #changelog .token.symbol,
    #changelog .token.number,
    #changelog .token.boolean,
    #changelog .token.variable,
    #changelog .token.constant,
    #changelog .token.inserted {
        color: #36acaa;
    }

    #changelog .token.atrule,
    #changelog .token.keyword,
    #changelog .token.attr-value,
    #changelog .language-autohotkey .token.selector,
    #changelog .language-json .token.boolean,
    #changelog .language-json .token.number,
    #changelog code[class*="language-css"] {
        color: #0000ff;
    }

    #changelog .token.function {
        color: #393a34;
    }

    #changelog .token.deleted,
    #changelog .language-autohotkey .token.tag {
        color: #9a050f;
    }

    #changelog .token.selector,
    #changelog .language-autohotkey .token.keyword {
        color: #00009f;
    }

    #changelog .token.important,
    #changelog .token.bold {
        font-weight: bold;
    }

    #changelog .token.italic {
        font-style: italic;
    }

    #changelog .token.class-name,
    #changelog .language-json .token.property {
        color: #2b91af;
    }

    #changelog .token.tag,
    #changelog .token.selector {
        color: #800000;
    }

    #changelog .token.attr-name,
    #changelog .token.property,
    #changelog .token.regex,
    #changelog .token.entity {
        color: #ff0000;
    }

    #changelog .token.directive.tag .tag {
        background: #ffff00;
        color: #393a34;
    }
</style>
