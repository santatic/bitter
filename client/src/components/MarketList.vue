<template>
  <v-container fluid grid-list-lg>
    <v-layout row wrap>
      <v-flex xs8 offset-sm2>
        <template v-for="item in items">
          <v-flex xs12 :key="item.id">
            <v-card color="blue-grey darken-2" class="white--text">
              <v-container fluid grid-list-lg>
                <v-layout @click.stop="addParams(item)" row>
                  <v-flex xs7>
                    <div>
                      <div class="headline">{{item.title}}</div>
                    </div>
                  </v-flex>
                  <v-flex xs5>
                    <v-card-media :src="item.logo" height="125px" contain></v-card-media>
                  </v-flex>
                </v-layout>
              </v-container>
            </v-card>
          </v-flex>
        </template>
      </v-flex>
    </v-layout>
    <v-dialog v-model="dialog" max-width="1000px">
      <v-form @submit.prevent="gotoOrder(item, symbol)">
        <v-card>
          <v-card-title>MARKET ORDER REQUIRE</v-card-title>
          <v-card-text>
            <v-text-field v-model="symbol" label="Symbol" dark required></v-text-field>
          </v-card-text>
          <v-card-actions>
            <v-btn color="white" flat dark @click.stop="dialog=false">Close</v-btn>
            <v-spacer></v-spacer>
            <v-btn color="primary" dark type="submit">Go</v-btn>
          </v-card-actions>
        </v-card>
      </v-form>
    </v-dialog>
  </v-container>
</template>

<script>
  export default {
    name: 'MarketList',
    data: () => ({
      dialog: false,
      item: null,
      symbol: null,
      symbols: [
        'BTC/USD',
        'ETH/USD',
        'XRP/USD'
      ],
      items: [{
          logo: '/static/logo/binance.png',
          title: 'Binance exchange',
          id: 'binance'
        }, {
          logo: '/static/logo/bittrex.png',
          title: 'Bittrex exchange',
          id: 'bittrex'
        },
        {
          logo: '/static/logo/bitfinex.png',
          title: 'Bitfinex exchange',
          id: 'bitfinex'
        }
      ]
    }),
    methods: {
      addParams(item) {
        if (item.id === 'binance') {
          this.item = item
          this.dialog = true
          return
        }
        this.gotoOrder(item)
      },
      gotoOrder(item, symbol) {
        this.$router.push({
          name: 'MarketOrderList',
          params: {
            market: item.id
          },
          query: {
            symbol
          }
        })
      }
    }
  }

</script>
