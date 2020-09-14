<!-------------------------------------------------------------------------------------------------
 | hoobs-core                                                                                     |
 | Copyright (C) 2020 HOOBS                                                                       |
 |                                                                                                |
 | This program is free software: you can redistribute it and/or modify                           |
 | it under the terms of the GNU General Public License as published by                           |
 | the Free Software Foundation, either version 3 of the License, or                              |
 | (at your option) any later version.                                                            |
 |                                                                                                |
 | This program is distributed in the hope that it will be useful,                                |
 | but WITHOUT ANY WARRANTY; without even the implied warranty of                                 |
 | MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the                                  |
 | GNU General Public License for more details.                                                   |
 |                                                                                                |
 | You should have received a copy of the GNU General Public License                              |
 | along with this program.  If not, see <http://www.gnu.org/licenses/>.                          |
 -------------------------------------------------------------------------------------------------->

<template>
    <div id="ring-login">
        <div v-if="errors.length > 0" class="errors">
            <div v-for="(error, index) in errors" :key="index">{{ error }}</div>
        </div>
        <div v-if="attemptingLogin">
            <p>Logging Into Ring...</p>
            <loading-marquee :height="3" color="--title-text" background="--title-text-dim" />
        </div>
        <div v-else-if="codeSentTo">
            <form autocomplete="false" v-on:submit.prevent="attemptLogin()">
                <integer-field name="VerificationCode" :description="'Please enter the code sent to ' + codeSentTo"
                               v-model="verificationCode" :required="true"/>
                <input type="submit" value="Verify Code" class="button button-primary"
                       v-bind:disabled="!verificationCode"/>
            </form>
        </div>
        <div v-else>
            <form autocomplete="false" v-on:submit.prevent="attemptLogin()">
                <text-field name="Ring Account Email" v-model="email" :required="true"/>
                <password-field name="Ring Account Password"
                                description="Your password will not be stored or sent to any third parties apart from ring.com"
                                v-model="password" :required="true"/>
                <input type="submit" value="Request Verification Code" class="button button-primary"
                       v-bind:disabled="!email || !password"/>
            </form>
        </div>
    </div>
</template>

<script>
  import TextField from '@/components/text-field.vue'
  import PasswordField from '@/components/password-field.vue'
  import IntegerField from '@/components/integer-field.vue'
  import LoadingMarquee from '@/components/loading-marquee'

  export default {
    name: 'ring-login',

    components: {
      'text-field': TextField,
      'password-field': PasswordField,
      'integer-field': IntegerField,
      'loading-marquee': LoadingMarquee
    },

    data () {
      return {
        email: '',
        password: '',
        verificationCode: '',
        attemptingLogin: false,
        codeSentTo: '',
        errors: []
      }
    },

    props: {
      value: Object,
      save: Function
    },

    computed: {},

    mounted () {
      this.email = ''
      this.password = ''
      this.verificationCode = ''
      this.attemptingLogin = false
      this.codeSentTo = ''
      this.errors = []
    },

    methods: {
      async attemptLogin () {
        this.errors = []
        this.attemptingLogin = true

        try {
          const response = await this.api.post(`/ring-login`, {
            email: this.email,
            password: this.password,
            verificationCode: this.verificationCode
          })

          if (response.error) {
            this.errors.push(response.error_description || response.error)
          } else if (response.refresh_token) {
            this.value.refreshToken = response.refresh_token
            this.save()
            return
          } else if (response.phone) {
            this.codeSentTo = response.phone
          } else {
            this.errors.push(response)
          }
        } catch (e) {
          this.errors.push('Login failed: ' + e.message)
          console.error(e)
        }

        this.attemptingLogin = false
      }
    }
  }
</script>

<style scoped>
    #ring-login .errors {
        padding-bottom: 5px;
        font-size: 14px;
        color: var(--error-text);
    }
</style>
