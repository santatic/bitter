<template>
  <v-app id="inspire" dark>
    <v-navigation-drawer fixed clipped app v-model="drawer">
      <v-list dense>
        <template v-for="(item, i) in items">
          <v-list-tile v-bind:key="i" :to="{ name: item.url }">
            <v-list-tile-action>
              <v-icon>{{ item.icon }}</v-icon>
            </v-list-tile-action>
            <v-list-tile-content>
              <v-list-tile-title>
                {{ item.text }}
              </v-list-tile-title>
            </v-list-tile-content>
          </v-list-tile>
        </template>
      </v-list>
    </v-navigation-drawer>
    <v-toolbar color="green darken-3" dark app clipped-left fixed>
      <v-toolbar-title :style="$vuetify.breakpoint.smAndUp ? 'width: 300px; min-width: 250px' : 'min-width: 72px'" class="ml-0 pl-3">
        <v-toolbar-side-icon @click.stop="drawer = !drawer"></v-toolbar-side-icon>
        <span class="hidden-xs-only">Botcoin</span>
      </v-toolbar-title>
      <v-text-field light solo prepend-icon="search" placeholder="Search" style="max-width: 500px; min-width: 128px"></v-text-field>
      <div class="d-flex align-center" style="margin-left: auto">
        <v-btn icon>
          <v-icon>apps</v-icon>
        </v-btn>
        <v-btn icon>
          <v-icon>notifications</v-icon>
        </v-btn>
        <!-- <LoginForm></LoginForm> -->
      </div>
    </v-toolbar>
    <v-content>
      <v-container fluid fill-height>
        <v-layout justify-center>
          <router-view></router-view>
        </v-layout>
      </v-container>
    </v-content>
  </v-app>
</template>

<script>
  // import LoginForm from '@/components/LoginForm'

  export default {
    name: 'app',
    // components: {
    //   LoginForm
    // },
    data: () => ({
      drawer: null,
      items: [{
        icon: 'language',
        text: 'Market exchanges',
        url: 'MarketList'
      }, {
        icon: 'list',
        text: 'Orders',
        url: 'OrderList'
      }, {
        icon: 'timeline',
        text: 'Positions',
        url: 'PositionList'
      }, {
        icon: 'trending_up',
        text: 'Closing',
        url: 'StrategyCloseList'
      }]
    }),
    props: {
      source: String
    }
  }

</script>

<style>
  .primary--text.list__tile--active {
    color: rgb(151, 247, 27) !important;
  }

  .exchange.buy {
    font-weight: 500;
    border-left: 25px solid #4CAF50;
  }

  .exchange.sell {
    font-weight: 500;
    border-left: 25px solid #FF5252;
  }

</style>
