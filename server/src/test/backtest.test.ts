import {
    trader
} from "../components/traders/trader";
import {
    ExchangeName,
    Symbol,
    TimeFrame
} from "../components/exchanges";
import {
    BackTestSetting
} from "../components/backtest/exchanger";

export function backtestTest() {
    // optionHighLow123();
    // optionPingPongBallStrategy();
    optionBBBreakoutStrategy();
}

function optionHighLow123() {
    const sinceInSec = Math.floor(new Date("2017-05-10T00:00:00Z").getTime() / 1000);
    const toInSec = Math.floor(new Date("2018-05-10T00:00:00Z").getTime() / 1000);

    const setting = new BackTestSetting();
    setting.exchange = ExchangeName.IQOPTION;
    setting.symbol = Symbol.EUR_USD;
    setting.timeframe = TimeFrame.M1;
    setting.warmup = 50;

    setting.wallet = 100;
    setting.sinceTime = sinceInSec;
    setting.toTime = toInSec;
    trader.addStrategy("OptionHighLow123Strategy", setting);
}

function optionPingPongBallStrategy() {
    const sinceInSec = Math.floor(new Date("2017-05-10T00:00:00Z").getTime() / 1000);
    const toInSec = Math.floor(new Date("2018-05-10T00:00:00Z").getTime() / 1000);

    const setting = new BackTestSetting();
    setting.exchange = ExchangeName.IQOPTION;
    setting.symbol = Symbol.EUR_USD;
    setting.timeframe = TimeFrame.M1;
    setting.warmup = 50;

    setting.wallet = 100;
    setting.sinceTime = sinceInSec;
    setting.toTime = toInSec;
    trader.addStrategy("OptionPingPongBallStrategy", setting);
}

function optionBBBreakoutStrategy() {
    // const sinceInSec = Math.floor(new Date("2014-05-10T00:00:00Z").getTime() / 1000);
    const sinceInSec = Math.floor(new Date("2016-05-10T00:00:00Z").getTime() / 1000);
    const toInSec = Math.floor(new Date("2018-05-10T00:00:00Z").getTime() / 1000);

    const setting = new BackTestSetting();
    setting.exchange = ExchangeName.IQOPTION;
    setting.symbol = Symbol.EUR_USD;
    // setting.symbol = Symbol.GBP_USD;
    // setting.symbol = Symbol.USD_JPY;
    // setting.symbol = Symbol.EUR_JPY;
    // setting.symbol = Symbol.USD_CHF;
    setting.symbol = Symbol.USD_TRY;
    setting.timeframe = TimeFrame.M1;
    setting.warmup = 50;

    setting.wallet = 100;
    setting.sinceTime = sinceInSec;
    setting.toTime = toInSec;
    // setting.forceImport = true;

    trader.addStrategy("OptionBBBreakoutStrategy", setting);
}