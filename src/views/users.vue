<template>
    <div id="users">
        <div v-if="loaded" class="info">
            <div class="user-list">
                <div v-for="(item, index) in users" :key="index">
                    <div v-if="user.admin || (!user.admin && !item.admin)" class="user-link" @click="showUser(index)">{{ item.name || item.username }}</div>
                </div>
            </div>
            <div class="user-list-actions">
                <div class="button" @click="createUser()">{{ $t("add_user") }}</div>
            </div>
        </div>
        <div v-if="loaded" class="content">
            <form v-if="current !== undefined" autocomplete="false" class="form" method="post" action="/users" v-on:submit.prevent="save()">
                <input type="submit" class="hidden-submit" value="submit">
                <h2>{{ $t("id") }}</h2>
                <p>
                    {{ $t("id_message") }}
                </p>
                <div v-if="identityErrors.length > 0" class="errors">
                    <span v-for="(error, index) in identityErrors" :key="index">{{ error }}</span>
                </div>
                <text-field :name="$t('username')" v-model="username" :required="true" />
                <text-field :name="$t('name')" v-model="name" :required="true" />
                <div v-if="id !== user.id && id >= 0" class="action">
                    <div v-if="!confirm" class="button" @click="confirmDelete()">{{ $t("delete_user") }}</div>
                    <div v-if="confirm" class="button" @click="cancelDelete()">   {{ $t("cancel") }}   </div>
                    <div v-if="confirm" class="button button-warning" @click="deleteUser()">   {{ $t("delete") }}   </div>
                </div>
                <h2 v-if="user.admin && id !== user.id">{{ $t("permissions") }}</h2>
                <p v-if="user.admin && id !== user.id">
                    {{ $t("permissions_message") }}
                </p>
                <select-field v-if="user.admin && id !== user.id" :name="$t('user_type')" :options="options" v-model="admin" :required="true" />
                <h2>{{ $t("security") }}</h2>
                <p>
                    {{ $t("security_message") }}
                </p>
                <div v-if="passwordErrors.length > 0" class="errors">
                    <span v-for="(error, index) in passwordErrors" :key="index">{{ error }}</span>
                </div>
                <password-field :name="$t('password')" v-model="password" />
                <password-field :name="$t('reenter_password')" v-model="challenge" />
                <div class="action">
                    <div v-if="id >= 0" class="button button-primary" @click="save()">{{ $t("save_changes") }}</div>
                    <div v-else class="button button-primary" @click="save()">{{ $t("add_user") }}</div>
                </div>
            </form>
        </div>
    </div>
</template>

