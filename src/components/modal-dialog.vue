<template>
    <div id="modal-dialog">
        <div class="dialog-inner" :style="`width: ${width}; height: ${height};`">
            <div class="dialog-content">
                <slot />
            </div>
            <div class="dialog-footer">
                <div v-if="cancel" class="button">{{ $t("cancel") }}</div>
                <div v-if="ok" class="button button-primary" v-on:click="ok()">{{ $t("ok") }}</div>
            </div>
        </div>
    </div>
</template>

<script>
    export default {
        name: "modal-dialog",

        props: {
            width: {
                type: String,
                default: "auto"
            },
            height: {
                type: String,
                default: "auto"
            },
            ok: Function,
            cancel: Function
        }
    };
</script>

<style scoped>
    #modal-dialog {
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 300;
        position: absolute;
        display: flex;
        align-content: center;
        align-items: center;
        background: var(--modal);
    }

    #modal-dialog .dialog-inner {
        display: inline;
        margin: 0 auto 10% auto;
        background: #fff;
        color: #515151;
        display: flex;
        flex-direction: column;
        border-radius: 3px;
        box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.2),
                    0 4px 5px 0 rgba(0, 0, 0, 0.14),
                    0 1px 10px 0 rgba(0, 0, 0, 0.12);
    }

    #modal-dialog .dialog-content {
        padding: 20px;
    }

    #modal-dialog .dialog-footer {
        display: flex;
        justify-content: flex-end;
        padding: 0 10px 20px 20px;
    }

    #modal-dialog .button {
        background: #fff;
        color: #777 !important;
        border: 1px #e5e5e5 solid;
    }

    #modal-dialog .button-primary {
        background: #feb400;
        color: #fff !important;
        border: 1px #feb400 solid;
    }
</style>
