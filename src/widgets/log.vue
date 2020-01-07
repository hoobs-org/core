<template>
    <div id="log">
        <span class="message" v-for="(message, index) in messages" :key="index">{{ message }}</span>
    </div>
</template>

<script>
    export default {
        name: "log",

        computed: {
            messages() {
                return this.$store.state.messages;
            },

            user() {
                return this.$store.state.user;
            }
        },

        mounted() {
            this.$el.scrollTo(0, this.$el.scrollHeight);
        },

        updated() {
            this.$el.scrollTo(0, this.$el.scrollHeight);
        }
    };
</script>

<style scoped>
    #log {
        width: 100%;
        height: 100%;
        flex: 1;
        padding: 10px 20px;
        box-sizing: border-box;
        cursor: default;
        overflow: auto;
    }

    #log .message {
        display: block;
        unicode-bidi: embed;
        font-family: monospace;
        white-space: nowrap;
        font-size: .7em;
    }
</style>
