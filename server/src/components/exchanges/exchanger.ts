import * as WebSocket from "ws";
import * as Boom from "boom";

import {
    IOrder,
    TimeFrame,
    ICandle,
    IPosition,
    ITicker,
    Symbol,
    exchangeFactory,
    ExchangeName
} from ".";
import {
    EventEmitter
} from "events";
import {
    boomify
} from "boom";
import {
    MarketClosedError
} from "../../exceptions";

export abstract class HttpExchanger {
    protected api: any;
    protected listener: EventEmitter;

    constructor() {
        this.listener = new EventEmitter();
    }

    abstract init(): Promise < void > ;

    abstract newOrder(order: IOrder): Promise < IOrder > ;
    abstract cancelOrder(order: IOrder): Promise < boolean > ;
    abstract updateOrder(order: IOrder): Promise < IOrder > ;

    abstract getOrders(symbol ? : Symbol): Promise < IOrder[] > ;
    abstract getPositions(symbol ? : Symbol): Promise < IPosition[] > ;

    abstract getSymbols(): Promise < Symbol[] > ;
    abstract getCandles(symbol: Symbol, timeframe: TimeFrame, sinceInSec: number, toInSec: number): Promise < ICandle[] > ;
    abstract getTicker(symbol: Symbol): Promise < ITicker > ;
}

export abstract class WsExchanger extends HttpExchanger {
    protected ws: WebSocket;

    constructor() {
        super();
    }

    abstract hasTickerSubscriber(symbol: Symbol, timeframe: TimeFrame): boolean;
    abstract onTicker(symbol: Symbol, timeframe: TimeFrame, callback: (ticker: ITicker) => Promise < void > );
    abstract offTicker(symbol: Symbol, timeframe: TimeFrame, func ? ): Promise < boolean > ;

    abstract hasCandleSubscriber(symbol: Symbol, timeframe: TimeFrame): boolean;
    abstract onCandle(symbol: Symbol, timeframe: TimeFrame, callback: (candle: ICandle) => Promise < void > );
    abstract offCandle(symbol: Symbol, timeframe: TimeFrame, func ? ): Promise < boolean > ;

    abstract hasOrderSubscriber(symbol: Symbol);
    abstract onOrder(symbol: Symbol, callback: (order: IOrder) => Promise < void > );
    abstract offOrder(symbol: Symbol, func ? ): Promise < boolean > ;

    abstract hasPositionSubscriber(symbol: Symbol): boolean;
    abstract onPosition(symbol: Symbol, callback: (position: IPosition) => Promise < void > );
    abstract offPosition(symbol: Symbol, func ? ): Promise < boolean > ;
}


export interface IExchanger {
    newOrder(order: IOrder): Promise < IOrder > ;
    updateOrder(order: IOrder): Promise < IOrder > ;
    cancelOrder(order: IOrder): Promise < boolean > ;

    getOrders(userId: string, exchange: ExchangeName, symbol ? : Symbol): Promise < IOrder[] > ;
    getCandles(exchange: ExchangeName, symbol: Symbol, timeframe: TimeFrame, sinceInSec: number, toInSec: number): Promise < ICandle[] > ;

    onTicker(exchange: ExchangeName, symbol: Symbol, timeframe: TimeFrame, callback: (ticker: ITicker) => Promise < void > );
    offTicker(exchange: ExchangeName, symbol: Symbol, timeframe: TimeFrame): Promise < boolean > ;

    onCandle(exchange: ExchangeName, symbol: Symbol, timeframe: TimeFrame, callback: (candle: ICandle) => Promise < void > );
    offCandle(exchange: ExchangeName, symbol: Symbol, timeframe: TimeFrame): Promise < boolean > ;

    onOrder(exchange: ExchangeName, symbol: Symbol, callback: (order: IOrder) => Promise < void > );
    offOrder(exchange: ExchangeName, symbol: Symbol): Promise < boolean > ;

    onPosition(exchange: ExchangeName, symbol: Symbol, callback: (position: IPosition) => Promise < void > );
    offPosition(exchange: ExchangeName, symbol: Symbol): Promise < boolean > ;
}
class Exchanger implements IExchanger {
    private listener: EventEmitter;

    constructor() {
        this.listener = new EventEmitter();
    }

    private validateOrder(order: IOrder) {
        if (!order.exchange) {
            throw new Error("Order market is invalid");
        }
    }

    // Order
    async newOrder(order: IOrder): Promise < IOrder > {
        this.validateOrder(order);
        return exchangeFactory.getExchange(order.exchange)
            .then(exchanger => exchanger.newOrder(order));
    }

    updateOrder(order: IOrder): Promise < IOrder > {
        this.validateOrder(order);
        return exchangeFactory.getExchange(order.exchange)
            .then(exchanger => exchanger.updateOrder(order));
    }

