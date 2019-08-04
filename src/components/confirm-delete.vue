<template>
    <div id="confirm-delete">
        <div v-if="!showConfirm" class="button" v-on:click="confirm()">{{ title }}</div>
        <div v-if="showConfirm" class="button" v-on:click="cancel()">Cancel</div>
        <div v-if="showConfirm" class="button button-warning" v-on:click="execute()">Delete</div>
    </div>
</template>

<script>
    export default {
        name: "confirm-delete",

        props: {
            title: String,
            index: Number,
            confirmed: Function
        },

        data() {
            return {
                showConfirm: false
            };
        },

        methods: {
            confirm() {
                this.showConfirm = true;
            },

            cancel() {
                this.showConfirm = false;
            },

            execute() {
                this.showConfirm = false;
                this.confirmed(this.index);
            }
        }
    };
</script>

<style scoped>
    #confirm-delete .button {
        margin: 0 0 0 10px;
    }
</style>
