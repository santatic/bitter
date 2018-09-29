<template>
  <v-dialog v-model="dialog" max-width="900px">
    <v-card>
      <v-card-title>ORDER DETAIL</v-card-title>
      <v-card-text>
        <v-text-field label="Order" rows="15" v-model="content" :value="getBeautify()" textarea dark></v-text-field>
      </v-card-text>
      <v-card-actions>
        <v-btn color="white" flat dark @click.stop="dialog=false">Close</v-btn>
        <v-spacer></v-spacer>
        <v-btn color="primary" dark @click.stop="addPosition(content)">Add Position</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
  import JsBeautify from 'js-beautify'
  import {
    HTTP
  } from '@/apis/http'

  export default {
    name: 'OrderDetail',
    data: () => ({
      item: {},
      content: {},
      dialog: false
    }),
    methods: {
      getBeautify() {
        this.content = JsBeautify(JSON.stringify(this.item))
        return this.content
      },
      addPosition(content) {
        HTTP.post(`/exchanges/positions`, {
            order: JSON.parse(content)
          })
          .then(response => {
            this.dialog = false
          })
          .catch(e => {
            this.errors.push(e)
          })
      }
    }
  }

</script>