    cancelOrder(order: IOrder): Promise < boolean > {
        this.validateOrder(order);
        return exchangeFactory.getExchange(order.exchange)
            .then(exchanger => exchanger.cancelOrder(order));
    }

    getOrders(userId: string, exchange: ExchangeName, symbol ? : Symbol): Promise < IOrder[] > {
        return exchangeFactory.getExchange(exchange)
            .then(exchanger => exchanger.getOrders(symbol));
    }

    getCandles(exchange: ExchangeName, symbol: Symbol, timeframe: TimeFrame, sinceInSec: number, toInSec: number): Promise < ICandle[] > {
        return exchangeFactory.getExchange(exchange)
            .then(exchanger => exchanger.getCandles(symbol, timeframe, sinceInSec, toInSec));
    }

    // event ticker
    private getTickerChannel(exchange: ExchangeName, symbol: Symbol, timeframe: TimeFrame): string {
        return `${exchange}:${symbol}:${timeframe}:TICKER`;
    }
    async onTicker(exchange: ExchangeName, symbol: Symbol, timeframe: TimeFrame, callback: (ticker: ITicker) => void) {
        const channel = this.getTickerChannel(exchange, symbol, timeframe);
        this.listener.on(channel, (ticker: ITicker) => callback(ticker));

        const exchanger = await exchangeFactory.getExchange(exchange);
        if (exchanger instanceof WsExchanger) {
            if (exchanger.hasTickerSubscriber(symbol, timeframe)) return;

            exchanger.onTicker(symbol, timeframe, async (data) => {
                this.listener.emit(channel, data);
            });
            return;
        }

        throw Boom.notImplemented(`Cannot listen ticker on ${exchange} exchanger`);
    }
    offTicker(exchange: ExchangeName, symbol: Symbol, timeframe: TimeFrame): Promise < boolean > {
        return Promise.resolve(true);
    }

    // event candle
    private getCandleChannel(market: ExchangeName, symbol: Symbol, timeframe: TimeFrame): string {
        return `${market}:${symbol}:${timeframe}:CANDLE`;
    }
    async onCandle(exchange: ExchangeName, symbol: Symbol, timeframe: TimeFrame, callback: (candle: ICandle) => Promise < void > ) {
        const channel = this.getCandleChannel(exchange, symbol, timeframe);
        this.listener.on(channel, (candle: ICandle) => callback(candle));

        const exchanger = await exchangeFactory.getExchange(exchange);
        if (exchanger instanceof WsExchanger) {
            if (exchanger.hasCandleSubscriber(symbol, timeframe)) return;

            exchanger.onCandle(symbol, timeframe, async (data) => {
                if (data instanceof MarketClosedError) {
                    exchanger.offCandle(symbol, timeframe);
                    return;
                }
                this.listener.emit(channel, data);
            });
            return;
        }

        throw Boom.notImplemented(`Cannot listen candle on ${exchange} exchanger`);
    }
    offCandle(exchange: ExchangeName, symbol: Symbol, timeframe: TimeFrame): Promise < boolean > {
        return Promise.resolve(true);
    }

    // event order
    private getOrderChannel(exchange: ExchangeName, symbol: Symbol): string {
        return `${exchange}:${symbol}:ORDER`;
    }
    async onOrder(exchange: ExchangeName, symbol: Symbol, callback: (order: IOrder) => Promise < void > ) {
        const channel = this.getOrderChannel(exchange, symbol);
        this.listener.on(channel, (order: IOrder) => callback(order));

        const exchanger = await exchangeFactory.getExchange(exchange);
        if (exchanger instanceof WsExchanger) {
            if (exchanger.hasOrderSubscriber(symbol)) return;

            exchanger.onOrder(symbol, async (data) => {
                this.listener.emit(channel, data);
            });
            return;
        }

        throw Boom.notImplemented(`Cannot listen order on ${exchange} exchanger`);
    }
    offOrder(exchange: ExchangeName, symbol: Symbol): Promise < boolean > {
        return Promise.resolve(true);
    }

    // event position
    private getPositionChannel(exchange: ExchangeName, symbol: Symbol): string {
        return `${exchange}:${symbol}:POSITION`;
    }
    async onPosition(exchange: ExchangeName, symbol: Symbol, callback: (position: IPosition) => Promise < void > ) {
        const channel = this.getPositionChannel(exchange, symbol);
        this.listener.on(channel, (position: IPosition) => callback(position));

        const exchanger = await exchangeFactory.getExchange(exchange);
        if (exchanger instanceof WsExchanger) {
            if (exchanger.hasPositionSubscriber(symbol)) return;

            exchanger.onPosition(symbol, async (data) => {
                this.listener.emit(channel, data);
            });
            return;
        }

        throw Boom.notImplemented(`Cannot listen position on ${exchange} exchanger`);
    }
    offPosition(exchange: ExchangeName, symbol: Symbol): Promise < boolean > {
        return Promise.resolve(true);
    }
}

export const exchanger = new Exchanger();