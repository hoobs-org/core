<template>
    <div id="login">
        <div v-if="init" class="content create">
            <div class="form">
                <h2>
                    <div class="logo" v-html="$theme.logo.login"></div>
                    {{ $t("welcome_message_hoobs") }}
                </h2>
                <p>
                    {{ $t("setup_admin_account")}}
                </p>
                <div v-if="errors.length > 0" class="errors">
                    <span v-for="(error, index) in errors" :key="index">{{ error }}</span>
                </div>
                <form autocomplete="false" method="post" action="/login" v-on:submit.prevent="createAccount()">
                    <input type="submit" class="hidden-submit" value="submit">
                    <text-field :name="$t('name')" v-model="name" :required="true" />
                    <text-field :name="$t('username')" v-model="username" :required="true" />
                    <password-field :name="$t('password')" v-model="password" />
                    <password-field :name="$t('reenter_password')" v-model="challenge" />
                </form>
                <div class="actions">
                    <div class="button button-primary" @click="createAccount()">{{ $t("create_account") }}</div>
                </div>
            </div>
        </div>
        <div v-else class="content">
            <div class="form">
                <h2>
                    <div class="logo" v-html="$theme.logo.login"></div>
                    {{ $t("log_in") }}
                </h2>
                <div v-if="errors.length > 0" class="errors">
                    <span v-for="(error, index) in errors" :key="index">{{ error }}</span>
                </div>
                <form autocomplete="false">
                    <div class="group">
                        <div class="upper">
                            <label for="username" class="title">{{ $t("username") }}</label>
                            <input type="text" id="username" autocomplete="false" v-model="username" v-on:keyup.enter="login" :required="true" />
                        </div>
                        <div class="lower">
                            <label for="password" class="title">{{ $t("password") }}</label>
                            <input type="password" id="password" autocomplete="false" v-model="password" v-on:keyup.enter="login" :required="true" />
                        </div>
                    </div>
                    <div class="remember">
                        <checkbox id="remember" v-model="remember"> <label for="remember">{{ $t("remember_me") }}</label></checkbox>
                    </div>
                </form>
                <div class="actions">
                    <div class="button button-primary" @click="login()">   {{ $t("log_in") }}   </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import Checkbox from "vue-material-checkbox";
    import TextField from "@/components/text-field.vue";
    import PasswordField from "@/components/password-field.vue";

    import Cookies from "../cookies";

    export default {
        name: "login",

        components: {
            "checkbox": Checkbox,
            "text-field": TextField,
            "password-field": PasswordField
        },

        data () {
            return {
                init: false,
                name: "",
                username: "",
                password: "",
                challenge: "",
                remember: false,
                errors: [],
                url: "/"
            }
        },

        async mounted() {
            this.url = this.$route.query.url || "/";

            if (this.url.startsWith("/login")) {
                this.url = "/";
            }

            Cookies.set("token", "", -30);
            Cookies.set("instance", "", -30);

            this.$store.commit("session", null);
            this.init = (await this.client.get("/auth")).state === -1;
        },

        methods: {
            async login() {
                this.errors = [];

                if (this.username === "" || this.username.length < 3) {
                    this.errors.push(this.$t("invalid_username_password"));
                }

                if (this.errors.length === 0) {
                    const response = await this.client.post("/auth", {
                        username: this.username.toLowerCase(),
                        password: this.password,
                        remember: this.remember
                    });

                    if (response.token) {
                        Cookies.set("token", response.token, this.remember ? 525600 : this.$client.inactive_logoff || 30);

                        this.$router.push({
                            path: this.url
                        });
                    } else {
                        if (response.error) {
                            this.errors.push(response.error);
                        }

                        this.username = "";
                        this.password = "";
                    }
                }
            },

            async createAccount() {
                this.errors = [];

                if (this.username.length < 3) {
                    this.errors.push(this.$t("username_required"));
                }

                if (this.password.length < 5) {
                    this.errors.push(this.$t("password_weak"));
                }

                if (this.password !== this.challenge) {
                    this.errors.push(this.$t("password_mismatch"));
                }

                if (this.errors.length === 0) {
                    const response = await this.client.put("/auth", {
                        name: this.name,
                        admin: true,
                        username: this.username.toLowerCase(),
                        password: this.password
                    });

                    if (response.token) {
                        Cookies.set("token", response.token, this.$client.inactive_logoff || 30);

                        this.$router.push({
                            path: this.url
                        });
                    } else {
                        if (response.error) {
                            this.errors.push(response.error);
                        }
                    }
                }
            }
        }
    };