<script>
    import TextField from "@/components/text-field.vue";
    import PasswordField from "@/components/password-field.vue";
    import SelectField from "@/components/select-field.vue";

    export default {
        name: "users",

        components: {
            "text-field": TextField,
            "password-field": PasswordField,
            "select-field": SelectField
        },

        data() {
            return {
                users: [],
                loaded: false,
                id: -1,
                name: "",
                username: "",
                admin: false,
                password: "",
                challenge: "",
                confirm: false,
                current: undefined,
                identityErrors: [],
                passwordErrors: [],
                options: [{
                    text: this.$t("user"),
                    value: false
                },{
                    text: this.$t("administrator"),
                    value: true
                }]
            }
        },

        computed: {
            user() {
                return this.$store.state.user;
            }
        },

        async mounted() {
            this.users = await this.client.get("/users");

            if (this.user.admin && this.users.length > 0) {
                this.showUser(0);
            } else if (this.users.length > 0) {
                for (let i = 0; i < this.users.length; i++) {
                    if (!this.users[i].admin) {
                        this.showUser(i);
                    }
                }
            }

            this.loaded = true;
        },

        methods: {
            showUser(index) {
                this.identityErrors = [];
                this.passwordErrors = [];

                this.id = this.users[index].id;
                this.name = this.users[index].name;
                this.username = this.users[index].username;
                this.admin = this.users[index].admin;
                this.password = "";
                this.challenge = "";

                this.confirm = false;
                this.current = index;
            },

            createUser() {
                this.identityErrors = [];
                this.passwordErrors = [];

                this.id = -1;
                this.name = "";
                this.username = "";
                this.admin = false;
                this.password = "";
                this.challenge = "";

                this.confirm = false;
                this.current = -1;
            },

            confirmDelete() {
                this.confirm = true;
            },

            cancelDelete() {
                this.confirm = false;
            },

            async deleteUser() {
                if ((await this.client.delete(`/user/${this.id}`)).success) {
                    this.users = await this.client.get("/users");

                    if (this.users.length === 0) {
                        this.current = undefined;
                    } else if (this.current >= this.users.length) {
                        this.showUser(this.users.length - 1);
                    } else {
                        this.showUser(this.current);
                    }
                };
            },

            async save() {
                if (this.id >= 0) {
                    await this.saveUser();
                } else {
                    await this.addUser();
                }
            },

            async addUser() {
                this.identityErrors = [];
                this.passwordErrors = [];

                if (this.username === "" || this.username.length < 5) {
                    this.identityErrors.push(this.$t("username_required"));
                }

                if (this.name === "") {
                    this.name = this.username;
                }

                if (!this.strongPassword()) {
                    this.passwordErrors.push(this.$t("password_weak"));
                }

                if (this.password !== this.challenge) {
                    this.passwordErrors.push(this.$t("password_mismatch"));
                }

                if (this.identityErrors.length === 0 && this.passwordErrors.length === 0) {
                    this.current = undefined;

                    await this.client.put("/users", {
                        name: this.name,
                        username: this.username,
                        password: this.password,
                        admin: this.admin
                    });

                    this.users = await this.client.get("/users");
                    this.showUser(this.users.length - 1);
                }
            },

            async saveUser() {
                const current = this.current;

                this.identityErrors = [];
                this.passwordErrors = [];

                if (this.username === "" || this.username.length < 5) {
                    this.identityErrors.push(this.$t("username_required"));
                }

                if (this.name === "") {
                    this.name = this.username;
                }

                if ((this.password !== "" || this.challenge !== "") && !this.strongPassword()) {
                    this.passwordErrors.push(this.$t("password_weak"));
                }

                if ((this.password !== "" || this.challenge !== "") && this.password !== this.challenge) {
                    this.passwordErrors.push(this.$t("password_mismatch"));
                }

                if (this.identityErrors.length === 0 && this.passwordErrors.length === 0) {
                    this.current = undefined;

                    if ((await this.client.post(`/user/${this.id}`, {
                        name: this.name,
                        username: this.username,
                        password: this.password !== "" ? this.password : null,
                        admin: this.admin
                    })).success) {
                        if (this.id === this.user.id) {
                            window.location.href = "/login";
                        } else {
                            this.users = await this.client.get("/users");
                            this.showUser(current);
                        }
                    }
                }
            },

            strongPassword() {
                return (/(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%&*()]).{8,}/).test(this.password);
            }
        }
    }
</script>

<style scoped>
    #users {
        flex: 1;
        padding: 0;
        display: flex;
        overflow: hidden;
    }

    #users .info {
        width: 210px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        overflow: auto;
    }

    #users .info .user-list {
        padding: 20px 0 20px 20px;
    }

    #users .info .user-list-actions {
        padding: 0 0 20px 20px;
    }

    #users .info .user-link {
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

    #users .info .user-link:hover {
        color: var(--text-dark);
    }

    #users .content {
        flex: 1;
        padding: 20px;
        display: flex;
        flex-direction: column;
        overflow: auto;
    }

    #users .content .form {
        width: 100%;
        max-width: 780px;
    }

    #users .form .errors {
        margin: 0 0 20px 0;
        display: flex;
        flex-direction: column;
        font-size: 14px;
        color: var(--error-text);
    }

    #users .form h2 {
        margin: 20px 0 5px 0;
        padding: 0;
        line-height: normal;
        font-size: 22px;
        color: var(--title-text);
    }

    #users .form h2:first-child {
        margin: 0 0 5px 0;
    }

    #users .form p {
        margin: 0 0 20px 0;
    }

    #users .form .field {
        display: flex;
        flex-direction: column;
        padding: 0 0 20px 0;
    }

    #users .form .field .title {
        font-weight: bold;
    }

    #users .form .field .description {
        font-size: 12px;
    }

    #users .form .field input,
    #users .form .field select {
        padding: 7px !important;
        height: 33px !important;
        font-size: 14px !important;
        background: var(--input-background);
        color: var(--input-text);
        border: 1px var(--border) solid;
        border-radius: 5px;
    }

    #users .form .field input {
        flex: 1;
    }

    #users .form .field input:focus,
    #users .form .field select:focus {
        outline: 0 none;
        border-color: var(--title-text);
    }

    #users .form .action {
        padding: 0 0 20px 0;
    }
</style>
