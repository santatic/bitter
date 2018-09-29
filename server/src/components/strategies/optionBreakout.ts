import * as _ from "lodash";

import {
    Strategy
} from "./base";
import {
    ExchangeSide,
    OrderType,
    IPosition,
    PositionStatus
} from "../exchanges";

export class OptionBreakoutStrategy extends Strategy {
    private trend;

    getInformation() {
        return {
            name: "Option Breakout"
        };
    }

    protected defaultSetting() {
        return {
            params: {
                period: 20,
                expire: 2
            }
        };
    }

    protected async init() {
        this.trend = {
            lot: 1,
            isOrdering: false,
            martingale: 0,
            expectProfit: 0.9,
        };
    }

    protected async onPosition(position: IPosition) {
        if (position.status !== PositionStatus.CLOSED) return;

        if (position.profit > 0) {
            console.warn(`Position WIN ${position.profit}`);
            this.trend.expectProfit = Math.round(position.profit / position.amount * 100) / 100;
            this.trend.martingale = 0;
        } else if (position.profit < 0) {
            console.error(`Position LOOSE ${position.profit}`);
            this.trend.martingale += 1;
        }
        this.trend.isOrdering = false;
    }

    protected async onCandle(candle) {
        if (this.candles.length < this.setting.params.period) {
            console.debug(`Candle data is not enough`);
            return;
        }
        if (this.trend.isOrdering) return;

        const oldPoints = _.reduce(this.candles.slice(1, 1 + this.setting.params.period), (result, candle) => {
            result.push(candle.open);
            result.push(candle.close);
            return result;
        }, []);
        const oldMax = _.max(oldPoints);
        const oldMin = _.min(oldPoints);

        if (candle.open < candle.close && // green
            candle.close > oldMax) {

            await this.pushAdvice(ExchangeSide.BUY);
        } else if (candle.open > candle.close && // red
            candle.close < oldMin) {

            await this.pushAdvice(ExchangeSide.SELL);
        }
    }

    private async pushAdvice(side: ExchangeSide) {
        this.trend.isOrdering = true;
        const lot = this.getLotMartingale(this.trend.martingale, this.trend.lot, this.trend.expectProfit);
        await this.advice(side, OrderType.BINARY_OPTION, lot, {
            expire: this.setting.params.expire
        });
    }

    private getLotMartingale(martingale: number, initLot: number, expectProfit: number) {
        let price = initLot;
        if (martingale > 0) {
            const lastPrices = [initLot * expectProfit, price];
            for (let i = 0; i < martingale; i++) {
                const lastLose = _.sum(lastPrices);
                price = Math.ceil(lastLose / expectProfit);
                lastPrices.push(price);
            }
        }
        return price;
    }
}