import * as _ from "lodash";
import {
  js_beautify
} from "js-beautify";

import {
  writeFileSync
} from "fs";

import {
  EtoroAccountType,
  EtoroMarketExchange,
  etoroMarketExchange
} from "../components/exchanges/markets/etoro";
import {
  Order,
  ExchangeSide,
  OrderType,
  Symbol
} from "../components/exchanges";

export const etoroMarketTest = async () => {
  const etoro = await etoroMarketExchange();

  const results = await newOrder(etoro);
  // const results = await getExpertPortfolios(etoro);
  // const results = await getSymbolMapping(etoro);
  console.log(results);
};

async function newOrder(etoro: EtoroMarketExchange) {
  const order = new Order();
  order.price = 10000;
  order.amount = 200;
  order.leverage = 1;
  order.stopLoss = 20000;
  order.takeProfit = 0.01;
  order.side = ExchangeSide.SELL;
  order.type = OrderType.LIMIT;
  order.symbol = < Symbol > "BTC";
  return await etoro.newOrder(order);
}

async function getExpertPortfolios(etoro: EtoroMarketExchange) {
  return await etoro.getExpertPortfolios(7368036);
}

async function getSymbolMapping(etoro: EtoroMarketExchange) {
  const symbols = await etoro.getSymbolMapping();

  const symbolFromId = _.chain(symbols).keyBy("id").mapValues("symbol").value();
  const symbolToId = _.chain(symbols).keyBy("symbol").mapValues("id").value();

  const content = `export const symbolFromId = ${JSON.stringify(symbolFromId)};\n` +
    `export const symbolToId = ${JSON.stringify(symbolToId)};\n`;

  writeFileSync("./src/components/exchanges/markets/etoro/symbolMapping.ts", js_beautify(content, {
    indent_size: 2
  }));
}