<template>
    <div id="error">
        <div class="message">
            {{ $t("page_not_found") }}
        </div>
    </div>
</template>

<script>
    export default {
        name: "error"
    }
</script>

<style scoped>
    #error {
        flex: 1;
        padding: 20px;
        display: flex;
        align-content: center;
        align-items: center;
        text-align: center;
        font-size: 24px;
    }

    #error .message {
        margin: 0 auto 20% auto;
        display: flex;
        align-content: center;
        align-items: center;
    }
</style>
