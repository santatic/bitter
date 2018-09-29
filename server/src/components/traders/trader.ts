import {
  notFound,
} from "boom";

import * as strategiesClass from "../strategies";
import {
  Strategy,
  StrategySetting
} from "../strategies/base";
import {
  TradingAdvisor
} from "./advisor";
import {
  IOrder,
  exchanger,
  IExchanger,
} from "../exchanges";
import {
  parseTimeFrameToSecond
} from "../../helpers/exchange";
import {
  BackTestExchanger,
  BackTestSetting
} from "../backtest/exchanger";


class Trader {
  private strategies: Array < Strategy > ;

  constructor() {
    this.strategies = [];
  }

  async addStrategy(name: string, setting: StrategySetting | BackTestSetting) {
    const exchanger = this.getExchanger(setting);
    const strategy = this.createStrategy(name, setting);
    const strategySetting = strategy.getSetting();

    // listen for strategy advice
    strategy.onAdvice(async (order: IOrder) => exchanger.newOrder(order));

    // set warmup candles
    const timeframeInSec = parseTimeFrameToSecond(setting.timeframe);
    const nowInSec = Math.round((setting instanceof BackTestSetting ? setting.sinceTime * 1000 : Date.now()) / 1000);
    let sinceInSec = nowInSec - (strategySetting.warmup * timeframeInSec);
    sinceInSec = sinceInSec - sinceInSec % timeframeInSec;

    console.debug(`Loading ${setting.exchange}:${setting.symbol}:${setting.timeframe} ` +
      `warm-up date since ${new Date(sinceInSec * 1000).toISOString()} to ${new Date(nowInSec * 1000).toISOString()}`);
    const candles = await exchanger.getCandles(setting.exchange, setting.symbol, setting.timeframe, sinceInSec, nowInSec);
    strategy.setWarmupCandles(candles);

    // listen for stream events
    if (strategySetting.event.onTicker) {
      exchanger.onTicker(
        setting.exchange,
        setting.symbol,
        setting.timeframe,
        (ticker) => {
          if (!ticker) {
            console.log(`Get invalid ticker`);
            return;
          }
          if (ticker.symbol !== setting.symbol) return;
          return strategy.pushTicker(ticker);
        });
    }
    if (strategySetting.event.onCandle) {
      exchanger.onCandle(
        setting.exchange,
        setting.symbol,
        setting.timeframe,
        (candle) => {
          if (!candle) {
            console.log(`Get invalid candle`);
            return;
          }
          if (candle.symbol !== setting.symbol) return;
          return strategy.pushCandle(candle);
        });
    }
    if (strategySetting.event.onOrder) {
      exchanger.onOrder(
        setting.exchange,
        setting.symbol,
        (order) => {
          if (!order) {
            console.log(`Get invalid order`);
            return;
          }
          if (order.symbol !== setting.symbol) return;
          return strategy.pushOrder(order);
        });
    }
    if (strategySetting.event.onPosition) {
      exchanger.onPosition(
        setting.exchange,
        setting.symbol,
        (position) => {
          if (!position) {
            console.log(`Get invalid position`);
            return;
          }
          if (position.symbol !== setting.symbol) return;
          return strategy.pushPosition(position);
        });
    }

    this.strategies.push(strategy);
  }

  private getExchanger(setting: StrategySetting | BackTestSetting): IExchanger {
    if (setting instanceof BackTestSetting) {
      return new BackTestExchanger(setting);
    }
    return exchanger;
  }

  private createStrategy(name: string, setting: StrategySetting): Strategy {
    const advisor = new TradingAdvisor(setting);
    const strategyClass = this.loadStrategyClass(name);
    const strategy = new strategyClass(setting, advisor);
    return strategy;
  }

  private loadStrategyClass(name) {
    const cls = strategiesClass[name];
    if (!cls) {
      throw notFound(`Strategy ${name} not found`);
    }
    return cls;
  }
}

export const trader = new Trader();