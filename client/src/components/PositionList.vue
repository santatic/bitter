<template>
  <v-layout>
    <v-data-table :headers="headers" :pagination.sync="pagination" :items="items" dark>
      <template slot="items" slot-scope="props">
        <td :class="{ exchange: true, buy: isBuy(props.item), sell: isSell(props.item) }" @click.stop="openDetailDialog(props.item)">{{ props.item.symbol }}</td>
        <td class="text-xs-right">{{ props.item.market }}</td>
        <td class="text-xs-right">{{ props.item.exchange }}</td>
        <td class="text-xs-right">{{ props.item.price }}</td>
        <td class="text-xs-right">{{ props.item.amount }}</td>
        <td class="text-xs-right">{{ props.item.createdAt }}</td>
      </template>
      <template slot="no-data">
        <v-alert :value="true" color="success" icon="new_releases">
          Sorry, nothing to display here :(
        </v-alert>
      </template>
    </v-data-table>
    <PositionDetail ref="detail"></PositionDetail>
  </v-layout>
</template>

<script>
  import {
    HTTP
  } from '@/apis/http'
  import PositionDetail from '@/components/PositionDetail'

  export default {
    name: 'PositionList',
    components: {
      PositionDetail
    },
    data: () => ({
      pagination: {
        sortBy: 'at',
        rowsPerPage: 25
      },
      checked: false,
      headers: [{
          text: 'Symbol',
          align: 'left',
          value: 'symbol'
        },
        {
          text: 'Market',
          value: 'market'
        },
        {
          text: 'Exchange',
          value: 'exchange'
        },
        {
          text: 'Price',
          value: 'price'
        },
        {
          text: 'Amount',
          value: 'amount'
        },
        {
          text: 'At',
          value: 'at'
        }
      ],
      items: []
    }),
    methods: {
      getPositions() {
        HTTP.get(`/exchanges/positions`)
          .then(response => {
            this.items = response.data.positions
          })
          .catch(e => {
            this.errors.push(e)
          })
      },
      isBuy(item) {
        return item.side === 'BUY'
      },
      isSell(item) {
        return item.side === 'SELL'
      },
      openDetailDialog(item) {
        this.$refs.detail.item = item
        this.$refs.detail.dialog = true
      }
    },
    beforeMount() {
      this.getPositions()
    }
  }

</script>