</script>

<style scoped>
    #login {
        flex: 1;
        padding: 0;
        display: flex;
        flex-direction: row;
        overflow: hidden;
    }

    #login .content {
        flex: 1;
        display: flex;
        flex-direction: row;
        align-content: center;
        align-items: center;
        justify-content: space-around;
        padding: 0 0 20% 0;
        background: var(--snapshot) no-repeat center center fixed;
        background-size: cover;
    }

    #login .create {
        padding: 0 0 10% 0;
    }

    #login .form {
        width: 100%;
        max-width: 420px;
        padding: 20px;
        background: var(--background);
        box-shadow: var(--elevation-large);
        border-radius: 3px;
    }

    #login .create .form {
        max-width: 520px;
    }

    #login .form .errors {
        padding: 0 0 5px 0;
        display: flex;
        flex-direction: column;
        font-size: 14px;
        color: var(--error-text);
    }

    #login .create .errors {
        padding: 0 0 20px 0;
    }

    #login .form h2 {
        margin: 0 0 15px 0;
        padding: 0;
        line-height: normal;
        font-size: 22px;
        color: var(--title-text);
        display: flex;
        align-content: center;
        align-items: center;
        user-select: none;
    }

    #login .form .logo {
        width: 27px;
        height: 27px;
        margin: 0 10px 0 0;
        user-select: none;
    }

    #login .form .field {
        display: flex;
        flex-direction: column;
        padding: 0 0 20px 0;
    }

    #login .form .field .title {
        font-weight: bold;
    }

    #login .form .field input {
        flex: 1;
        padding: 7px;
        font-size: 14px;
        background: var(--background);
        border: 1px var(--border) solid;
        border-radius: 5px;
    }

    #login .form .field input:focus {
        outline: 0 none;
        border-color: var(--primary);
    }

    #login .form .group .upper {
        display: flex;
        flex-direction: column;
        background: var(--input-background);
        padding: 10px 5px 5px 5px;
        border-top: 1px var(--border) solid;
        border-right: 1px var(--border) solid;
        border-bottom: 1px var(--border) solid;
        border-left: 1px var(--border) solid;
        border-radius: 3px 3px 0 0;
    }

    #login .form .group .upper:focus-within {
        background: var(--background-accent);
    }

    #login .form .group:focus-within .upper {
        border-top: 1px var(--title-text) solid;
        border-right: 1px var(--title-text) solid;
        border-left: 1px var(--title-text) solid;
    }

    #login .form .group .lower {
        display: flex;
        flex-direction: column;
        background: var(--input-background);
        padding: 10px 5px 5px 5px;
        border-right: 1px var(--border) solid;
        border-bottom: 1px var(--border) solid;
        border-left: 1px var(--border) solid;
        border-radius: 0 0 3px 3px;
    }

    #login .form .group .lower:focus-within {
        background: var(--background-accent);
    }

    #login .form .group:focus-within .lower {
        border-right: 1px var(--title-text) solid;
        border-bottom: 1px var(--title-text) solid;
        border-left: 1px var(--title-text) solid;
    }

    #login .form .group input {
        border: 0 none;
        outline: 0 none;
        background: transparent;
        color: var(--input-text);
        font-size: 15px;
        padding: 5px;
    }

    #login .form .group input:focus {
        border: 0 none;
        outline: 0 none;
    }

    #login .form .group .title {
        padding: 0 5px;
        font-size: 12px;
        user-select: none;
    }

    #login .form .actions {
        margin: 10px -10px 0 0;
        display: flex;
        justify-content: flex-end;
    }

    #login .form .remember {
        display: flex;
        align-content: center;
        align-items: center;
        padding: 7px 0 0 2px;
    }

    @media (min-width: 300px) and (max-width: 815px) {
        #login .content {
            align-content: unset;
            align-items: unset;
            padding: 0;
            background: var(--background);
        }

        #login .form {
            width: 100%;
            max-width: unset;
            box-shadow: unset;
            border-radius: unset;
        }
    }
</style>
