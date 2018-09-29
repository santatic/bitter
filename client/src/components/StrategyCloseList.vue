<template>
  <v-data-table :headers="headers" :pagination.sync="pagination" :items="items" dark>
    <template slot="items" slot-scope="props">
      <td :class="{ exchange: true, buy: isBuy(props.item), sell: isSell(props.item) }">{{ props.item.name }}</td>
      <td class="text-xs-right">{{ props.item.status }}</td>
      <td class="text-xs-right">{{ props.item.symbol }}</td>
      <td class="text-xs-right">{{ props.item.market }}</td>
      <td class="text-xs-right">{{ props.item.exchange }}</td>
      <td class="text-xs-right">{{ props.item.price }}</td>
      <td class="text-xs-right">{{ props.item.bestReachedPrice }}</td>
      <td class="text-xs-right">{{ props.item.amount }}</td>
      <td class="text-xs-right">{{ props.item.createdAt }}</td>
    </template>
    <template slot="no-data">
      <v-alert :value="true" color="success" icon="new_releases">
        Sorry, nothing to display here :(
      </v-alert>
    </template>
  </v-data-table>
</template>

<script>
  import {
    HTTP
  } from '@/apis/http'

  export default {
    name: 'StrategyCloseList',
    data: () => ({
      pagination: {
        sortBy: 'at',
        rowsPerPage: 25
      },
      checked: false,
      headers: [{
          text: 'Strategy',
          align: 'left',
          value: 'strategy'
        },
        {
          text: 'Status',
          value: 'status'
        },
        {
          text: 'Symbol',
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
          text: 'Best reached price',
          value: 'bestReachedPrice'
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
        HTTP.get(`/strategies/closers`)
          .then(response => {
            this.items = response.data.closers
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
      }
    },
    beforeMount() {
      this.getPositions()
    }
  }

</script>
