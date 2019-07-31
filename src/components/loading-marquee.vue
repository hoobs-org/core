<template>
    <div :style="`height: ${height || 3}px; background: var(${background}); opacity: ${opacity};`" id="marquee">
        <div :style="`height: ${height || 3}px; background: var(${color});`"></div>
    </div>
</template>

<script>
    export default {
        name: "loading-marquee",
        props: {
            background: String,
            color: String,
            height: Number
        },

        data() {
            return {
                opacity: 0
            }
        },

        mounted() {
            setTimeout(() => {
                this.opacity = 1;
            }, 250);
        }
    };
</script>

<style scoped>
    #marquee {
        overflow: hidden;
        position: relative;
    }

    #marquee div {
        position: absolute;
        width: 40%;
        margin: 0;
        -moz-animation: loading-marquee 2s linear infinite alternate;
        -webkit-animation: loading-marquee 2s linear infinite alternate;
        animation: loading-marquee 2s linear infinite alternate;
    }

    @-moz-keyframes loading-marquee {
        0% {
            -moz-transform: translateX(280%);
        }

        100% {
            -moz-transform: translateX(-140%);
        }
    }

    @-webkit-keyframes loading-marquee {
        0% {
            -webkit-transform: translateX(280%);
        }

        100% {
            -webkit-transform: translateX(-140%);
        }
    }

    @keyframes loading-marquee {
        0% {
            -moz-transform: translateX(280%);
            -webkit-transform: translateX(280%);
            transform: translateX(280%);
        }

        100% {
            -moz-transform: translateX(-140%);
            -webkit-transform: translateX(-140%);
            transform: translateX(-140%);
        }
    }
</style>
