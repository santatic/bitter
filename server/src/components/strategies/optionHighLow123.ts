import * as _ from "lodash";

import {
    Strategy,
    StrategySetting
} from "./base";
import {
    ExchangeSide,
    OrderType,
    IPosition,
    PositionStatus,
} from "../exchanges";

// https://www.forexstrategiesresources.com/binary-options-trading-strategies/14-binary-options-strategy-high-low-1-2-3-pattern-with-retracement/
// idea 1: ema5 > ema10 > ema50 -> rise up trend -> m5 practal -> m1 practal: -> expire 1m
// idea 1: m5 practal -> m1 practal: -> expire 1m
export class OptionHighLow123Strategy extends Strategy {
    private trend;

    getInformation() {
        return {
            name: "Option High/Low 123"
        };
    }

    protected defaultSetting() {
        return {
            params: {
                ema1: 5,
                ema2: 10,
                ema3: 50,

                expire: 1,
                lot: 1,
            }
        };
    }

    protected init() {
        this.trend = {
            isOrdering: false,
            loseLevel: 0,
            expectProfit: 0.9,
        };

        this.addIndicator("ema1", "ema", {
            period: this.setting.params.ema1
        });
        this.addIndicator("ema2", "ema", {
            period: this.setting.params.ema2
        });
        this.addIndicator("ema3", "ema", {
            period: this.setting.params.ema3
        });
    }

    protected async onPosition(position: IPosition) {
        if (position.status !== PositionStatus.CLOSED) return;

        if (position.profit > 0) {
            console.warn(`Position WIN ${position.profit}`);
            this.trend.expectProfit = Math.round(position.profit / position.amount * 100) / 100;
            this.trend.loseLevel = 0;
        } else if (position.profit < 0) {
            console.error(`Position LOOSE ${position.profit}`);
            this.trend.loseLevel += 1;
        }
        this.trend.isOrdering = false;
    }

    protected isAvailable() {
        if (this.candles.length < this.setting.warmup) return false;
        if (this.trend.isOrdering) return false;
        return true;
    }

    protected async onCandle(candle) {
        // const hour = new Date(this.candles[0].at).getHours();
        // if (hour < 11) return;

        // detect trend
        const ema1 = this.indicators.ema1.result.result[this.indicators.ema1.result.result.length - 1];
        const ema2 = this.indicators.ema2.result.result[this.indicators.ema2.result.result.length - 1];
        const ema3 = this.indicators.ema3.result.result[this.indicators.ema3.result.result.length - 1];

        // rise trend
        if (
            ema1 > ema2 &&
            ema2 > ema3 &&

            (ema1 - ema2 < 0.00003 ||
                ema1 - ema2 > 0.00007) &&

            this.isPractalBullUp()) {
            console.log("ema", ema1 - ema2, ema2 - ema3);
            await this.pushAdvice(ExchangeSide.BUY);
        }

        // fall trend
        if (
            ema1 < ema2 &&
            ema2 < ema3 &&

            (ema1 - ema2 > -0.00003 ||
                ema1 - ema2 < -0.00007) &&

            this.isPractalBearDown()) {
            console.log("ema", ema1 - ema2, ema2 - ema3);
            await this.pushAdvice(ExchangeSide.SELL);
        }
    }

    private async pushAdvice(side: ExchangeSide) {
        this.trend.isOrdering = true;
        const lot = this.getLotAmount();
        await this.advice(side, OrderType.BINARY_OPTION, lot, {
            expire: this.setting.params.expire
        });
    }


    private getLotAmount() {
        const initLot = this.setting.params.lot;
        const expectProfit = this.trend.expectProfit;

        let price = initLot;
        if (this.trend.loseLevel > 0) {
            const lastPrices = [initLot, initLot * expectProfit];
            // expect that level 2 will fix lose on level 0
            // and earn new profix of next trade
            if (this.trend.loseLevel >= 1) {
                lastPrices.push(initLot * expectProfit);
                const lastSum = _.sum(lastPrices);
                price = this.parsePrice(lastSum / expectProfit);
            }

            // try to get all lose back without profix
            // get back 80% loose
            if (this.trend.loseLevel >= 2) {
                lastPrices.push(price);
                const lastSum = _.sum(lastPrices);
                price = this.parsePrice(lastSum / expectProfit * 0.9);
            }

            // level 3 keep price on level 2
            // try to get 90% back
            // and lost 10%

            price = this.parsePrice(price * 0.9);

            // if lose to level 4
            // reset to level 0
            // give away the lose before
            if (this.trend.loseLevel > 3) {
                this.trend.loseLevel = 0;
                price = initLot;
            }
        }
        return price;
    }

    private parsePrice(price) {
        if (price < 1) {
            price = 1;
        }
        return Math.ceil(price * 100) / 100;
    }

    // detect practal indicator
    private isPractalBearDown(): boolean {
        if (this.candles.length >= 4 && // last 4 indicator
            this.candles[3].close > this.candles[3].open && // green
            this.candles[2].close > this.candles[2].open && // green
            this.candles[1].close < this.candles[1].open && // red
            this.candles[0].close < this.candles[0].open && // red

            // highest candle must higher than 2 candle before and last candle
            this.candles[2].close > this.candles[3].close &&
            // this.candles[1].close > this.candles[2].close &&
            this.candles[1].close > this.candles[0].close &&

            // highest candle must highest price than 3 others candle
            this.candles[1].high > this.candles[3].high &&
            this.candles[1].high > this.candles[2].high &&
            this.candles[1].high > this.candles[0].high &&

            // not fall to fast, to far
            this.candles[0].close > this.candles[2].open

            // last candle tail is not too long
            // this.candles[0].low - this.candles[0].close < this.candles[0].close - this.candles[0].open
        ) {
            return true;
        }
        return false;
    }

    private isPractalBullUp(): boolean {
        if (this.candles.length >= 4 && // last 4 indicator
            this.candles[3].close < this.candles[3].open && // red
            this.candles[2].close < this.candles[2].open && // red
            this.candles[1].close > this.candles[1].open && // green
            this.candles[0].close > this.candles[0].open && // green

            // lowest candle must lower than 2 candle before and last candle
            this.candles[2].close < this.candles[3].close &&
            // this.candles[1].close < this.candles[2].close &&
            this.candles[1].close < this.candles[0].close &&

            // lowest candle must lowest price than 3 others candle
            this.candles[1].low < this.candles[3].low &&
            this.candles[1].low < this.candles[2].low &&
            this.candles[1].low < this.candles[0].low &&

            // not rise to fast, to far
            this.candles[0].close < this.candles[2].open

            // last candle tail is not too long
            // this.candles[0].high - this.candles[0].close < this.candles[0].close - this.candles[0].open
        ) {
            return true;
        }
        return false;
    }
}