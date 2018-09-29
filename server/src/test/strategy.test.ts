import * as _ from "lodash";

import {
    trader
} from "../components/traders/trader";
import {
    ExchangeName,
    Symbol,
    TimeFrame
} from "../components/exchanges";
import {
    StrategySetting
} from "../components/strategies/base";

export const strategyTest = () => {
    optionBBBreakoutStrategy();
};

function optionBBBreakoutStrategy() {
    let symbols;
    if (process.env.NODE_ENV === "production") {
        console.warn("Running prod env for OptionBBBreakoutStrategy strategy");
        symbols = [
            Symbol.EUR_USD,
            Symbol.GBP_USD,
            Symbol.EUR_AUD,
            Symbol.EUR_JPY,
            Symbol.USD_CAD,
            Symbol.USD_TRY,
            Symbol.USD_SEK,
            Symbol.USD_NOK,
            Symbol.USD_PLN,
            // Symbol.GBP_JPY,
            Symbol.AUD_USD,
            Symbol.AUD_CHF,
        ];

        _.each(symbols, async (symbol) => {
            const setting = new StrategySetting();
            setting.exchange = ExchangeName.IQOPTION;
            setting.symbol = symbol;
            setting.timeframe = TimeFrame.M1;
            setting.warmup = 50;
            setting.params = {
                bbands: {
                    period: 30,
                    deviation: 2.5,
                },
                expire: 1,
                lot: 1,
            };
            await trader.addStrategy("OptionBBBreakoutStrategy", setting);
        });
    } else {
        symbols = [
            Symbol.EUR_USD,
            Symbol.GBP_USD,
            Symbol.EUR_AUD,
            Symbol.EUR_CAD,
            Symbol.EUR_JPY,

            Symbol.USD_CAD,
            Symbol.USD_JPY,
            Symbol.USD_TRY,
            Symbol.USD_SEK,
            Symbol.USD_NOK,
            Symbol.USD_PLN,

            Symbol.NZD_JPY,
            Symbol.NZD_CAD,
            Symbol.CAD_CHF,
            Symbol.GBP_CAD,
            Symbol.GBP_JPY,
            Symbol.GBP_AUD,
            Symbol.AUD_USD,
            Symbol.AUD_CHF,
            Symbol.AUD_CAD,
            Symbol.AUD_JPY,
            Symbol.AUD_NZD,
        ];
        _.each(symbols, async (symbol) => {
            const setting = new StrategySetting();
            setting.exchange = ExchangeName.IQOPTION;
            setting.symbol = symbol;
            setting.timeframe = TimeFrame.M1;
            setting.warmup = 50;
            await trader.addStrategy("OptionBBBreakoutStrategy", setting);
        });
    }
}