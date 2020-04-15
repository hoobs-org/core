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
    <div :style="height ? `height: ${height || 300}px;` : ''" id="editor"></div>
</template>

<script>
    export default {
        name: "json-editor",
        props: {
            name: String,
            code: String,
            index: Number,
            height: Number,
            change: Function
        },

        data() {
            return {
                editor: null
            }
        },

        mounted() {
            this.editor = CodeMirror(this.$el, {
                value: this.code,
                lineNumbers: false,
                indentUnit: 4,
                indentWithTabs: false,
                mode: "application/json",
                lint: true,
                change: (editor) => {
                    
                }
            });

            this.editor.on("change", (editor) => {
                if (this.change) {
                    this.change(this.name, editor.getValue(), this.index);
                }
            });

            this.editor.setOption("extraKeys", {
                Tab: (editor) => {
                    editor.replaceSelection(Array(editor.getOption("indentUnit") + 1).join(" "));
                }
            });
        }
    }
</script>

<style>
    #editor {
        margin: 0 0 20px 0;
        height: 100%;
        box-sizing: border-box;
    }

    #editor .CodeMirror {
        font-family: monospace;
        height: 100%;
        background: var(--input-background) !important;
        color: var(--input-text);
        direction: ltr;
        border: 1px var(--border) solid;
        border-radius: 5px;
        box-sizing: border-box;
    }

    #editor .CodeMirror-lines {
        padding: 4px 0;
    }

    #editor .CodeMirror pre {
        padding: 0 4px;
    }

    #editor .CodeMirror-scrollbar-filler,
    #editor .CodeMirror-gutter-filler {
        background-color: white;
    }

    #editor .CodeMirror-gutters {
        border-right: 1px solid #ddd;
        background-color: #f7f7f7;
        white-space: nowrap;
    }

    #editor .CodeMirror-linenumber {
        padding: 0 3px 0 5px;
        min-width: 20px;
        text-align: right;
        color: #999;
        white-space: nowrap;
    }

    #editor .CodeMirror-guttermarker {
        color: black;
    }

    #editor .CodeMirror-guttermarker-subtle {
        color: #999;
    }

    #editor .CodeMirror-cursor {
        border-left: 1px solid black;
        border-right: none;
        width: 0;
    }

    #editor .CodeMirror div.CodeMirror-secondarycursor {
        border-left: 1px solid silver;
    }

    #editor .cm-fat-cursor .CodeMirror-cursor {
        width: auto;
        border: 0 !important;
        background: #7e7;
    }

    #editor .cm-fat-cursor div.CodeMirror-cursors {
        z-index: 1;
    }

    #editor .cm-fat-cursor-mark {
        background-color: rgba(20, 255, 20, 0.5);
        -webkit-animation: blink 1.06s steps(1) infinite;
        -moz-animation: blink 1.06s steps(1) infinite;
        animation: blink 1.06s steps(1) infinite;
    }

    #editor .cm-animate-fat-cursor {
        width: auto;
        border: 0;
        -webkit-animation: blink 1.06s steps(1) infinite;
        -moz-animation: blink 1.06s steps(1) infinite;
        animation: blink 1.06s steps(1) infinite;
        background-color: #7e7;
    }

    @-moz-keyframes blink {
        0% {
        }

        50% {
            background-color: transparent;
        }

        100% {
        }
    }

    @-webkit-keyframes blink {
        0% {
        }

        50% {
            background-color: transparent;
        }

        100% {
        }
    }

    @keyframes blink {
        0% {
        }

        50% {
            background-color: transparent;
        }

        100% {
        }
    }

    #editor .cm-tab {
        display: inline-block;
        text-decoration: inherit;
    }

    #editor .CodeMirror-rulers {
        position: absolute;
        left: 0;
        right: 0;
        top: -50px;
        bottom: -20px;
        overflow: hidden;
    }

    #editor .CodeMirror-ruler {
        border-left: 1px solid #ccc;
        top: 0;
        bottom: 0;
        position: absolute;
    }

    #editor .cm-s-default .cm-header {
        color: blue;
    }

    #editor .cm-s-default .cm-quote {
        color: #090;
    }

    #editor .cm-negative {
        color: #d44;
    }

    #editor .cm-positive {
        color: #292;
    }

    #editor .cm-header,
    #editor .cm-strong {
        font-weight: bold;
    }

    #editor .cm-em {
        font-style: italic;
    }

    #editor .cm-link {
        text-decoration: underline;
    }

    #editor .cm-strikethrough {
        text-decoration: line-through;
    }

    #editor .cm-s-default .cm-keyword {
        color: #708;
    }

    #editor .cm-s-default .cm-atom {
        color: #219;
    }

    #editor .cm-s-default .cm-number {
        color: var(--input-json-number);
    }

    #editor .cm-s-default .cm-def {
        color: #00f;
    }

    #editor .cm-s-default .cm-variable-2 {
        color: #05a;
    }

    #editor .cm-s-default .cm-variable-3,
    #editor .cm-s-default .cm-type {
        color: #085;
    }

    #editor .cm-s-default .cm-comment {
        color: #a50;
    }

    #editor .cm-s-default .cm-string {
        color: var(--input-json-text);
    }

    #editor .cm-s-default .cm-string-2 {
        color: #f50;
    }

    #editor .cm-s-default .cm-meta {
        color: #555;
    }

    #editor .cm-s-default .cm-qualifier {
        color: #555;
    }

    #editor .cm-s-default .cm-builtin {
        color: #30a;
    }

    #editor .cm-s-default .cm-bracket {
        color: #997;
    }

    #editor .cm-s-default .cm-tag {
        color: #170;
    }

    #editor .cm-s-default .cm-attribute {
        color: #00c;
    }

    #editor .cm-s-default .cm-hr {
        color: #999;
    }

    #editor .cm-s-default .cm-link {
        color: #00c;
    }

    #editor .cm-s-default .cm-error {
        color: #f00;
    }

    #editor .cm-invalidchar {
        color: #f00;
    }

    #editor .CodeMirror-composing {
        border-bottom: 2px solid;
    }

    #editor div.CodeMirror span.CodeMirror-matchingbracket {
        color: #0b0;
    }

    #editor div.CodeMirror span.CodeMirror-nonmatchingbracket {
        color: #a22;
    }

    #editor .CodeMirror-matchingtag {
        background: rgba(255, 150, 0, 0.3);
    }

    #editor .CodeMirror-activeline-background {
        background: #e8f2ff;
    }

    #editor .CodeMirror {
        position: relative;
        overflow: hidden;
        background: white;
    }

    #editor .CodeMirror-scroll {
        overflow: scroll !important;
        margin-bottom: -30px;
        margin-right: -30px;
        padding-bottom: 30px;
        height: 100%;
        outline: none;
        position: relative;
    }

    #editor .CodeMirror-sizer {
        position: relative;
        border-right: 30px solid transparent;
    }

    #editor .CodeMirror-vscrollbar,
    #editor .CodeMirror-hscrollbar,
    #editor .CodeMirror-scrollbar-filler,
    #editor .CodeMirror-gutter-filler {
        position: absolute;
        z-index: 6;
        display: none;
    }

    #editor .CodeMirror-vscrollbar {
        right: 0;
        top: 0;
        overflow-x: hidden;
        overflow-y: scroll;
    }

    #editor .CodeMirror-hscrollbar {
        bottom: 0;
        left: 0;
        overflow-y: hidden;
        overflow-x: scroll;
    }

    #editor .CodeMirror-scrollbar-filler {
        right: 0;
        bottom: 0;
    }

    #editor .CodeMirror-gutter-filler {
        left: 0;
        bottom: 0;
    }

    #editor .CodeMirror-gutters {
        position: absolute;
        left: 0;
        top: 0;
        min-height: 100%;
        z-index: 3;
    }

    #editor .CodeMirror-gutter {
        white-space: normal;
        height: 100%;
        display: inline-block;
        vertical-align: top;
        margin-bottom: -30px;
    }

    #editor .CodeMirror-gutter-wrapper {
        position: absolute;
        z-index: 4;
        background: none !important;
        border: none !important;
    }

    #editor .CodeMirror-gutter-background {
        position: absolute;
        top: 0;
        bottom: 0;
        z-index: 4;
    }

    #editor .CodeMirror-gutter-elt {
        position: absolute;
        cursor: default;
        z-index: 4;
    }

    #editor .CodeMirror-gutter-wrapper ::selection {
        background-color: transparent;
    }

    #editor .CodeMirror-gutter-wrapper ::-moz-selection {
        background-color: transparent;
    }

    #editor .CodeMirror-lines {
        cursor: text;
        min-height: 1px;
    }

    #editor .CodeMirror pre {
        -moz-border-radius: 0;
        -webkit-border-radius: 0;
        border-radius: 0;
        border-width: 0;
        background: transparent;
        font-family: inherit;
        font-size: inherit;
        margin: 0;
        white-space: pre;
        word-wrap: normal;
        line-height: inherit;
        color: inherit;
        z-index: 2;
        position: relative;
        overflow: visible;
        -webkit-tap-highlight-color: transparent;
        -webkit-font-variant-ligatures: contextual;
        font-variant-ligatures: contextual;
    }

    #editor .CodeMirror-wrap pre {
        word-wrap: break-word;
        white-space: pre-wrap;
        word-break: normal;
    }

    #editor .CodeMirror-linebackground {
        position: absolute;
        left: 0;
        right: 0;
        top: 0;
        bottom: 0;
        z-index: 0;
    }

    #editor .CodeMirror-linewidget {
        position: relative;
        z-index: 2;
        padding: 0.1px;
    }

    #editor .CodeMirror-rtl pre {
        direction: rtl;
    }

    #editor .CodeMirror-code {
        outline: none;
    }

    #editor .CodeMirror-scroll,
    #editor .CodeMirror-sizer,
    #editor .CodeMirror-gutter,
    #editor .CodeMirror-gutters,
    #editor .CodeMirror-linenumber {
        -moz-box-sizing: content-box;
        box-sizing: content-box;
    }

    #editor .CodeMirror-measure {
        position: absolute;
        width: 100%;
        height: 0;
        overflow: hidden;
        visibility: hidden;
    }

    #editor .CodeMirror-cursor {
        position: absolute;
        pointer-events: none;
    }

    #editor .CodeMirror-measure pre {
        position: static;
    }

    div.CodeMirror-cursors {
        visibility: hidden;
        position: relative;
        z-index: 3;
    }

    div.CodeMirror-dragcursors {
        visibility: visible;
    }

    #editor .CodeMirror-focused div.CodeMirror-cursors {
        visibility: visible;
    }

    #editor .CodeMirror-selected {
        background: #d9d9d9;
    }

    #editor .CodeMirror-focused .CodeMirror-selected {
        background: #add6ff;
    }

    #editor .CodeMirror-crosshair {
        cursor: crosshair;
    }

    #editor .CodeMirror-line::selection,
    #editor .CodeMirror-line > span::selection,
    #editor .CodeMirror-line > span > span::selection {
        background: #add6ff;
    }

    #editor .CodeMirror-line::-moz-selection,
    #editor .CodeMirror-line > span::-moz-selection,
    #editor .CodeMirror-line > span > span::-moz-selection {
        background: #add6ff;
    }

    #editor .cm-searching {
        background-color: #ffa;
        background-color: rgba(255, 255, 0, 0.4);
    }

    #editor .cm-force-border {
        padding-right: 0.1px;
    }

    @media print {
        #editor .CodeMirror div.CodeMirror-cursors {
            visibility: hidden;
        }
    }

    #editor .cm-tab-wrap-hack:after {
        content: "";
    }

    #editor span.CodeMirror-selectedtext {
        background: none;
    }

    #editor .CodeMirror-lint-markers {
        width: 16px;
    }

    #editor .CodeMirror-lint-tooltip {
        background-color: #ffd;
        border: 1px solid black;
        border-radius: 4px 4px 4px 4px;
        color: black;
        font-family: monospace;
        font-size: 10pt;
        overflow: hidden;
        padding: 2px 5px;
        position: fixed;
        white-space: pre;
        white-space: pre-wrap;
        z-index: 100;
        max-width: 600px;
        opacity: 0;
        transition: opacity .4s;
        -moz-transition: opacity .4s;
        -webkit-transition: opacity .4s;
        -o-transition: opacity .4s;
        -ms-transition: opacity .4s;
    }

    #editor .CodeMirror-lint-mark-error,
    #editor .CodeMirror-lint-mark-warning {
        background-position: left bottom;
        background-repeat: repeat-x;
    }

    #editor .CodeMirror-lint-mark-error {
        background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAADCAYAAAC09K7GAAAAAXNSR0IArs4c6QAAAAZiS0dEAP8A/wD/oL2nkwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAd0SU1FB9sJDw4cOCW1/KIAAAAZdEVYdENvbW1lbnQAQ3JlYXRlZCB3aXRoIEdJTVBXgQ4XAAAAHElEQVQI12NggIL/DAz/GdA5/xkY/qPKMDAwAADLZwf5rvm+LQAAAABJRU5ErkJggg==");
    }

    #editor .CodeMirror-lint-mark-warning {
        background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAADCAYAAAC09K7GAAAAAXNSR0IArs4c6QAAAAZiS0dEAP8A/wD/oL2nkwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAd0SU1FB9sJFhQXEbhTg7YAAAAZdEVYdENvbW1lbnQAQ3JlYXRlZCB3aXRoIEdJTVBXgQ4XAAAAMklEQVQI12NkgIIvJ3QXMjAwdDN+OaEbysDA4MPAwNDNwMCwiOHLCd1zX07o6kBVGQEAKBANtobskNMAAAAASUVORK5CYII=");
    }

    #editor .CodeMirror-lint-marker-error,
    #editor .CodeMirror-lint-marker-warning {
        background-position: center center;
        background-repeat: no-repeat;
        cursor: pointer;
        display: inline-block;
        height: 16px;
        width: 16px;
        vertical-align: middle;
        position: relative;
    }

    #editor .CodeMirror-lint-message-error,
    #editor .CodeMirror-lint-message-warning {
        padding-left: 18px;
        background-position: top left;
        background-repeat: no-repeat;
    }

    #editor .CodeMirror-lint-marker-error,
    #editor .CodeMirror-lint-message-error {
        background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAAHlBMVEW7AAC7AACxAAC7AAC7AAAAAAC4AAC5AAD///+7AAAUdclpAAAABnRSTlMXnORSiwCK0ZKSAAAATUlEQVR42mWPOQ7AQAgDuQLx/z8csYRmPRIFIwRGnosRrpamvkKi0FTIiMASR3hhKW+hAN6/tIWhu9PDWiTGNEkTtIOucA5Oyr9ckPgAWm0GPBog6v4AAAAASUVORK5CYII=");
    }

    #editor .CodeMirror-lint-marker-warning,
    #editor .CodeMirror-lint-message-warning {
        background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAANlBMVEX/uwDvrwD/uwD/uwD/uwD/uwD/uwD/uwD/uwD6twD/uwAAAADurwD2tQD7uAD+ugAAAAD/uwDhmeTRAAAADHRSTlMJ8mN1EYcbmiixgACm7WbuAAAAVklEQVR42n3PUQqAIBBFUU1LLc3u/jdbOJoW1P08DA9Gba8+YWJ6gNJoNYIBzAA2chBth5kLmG9YUoG0NHAUwFXwO9LuBQL1giCQb8gC9Oro2vp5rncCIY8L8uEx5ZkAAAAASUVORK5CYII=");
    }

    #editor .CodeMirror-lint-marker-multiple {
        background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAcAAAAHCAMAAADzjKfhAAAACVBMVEUAAAAAAAC/v7914kyHAAAAAXRSTlMAQObYZgAAACNJREFUeNo1ioEJAAAIwmz/H90iFFSGJgFMe3gaLZ0od+9/AQZ0ADosbYraAAAAAElFTkSuQmCC");
        background-repeat: no-repeat;
        background-position: right bottom;
        width: 100%; height: 100%;
    }
</style>
