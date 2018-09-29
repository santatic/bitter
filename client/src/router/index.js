import Vue from 'vue'
import Router from 'vue-router'
import MarketList from '@/components/MarketList'
import PositionList from '@/components/PositionList'
import OrderList from '@/components/OrderList'
import StrategyCloseList from '@/components/StrategyCloseList'

Vue.use(Router)

export default new Router({
  routes: [{
    path: '/',
    redirect: '/markets'
  }, {
    path: '/markets',
    name: 'MarketList',
    component: MarketList
  }, {
    path: '/exchanges/:market/orders',
    name: 'MarketOrderList',
    component: OrderList
  }, {
    path: '/exchanges/positions',
    name: 'PositionList',
    component: PositionList
  }, {
    path: '/exchanges/orders',
    name: 'OrderList',
    component: OrderList
  }, {
    path: '/strategies/closes',
    name: 'StrategyCloseList',
    component: StrategyCloseList
  }]
})
