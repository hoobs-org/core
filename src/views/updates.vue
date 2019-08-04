<template>
    <div v-if="user.admin" id="updates"></div>
</template>

<script>
    export default {
        name: "updates",

        computed: {
            user() {
                return this.$store.state.user;
            }
        }
    }
</script>

<style scoped>
    #updates {
        flex: 1;
        padding: 20px;
        overflow: auto;
    }
</style>
