import * as _ from "lodash";

import {
    IPosition,
    ExchangeName,
    Symbol,
    ICandle,
    IOrder,
    OrderType,
    Position,
    PositionStatus,
    ExchangeSide
} from "../exchanges";
import {
    BackTestSetting
} from "./exchanger";
import {
    parseTimeFrameToSecond
} from "../../helpers/exchange";
import {
    BackTestWallet
} from ".";

export class BackTestPositioner {
    private orders: IOrder[];
    private setting: BackTestSetting;
    private currentCandle: ICandle;
    private wallet: BackTestWallet;
    private timeframeInSec: number;

    private onPositionCallback: (position: IPosition) => Promise < void > ;
    private onStopCallback: () => void;

    constructor(setting: BackTestSetting) {
        this.setting = setting;
        this.orders = [];

        this.timeframeInSec = parseTimeFrameToSecond(this.setting.timeframe);
        this.wallet = new BackTestWallet(setting.wallet);
    }

    async pushCandle(candle: ICandle) {
        this.currentCandle = candle;
        await this.checkPositions(candle);
    }

    async newOrder(order: IOrder) {
        const amount = this.wallet.getAmount(order.amount);
        if (amount === 0) {
            console.debug(`Backtest wallet is not enough`);
            this.onStopCallback();
            return;
        }

        // new order create at the end of candle time
        order.price = this.currentCandle.close;
        order.createdAt = new Date(this.currentCandle.at + this.timeframeInSec * 1000);

        console.debug(`Backtest new ${order.side} order: ${order.amount}, price: ${order.price}, at: ${order.createdAt.toISOString()}`);
        this.orders.push(order);
        return Promise.resolve(order);
    }

    async onPosition(exchange: ExchangeName, symbol: Symbol, callback: (position: IPosition) => Promise < void > ) {
        this.onPositionCallback = callback;
    }

    private async checkPositions(candle: ICandle) {
        if (this.orders.length === 0) return;

        const orders = [];
        while (this.orders.length > 0) {
            const order = this.orders.shift();
            const position = this.checkOrder(candle, order);
            if (position) {
                console.debug(`Backtest new ${position.side} position amount: ${position.amount}, price: ${position.price}, profit: ${position.profit}, at: ${position.createdAt.toISOString()}`);
                await this.onPositionCallback(position);
                return;
            }
            orders.push(order);
        }
        this.orders.push(...orders);
    }
    private checkOrder(candle: ICandle, order: IOrder) {
        if (order.type === OrderType.BINARY_OPTION) {
            const expireAt = order.createdAt.getTime() + order.expire * 1000;

            const candleEndAt = candle.at + this.timeframeInSec * 1000;
            if (expireAt <= candleEndAt) {
                if (expireAt - candleEndAt > order.expire * 1000) {
                    console.error(`Backtest position close exceed expire time`, new Date(expireAt).toISOString(), new Date(candleEndAt).toISOString());
                }

                const position = new Position();
                position.status = PositionStatus.CLOSED;
                position.exchange = order.exchange;
                position.symbol = order.symbol;
                position.amount = order.amount;
                position.price = order.price;
                position.close = candle.close;
                position.side = order.side;
                position.createdAt = new Date(candleEndAt);

                if ((order.side === ExchangeSide.BUY && position.close > position.price) ||
                    (order.side === ExchangeSide.SELL && position.close < position.price)) {
                    position.profit = Math.round(order.amount * 0.8 * 100) / 100;
                } else if ((order.side === ExchangeSide.BUY && position.close < position.price) ||
                    (order.side === ExchangeSide.SELL && position.close > position.price)) {
                    position.profit = -order.amount;
                } else {
                    position.profit = 0;
                }

                this.wallet.setAmount(position);
                return position;
            }
        }
    }

    onStop(callback: () => void) {
        this.onStopCallback = callback;
    }
    stop() {
        this.wallet.print();
    }
}