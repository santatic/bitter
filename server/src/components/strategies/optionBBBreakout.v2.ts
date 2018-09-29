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

// info: ======================================
// info: Amount: 	2525.4 	 152.54%
// info: Drawdown: 	364.40000000000146 	 13%
// info: WIN: 	379 	 58.22%
// info: LOSE: 	272 	 41.78%
// info: ======================================
export class OptionBBBreakoutStrategy extends Strategy {
    private trend;

    getInformation() {
        return {
            name: "Option BBands breakout"
        };
    }

    protected defaultSetting() {
        return {
            params: {
                bbands: {
                    period: 20,
                    deviation: 2.7,
                },
                expire: 1
            }
        };
    }

    protected init() {
        this.trend = {
            lot: 1,
            isOrdering: false,
            loseLevel: 0,
            expectProfit: 0.9,
        };
        this.addIndicator("bbands", "bbands", this.setting.params.bbands);
    }

    protected async onPosition(position: IPosition) {
        if (position.status !== PositionStatus.CLOSED) return;

        if (position.profit > 0) {
            console.warn(`Position ${position.side} ${position.symbol} WIN ${position.profit}`);
            this.trend.expectProfit = Math.round(position.profit / position.amount * 100) / 100;
            this.trend.loseLevel = 0;
        } else if (position.profit < 0) {
            console.error(`Position ${position.side} ${position.symbol} LOOSE ${position.profit}`);
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
        // rise trend
        const bbandsLower = this.indicators.bbands.result.lower[this.indicators.bbands.result.lower.length - 1];
        if (
            this.candles[2].close > this.candles[2].open && // green
            this.candles[1].close < this.candles[1].open && // red
            this.candles[0].close < this.candles[0].open && // red

            (this.candles[0].open - this.candles[0].close) / (this.candles[1].open - this.candles[1].close) > 6 &&
            (this.candles[0].close - this.candles[0].low) / (this.candles[0].open - this.candles[0].close) < 0.14 &&

            this.candles[0].close < bbandsLower // breakout
        ) {
            await this.pushAdvice(ExchangeSide.BUY);
            return;
        }

        // fall trend
        const bbandsUpper = this.indicators.bbands.result.upper[this.indicators.bbands.result.upper.length - 1];
        if (
            this.candles[2].close < this.candles[2].open && // red
            this.candles[1].close > this.candles[1].open && // green
            this.candles[0].close > this.candles[0].open && // green

            (this.candles[0].close - this.candles[0].open) / (this.candles[1].close - this.candles[1].open) > 6 &&
            (this.candles[0].high - this.candles[0].close) / (this.candles[0].close - this.candles[0].open) < 0.14 &&

            this.candles[0].close > bbandsUpper // breakout
        ) {
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
        const initLot = this.trend.lot;
        const expectProfit = this.trend.expectProfit;

        let price = initLot;

        const lastPrices = [initLot, initLot * expectProfit];
        // expect that level 2 will fix lose on level 0
        // and earn new profix of next trade
        if (this.trend.loseLevel >= 1) {
            lastPrices.push(initLot * expectProfit);
            const lastSum = _.sum(lastPrices);
            price = Math.ceil(lastSum / expectProfit);
        }

        // try to get all lose back without profix
        // get back 80% loose
        if (this.trend.loseLevel >= 2) {
            lastPrices.push(price * 0.8);
            const lastSum = _.sum(lastPrices);
            price = Math.ceil(lastSum / expectProfit);
        }

        // level 3 keep price on level 2
        // try to get 90% back
        // and lost 10%

        // if lose to level 4
        // reset to level 0
        // give away the lose before
        if (this.trend.loseLevel > 3) {
            this.trend.loseLevel = 0;
            price = initLot;
        }

        return price;
    }
}