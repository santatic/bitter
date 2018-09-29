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

export class OptionPingPongBallStrategy extends Strategy {
    private trend;

    getInformation() {
        return {
            name: "Option Ping-Pong Ball"
        };
    }

    protected defaultSetting() {
        return {
            params: {
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
            orderSide: ExchangeSide.BUY,
        };
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
            if (this.trend.orderSide === ExchangeSide.BUY) {
                this.trend.orderSide = ExchangeSide.SELL;
            } else {
                this.trend.orderSide = ExchangeSide.BUY;
            }
        }
        this.trend.isOrdering = false;
    }

    protected isAvailable() {
        if (this.candles.length < this.setting.warmup) return false;
        if (this.trend.isOrdering) return false;
        return true;
    }

    protected async onCandle(candle) {
        await this.pushAdvice(this.trend.orderSide);
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