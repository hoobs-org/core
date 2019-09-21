<template>
    <div id="logs">
        <span class="message" v-for="(message, index) in messages" :key="index">{{ message }}</span>
    </div>
</template>

<script>
    export default {
        name: "logs",

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
    }
</script>

<style scoped>
    #logs {
        flex: 1;
        padding: 20px;
        background: var(--background-dark);
        overflow: auto;
    }

    #logs .message {
        display: block;
        unicode-bidi: embed;
        font-family: monospace;
        white-space: pre-wrap;
        color: var(--log-text);
    }

    @media (min-width: 300px) and (max-width: 815px) {
        #logs .message {
            font-size: 10px;
        }
    }
</style>
