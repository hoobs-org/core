<template>
    <div id="login">
        <div v-if="init" class="content create">
            <div class="form">
                <h2>
                    <div class="logo">
                        <svg width="27" height="27" viewBox="0 0 80 80.92" xmlns="http://www.w3.org/2000/svg">
                            <rect class="logo-svg" x="1.25" y="1.25" width="77" height="78" rx="16.3" />
                            <path class="logo-svg-inner" d="M17,44.62a3.78,3.78,0,0,0,5.56-.13q4.63-4.53,9.24-9.08c2.33-2.3,4.68-4.59,7-6.91.85-.84,1.52-.78,2.37.08,5,5,10,10,15.07,15.05,1.44,1.43,1.42,1.65,0,3.13-1.71,1.75-1.88,1.77-3.32.36q-5.1-5-10.21-10c-2.16-2.11-4.18-2.1-6.32,0q-5,5.07-10.06,10.17c-2.28,2.32-2.27,4.37,0,6.72.45.46.89.94,1.38,1.35a3.87,3.87,0,0,0,5.68-.25C35.16,53.42,37,51.71,38.73,50c.67-.66,1.33-.85,2.05-.13,1.79,1.79,3.57,3.59,5.36,5.39a1,1,0,0,1,0,1.69c-2.24,2-3.86,4.68-6.68,6a2,2,0,0,0-1,2.41,1.89,1.89,0,0,0,1.76,1.56,1.78,1.78,0,0,0,2-1.17,8,8,0,0,1,2.13-2.82c1.36-1.38,2.76-2.72,4.08-4.14a3.85,3.85,0,0,0,0-5.52c-1.92-2-3.86-3.86-5.85-5.74a3.8,3.8,0,0,0-5.67.13c-1.78,1.73-3.59,3.43-5.34,5.18-.86.86-1.59.87-2.39,0-.29-.33-.61-.65-.93-1-.87-.81-.87-1.53,0-2.39q5-5,10-10.07c.91-.93,1.64-1,2.61-.06,3.08,3.09,6.25,6.1,9.34,9.19,3.55,3.54,4.92,3.55,8.44,0,2.26-2.3,2.29-4.31,0-6.58-3.44-3.44-6.92-6.84-10.36-10.27-1.87-1.86-3.68-3.78-5.56-5.61a3.66,3.66,0,0,0-5.53,0c-.93.89-1.91,1.74-2.82,2.64-4.38,4.33-8.62,8.8-13.12,13-1.45,1.34-1.66,1.38-3,0-.21-.21-.4-.44-.63-.63-1-.83-.88-1.56,0-2.47Q28,28.25,38.26,17.78a1.55,1.55,0,0,1,2.61,0c3.12,3,6.29,6,9.46,9.06.33.31.6,1,1.13.75s.22-.91.23-1.39c0-1.45,0-2.9.05-4.35.08-1.79,1.43-1.56,2.62-1.59s2.07.24,2.07,1.69c0,1.6,0,3.2,0,4.8h0c0,1.2.08,2.4,0,3.6A5.48,5.48,0,0,0,58.3,35c1.51,1.46,3.25,2.75,4.05,4.89a1.69,1.69,0,0,0,2,.91,2,2,0,0,0,1.72-1.65,1.81,1.81,0,0,0-.92-2.18c-2.07-.86-3.23-2.73-4.82-4.11a3,3,0,0,1-1-2.52c0-2.5,0-5,0-7.5,0-4.17-1.45-5.59-5.56-5.48a13,13,0,0,0-1.76.21A3.29,3.29,0,0,0,49.14,20c-.35,1.32-.8.93-1.45.3-1.6-1.56-3.23-3.08-4.82-4.64-2.33-2.28-4.34-2.28-6.66.06C29.71,22.3,23.31,29,16.69,35.39,12.44,39.52,13.34,41.28,17,44.62Z" />
                        </svg>
                    </div>
                    {{ $t("welcome") }}
                </h2>
                <p>
                    {{ $t("welcome_message_hoobs") }} {{ $t("setup_admin_account")}}
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
                    <div class="logo">
                        <svg width="27" height="27" viewBox="0 0 80 80.92" xmlns="http://www.w3.org/2000/svg">
                            <rect class="logo-svg" x="1.25" y="1.25" width="77" height="78" rx="16.3" />
                            <path class="logo-svg-inner" d="M17,44.62a3.78,3.78,0,0,0,5.56-.13q4.63-4.53,9.24-9.08c2.33-2.3,4.68-4.59,7-6.91.85-.84,1.52-.78,2.37.08,5,5,10,10,15.07,15.05,1.44,1.43,1.42,1.65,0,3.13-1.71,1.75-1.88,1.77-3.32.36q-5.1-5-10.21-10c-2.16-2.11-4.18-2.1-6.32,0q-5,5.07-10.06,10.17c-2.28,2.32-2.27,4.37,0,6.72.45.46.89.94,1.38,1.35a3.87,3.87,0,0,0,5.68-.25C35.16,53.42,37,51.71,38.73,50c.67-.66,1.33-.85,2.05-.13,1.79,1.79,3.57,3.59,5.36,5.39a1,1,0,0,1,0,1.69c-2.24,2-3.86,4.68-6.68,6a2,2,0,0,0-1,2.41,1.89,1.89,0,0,0,1.76,1.56,1.78,1.78,0,0,0,2-1.17,8,8,0,0,1,2.13-2.82c1.36-1.38,2.76-2.72,4.08-4.14a3.85,3.85,0,0,0,0-5.52c-1.92-2-3.86-3.86-5.85-5.74a3.8,3.8,0,0,0-5.67.13c-1.78,1.73-3.59,3.43-5.34,5.18-.86.86-1.59.87-2.39,0-.29-.33-.61-.65-.93-1-.87-.81-.87-1.53,0-2.39q5-5,10-10.07c.91-.93,1.64-1,2.61-.06,3.08,3.09,6.25,6.1,9.34,9.19,3.55,3.54,4.92,3.55,8.44,0,2.26-2.3,2.29-4.31,0-6.58-3.44-3.44-6.92-6.84-10.36-10.27-1.87-1.86-3.68-3.78-5.56-5.61a3.66,3.66,0,0,0-5.53,0c-.93.89-1.91,1.74-2.82,2.64-4.38,4.33-8.62,8.8-13.12,13-1.45,1.34-1.66,1.38-3,0-.21-.21-.4-.44-.63-.63-1-.83-.88-1.56,0-2.47Q28,28.25,38.26,17.78a1.55,1.55,0,0,1,2.61,0c3.12,3,6.29,6,9.46,9.06.33.31.6,1,1.13.75s.22-.91.23-1.39c0-1.45,0-2.9.05-4.35.08-1.79,1.43-1.56,2.62-1.59s2.07.24,2.07,1.69c0,1.6,0,3.2,0,4.8h0c0,1.2.08,2.4,0,3.6A5.48,5.48,0,0,0,58.3,35c1.51,1.46,3.25,2.75,4.05,4.89a1.69,1.69,0,0,0,2,.91,2,2,0,0,0,1.72-1.65,1.81,1.81,0,0,0-.92-2.18c-2.07-.86-3.23-2.73-4.82-4.11a3,3,0,0,1-1-2.52c0-2.5,0-5,0-7.5,0-4.17-1.45-5.59-5.56-5.48a13,13,0,0,0-1.76.21A3.29,3.29,0,0,0,49.14,20c-.35,1.32-.8.93-1.45.3-1.6-1.56-3.23-3.08-4.82-4.64-2.33-2.28-4.34-2.28-6.66.06C29.71,22.3,23.31,29,16.69,35.39,12.44,39.52,13.34,41.28,17,44.62Z" />
                        </svg>
                    </div>
                    {{ $t("log_in") }}
                </h2>
                <div v-if="errors.length > 0" class="errors">
                    <span v-for="(error, index) in errors" :key="index">{{ error }}</span>
                </div>
                <form autocomplete="false" class="group">
                    <div class="upper">
                        <label for="username" class="title">{{ $t("username") }}</label>
                        <input type="text" id="username" autocomplete="false" v-model="username" v-on:keyup.enter="login" :required="true" />
                    </div>
                    <div class="lower">
                        <label for="password" class="title">{{ $t("password") }}</label>
                        <input type="password" id="password" autocomplete="false" v-model="password" v-on:keyup.enter="login" :required="true" />
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
    import TextField from "@/components/text-field.vue";
    import PasswordField from "@/components/password-field.vue";

    import Cookies from "../cookies";

    export default {
        name: "login",

        components: {
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

                if (this.username === "" || this.username.length < 5) {
                    this.errors.push(this.$t("invalid_username_password"));
                }

                if (this.errors.length === 0) {
                    const response = await this.client.post("/auth", {
                        username: this.username,
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

                        this.username = "";
                        this.password = "";
                    }
                }
            },

            async createAccount() {
                this.errors = [];

                if (this.username === "" || this.username.length < 5) {
                    this.errors.push(this.$t("username_required"));
                }

                if (!this.strongPassword()) {
                    this.errors.push(this.$t("password_weak"));
                }

                if (this.password !== this.challenge) {
                    this.errors.push(this.$t("password_mismatch"));
                }

                if (this.errors.length === 0) {
                    const response = await this.client.put("/auth", {
                        name: this.name,
                        admin: true,
                        username: this.username,
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
            },

            strongPassword() {
                return (/(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%&*()]).{8,}/).test(this.password);
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

    #login .form .logo-svg {
        fill: var(--title-text);
    }

    #login .logo-svg-inner {
        fill: var(--background);
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

    @media (min-width: 300px) and (max-width: 815px) {
        #login .content {
            align-content: unset;
            align-items: unset;
            padding: 0;
            background: var(--background);
        }
    }
</style>
