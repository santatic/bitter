import * as _ from "lodash";
import * as Boom from "boom";

import {
    IExchanger,
    IOrder,
    ExchangeName,
    TimeFrame,
    ICandle,
    Symbol,
    IPosition,
    ITicker
} from "../exchanges";
import {
    BackTestPositioner,
    BackTestCandler
} from "./";
import {
    StrategySetting
} from "../strategies/base";


export class BackTestSetting extends StrategySetting {
    sinceTime: number;
    toTime: number;
    wallet: number;
    forceImport: boolean;
}

export class BackTestExchanger implements IExchanger {
    private setting: BackTestSetting;
    private candler: BackTestCandler;
    private positioner: BackTestPositioner;

    constructor(setting: BackTestSetting) {
        this.setting = setting;
        this.candler = new BackTestCandler(setting);
        this.positioner = new BackTestPositioner(setting);

        this.onStop();
    }

    newOrder(order: IOrder): Promise < IOrder > {
        return this.positioner.newOrder(order);
    }
    updateOrder(order: IOrder): Promise < IOrder > {
        return Promise.resolve(undefined);
    }
    cancelOrder(order: IOrder): Promise < boolean > {
        return Promise.resolve(undefined);
    }

    getOrders(userId: string, exchange: ExchangeName, symbol ? : Symbol): Promise < IOrder[] > {
        return Promise.resolve(undefined);
    }
    getCandles(exchange: ExchangeName, symbol: Symbol, timeframe: TimeFrame, sinceInSec: number, toInSec: number): Promise < ICandle[] > {
        return this.candler.getCandles(exchange, symbol, timeframe, sinceInSec, toInSec);
    }

    onTicker(exchange: ExchangeName, symbol: Symbol, timeframe: TimeFrame, callback: (ticker: ITicker) => Promise < void > ) {}
    offTicker(exchange: ExchangeName, symbol: Symbol, timeframe: TimeFrame): Promise < boolean > {
        return Promise.resolve(true);
    }

    onCandle(exchange: ExchangeName, symbol: Symbol, timeframe: TimeFrame, callback: (candle: ICandle) => Promise < void > ) {
        if (exchange !== this.setting.exchange || symbol !== this.setting.symbol) {
            throw Boom.preconditionFailed(`Conflict listen position of ${exchange}:${symbol}`, this.setting);
        }

        this.candler.onCandle(exchange, symbol, timeframe, async (candle: ICandle) => {
            await this.positioner.pushCandle(candle);
            await callback(candle);
        });
    }
    offCandle(exchange: ExchangeName, symbol: Symbol, timeframe: TimeFrame): Promise < boolean > {
        return Promise.resolve(true);
    }

    onOrder(exchange: ExchangeName, symbol: Symbol, callback: (order: IOrder) => Promise < void > ) {}
    offOrder(exchange: ExchangeName, symbol: Symbol): Promise < boolean > {
        return Promise.resolve(true);
    }

    onPosition(exchange: ExchangeName, symbol: Symbol, callback: (position: IPosition) => Promise < void > ) {
        if (exchange !== this.setting.exchange || symbol !== this.setting.symbol) {
            throw Boom.preconditionFailed(`Conflict listen position of ${exchange}:${symbol}`, this.setting);
        }
        this.positioner.onPosition(exchange, symbol, callback);
    }
    offPosition(exchange: ExchangeName, symbol: Symbol): Promise < boolean > {
        return Promise.resolve(true);
    }

    private onStop() {
        let closed = false;
        const stopFunc = () => {
            if (closed) return;
            closed = true;

            this.candler.stop();
            this.positioner.stop();
        };

        this.candler.onStop(stopFunc);
        this.positioner.onStop(stopFunc);
    }
}