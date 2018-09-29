<template>
  <v-layout row justify-center>
    <v-dialog v-model="dialog" persistent max-width="500px">
      <v-btn color="red" slot="activator" dark>Login</v-btn>
      <v-card>
        <v-form @submit.prevent="login">
          <v-card-title>
            <span class="headline">Login Form</span>
          </v-card-title>
          <v-card-text>
            <v-container grid-list-md>
              <v-layout wrap>
                <v-text-field prepend-icon="mail" type="email" label="Email" v-model="email" required></v-text-field>
              </v-layout>
              <v-layout wrap>
                <v-text-field prepend-icon="fingerprint" type="password" label="Password" v-model="password" required></v-text-field>
              </v-layout>
            </v-container>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="white darken-1" dark flat @click.native="dialog = false">Close</v-btn>
            <v-btn color="primary" dark @click.native="dialog = false" type="submit">Login</v-btn>
          </v-card-actions>
        </v-form>
      </v-card>
    </v-dialog>
  </v-layout>
</template>

<script>
  import {
    HTTP
  } from '@/apis/http'

  export default {
    name: 'LoginForm',
    data() {
      return {
        dialog: false
      }
    },
    methods: {
      login() {
        HTTP.post(`/users/auth/login`, {
            username: this.email,
            password: this.password
          }, { withCredentials: true })
          .then(response => {
            this.posts = response.data
          })
          .catch(e => {
            this.errors.push(e)
          })
      }
    }
  }

</script>
