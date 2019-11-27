<template>
    <div id="profile">
        <div class="content">
            <form autocomplete="false" class="form" method="post" action="/profile" v-on:submit.prevent="saveUser()">
                <input type="submit" class="hidden-submit" value="submit">
                <h2>{{ $t("id") }}</h2>
                <p>
                    {{ $t("id_message") }}
                </p>
                <text-field :name="$t('name')" v-model="name" :required="true" />
                <h2>{{ $t("security") }}</h2>
                <p>
                    {{ $t("security_message") }}
                </p>
                <div v-if="errors.length > 0" class="errors">
                    <span v-for="(error, index) in errors" :key="index">{{ error }}</span>
                </div>
                <password-field :name="$t('password')" v-model="password" />
                <password-field :name="$t('reenter_password')" v-model="challenge" />
                <div class="action">
                    <div class="button button-primary" @click="saveUser()">{{ $t("save_changes") }}</div>
                </div>
            </form>
        </div>
    </div>
</template>

<script>
    import TextField from "@/components/text-field.vue";
    import PasswordField from "@/components/password-field.vue";

    export default {
        name: "profile",

        components: {
            "text-field": TextField,
            "password-field": PasswordField
        },

        data() {
            return {
                id: -1,
                name: "",
                username: "",
                admin: false,
                password: "",
                challenge: "",
                errors: []
            }
        },

        computed: {
            user() {
                return this.$store.state.user;
            }
        },

        async mounted() {
            this.errors = [];

            this.id = this.user.id;
            this.name = this.user.name;
            this.username = this.user.username;
            this.admin = this.user.admin;
            this.password = "";
            this.challenge = "";
        },

        methods: {
            async saveUser() {
                this.errors = [];

                if (this.name === "") {
                    this.name = this.username;
                }

                if ((this.password !== "" || this.challenge !== "") && this.password.length < 5) {
                    this.errors.push(this.$t("password_weak"));
                }

                if ((this.password !== "" || this.challenge !== "") && this.password !== this.challenge) {
                    this.errors.push(this.$t("password_mismatch"));
                }

                if (this.errors.length === 0) {
                    if ((await this.api.post(`/user/${this.id}`, {
                        name: this.name,
                        username: this.username,
                        password: this.password !== "" ? this.password : null,
                        admin: this.admin
                    })).success) {
                        this.$router.push({
                            path: "/login",
                            query: {
                                url: "/profile"
                            }
                        });
                    }
                }
            }
        }
    }
</script>

<style scoped>
    #profile {
        flex: 1;
        padding: 0;
        display: flex;
        overflow: hidden;
    }

    #profile .info {
        width: 250px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        overflow: auto;
    }

    #profile .info .user-list {
        padding: 20px 0 20px 20px;
    }

    #profile .info .user-list-actions {
        padding: 0 0 20px 20px;
    }

    #profile .info .user-link {
        padding: 10px;
        border-bottom: 1px var(--border) solid;
        color: var(--text);
        text-decoration: none;
        display: flex;
        align-content: center;
        align-items: center;
        cursor: pointer;
        user-select: none;
    }

    #profile .info .user-link:hover {
        color: var(--text-dark);
    }

    #profile .content {
        flex: 1;
        padding: 20px;
        display: flex;
        flex-direction: column;
        overflow: auto;
    }

    #profile .content .form {
        width: 100%;
        max-width: 780px;
    }

    #profile .form .errors {
        margin: 0 0 20px 0;
        display: flex;
        flex-direction: column;
        font-size: 14px;
        color: var(--error-text);
    }

    #profile .form h2 {
        margin: 20px 0 5px 0;
        padding: 0;
        line-height: normal;
        font-size: 22px;
        color: var(--title-text);
    }

    #profile .form h2:first-child {
        margin: 0 0 5px 0;
    }

    #profile .form p {
        margin: 0 0 20px 0;
    }

    #profile .form .field {
        display: flex;
        flex-direction: column;
        padding: 0 0 20px 0;
    }

    #profile .form .field .title {
        font-weight: bold;
    }

    #profile .form .field .description {
        font-size: 12px;
    }

    #profile .form .field input,
    #profile .form .field select {
        padding: 7px !important;
        height: 33px !important;
        font-size: 14px !important;
        background: var(--input-background);
        color: var(--input-text);
        border: 1px var(--border) solid;
        border-radius: 5px;
    }

    #profile .form .field input {
        flex: 1;
    }

    #profile .form .field input:focus,
    #profile .form .field select:focus {
        outline: 0 none;
        border-color: var(--title-text);
    }

    #profile .form .action {
        padding: 0 0 20px 0;
    }
</style>
