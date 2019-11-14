<template>
    <div id="modal-dialog">
        <div class="dialog-inner" :style="`width: ${width}; height: ${height};`">
            <div v-if="title" class="dialog-header">{{ title }}</div>
            <div class="dialog-content">
                <slot />
            </div>
            <div class="dialog-footer">
                <div v-if="$theme.donate && donate" class="button" v-on:click="donate()">{{ $t("donate") }}</div>
                <div v-if="cancel" class="button" v-on:click="cancel()">{{ $t("cancel") }}</div>
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
            title: String,
            ok: Function,
            cancel: Function,
            donate: Function
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
        max-height: 65%;
        background: #fff;
        color: #515151;
        display: flex;
        flex-direction: column;
        border-radius: 3px;
        box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.2),
                    0 4px 5px 0 rgba(0, 0, 0, 0.14),
                    0 1px 10px 0 rgba(0, 0, 0, 0.12);
    }

    #modal-dialog .dialog-header {
        padding: 10px 10px 0 10px;
        font-size: 14px;
        font-weight: bold;
    }

    #modal-dialog .dialog-content {
        flex: 1;
        padding: 20px;
        overflow: auto;
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
        background: var(--button-primary);
        color: var(--button-primary-text) !important;
        border: 1px var(--button-primary) solid;
    }

    @media (min-width: 300px) and (max-width: 815px) {
        #modal-dialog {
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 300;
            position: absolute;
            display: unset;
            background: var(--modal);
        }

        #modal-dialog .dialog-inner {
            display: block;
            margin: 0;
            max-height: unset;
            width: 100% !important;
            height: 100% !important;
            display: flex;
            border-radius: unset;
            box-shadow: unset;
        }
    }
</style>
