<template>
    <div id="notification">
        <div v-if="value.type === 'error'" class="notification-error">
            <span class="icon">error</span>
        </div>
        <div v-else-if="value.type === 'warning'" class="notification-warning">
            <span class="icon">warning</span>
        </div>
        <div v-else class="notification-info">
            <span class="icon">notifications</span>
        </div>
        <div class="notification-content">
            <span class="notification-time">{{ age(value.time) }}</span>
            <span class="notification-title">{{ value.title }}</span>
            <p class="notification-message">
                {{ value.message }}
            </p>
        </div>
        <div class="icon notification-close" v-on:click="close(value.id)">close</div>
    </div>
</template>

<script>
    import Dates from "../dates";

    export default {
        name: "notification",

        props: {
            value: Object
        },

        computed: {
            notifications() {
                return this.$store.state.notifications;
            }
        },

        mounted() {
            setTimeout(() => {
                this.close();
            }, 1000 * 7);
        },

        methods: {
            close() {
                const index = this.notifications.findIndex(n => n.id === this.value.id);

                if (index > -1) {
                    this.$store.commit("dismiss", index);
                }
            },

            age(time) {
                return Dates.getAgeDisplay(time);
            }
        }
    };
</script>

<style scoped>
    #notification {
        width: 100%;
        position: relative;
        margin: 7px 0 0 0;
        color: #515151;
        display: flex;
        flex-direction: row;
        border-radius: 3px;
        box-sizing: border-box;
        box-shadow: var(--elevation-large);
    }

    #notification .notification-content {
        padding: 14px 32px 14px 20px;
        border-radius: 0 3px 3px 0;
        display: flex;
        flex-direction: column;
        background: #fff;
        font-size: 14px;
        opacity: 0.9;
        flex: 1
    }

    #notification .notification-error,
    #notification .notification-warning,
    #notification .notification-info {
        display: flex;
        align-content: center;
        align-items: center;
        padding: 0 20px;
        border-radius: 3px 0 0 3px;
        opacity: 0.9;
    }

    #notification .notification-error .icon,
    #notification .notification-warning .icon,
    #notification .notification-info .icon {
        font-size: 32px;
        opacity: 0.5;
    }

    #notification .notification-error {
        color: #fff;
        background: #e30505;
    }

    #notification .notification-warning {
        color: #fff;
        background: #feb400;
    }

    #notification .notification-info {
        color: #fff;
        background: #019420
    }

    #notification .notification-time {
        color: #949494;
        font-size: 9px;
    }

    #notification .notification-title {
        font-weight: bold;
        font-size: 12px;
    }

    #notification .notification-message {
        margin: 0;
        font-size: 12px;
    }

    #notification .notification-close {
        position: absolute;
        top: 7px;
        right: 7px;
        font-size: 14px;
        cursor: pointer;
    }
</style>
