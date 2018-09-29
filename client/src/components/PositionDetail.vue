<template>
  <v-dialog v-model="dialog" max-width="900px">
    <v-card>
      <v-card-title>POSITION DETAIL</v-card-title>
      <v-card-text>
        <v-text-field label="Position" rows="15" :value="getBeautify()" textarea dark></v-text-field>
      </v-card-text>
      <v-card-actions>
        <v-btn color="white" flat dark @click.stop="dialog=false">Close</v-btn>
        <v-spacer></v-spacer>
        <v-btn color="primary" dark @click.stop="addStrategyCloser()">Add Strategy Closer</v-btn>
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
    name: 'PositionDetail',
    data: () => ({
      item: {},
      dialog: false
    }),
    methods: {
      getBeautify() {
        return JsBeautify(JSON.stringify(this.item))
      },
      addStrategyCloser() {
        HTTP.post(`/strategies/closers`, {
            positionId: this.item.id
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
