import * as _ from "lodash";
import * as Boom from "boom";
import * as Bluebird from "bluebird";

import * as tulipIndicators from "./indicators/tulipIndicators";
import {
    ICandle,
    ExchangeSide,
    ExchangeName,
    Symbol,
    IPosition,
    ITicker,
    IOrder,
    MarketDatatype,
    TimeFrame,
    Position,
    Order,
    OrderType
} from "../../exchanges";
import {
    TradingAdvisor
} from "../../traders/advisor";
import {
    parseTimeFrameToSecond
} from "../../../helpers/exchange";
import {
    BackTestSetting
} from "../../backtest/exchanger";

export interface IStrategyInfo {
    name: string;
    description ? : string;
}

export class StrategySetting {
    exchange: ExchangeName;
    symbol: Symbol;
    timeframe: TimeFrame;
    warmup ? : number;

    event ? : {
        onTicker: boolean,
        onCandle: boolean,
        onPosition: boolean,
        onOrder: boolean,
    };
    params ? : any;

    backtest ? : BackTestSetting;
}

export abstract class Strategy {
    protected setting: StrategySetting;
    private advisor: (order: IOrder) => Promise < IOrder > ;

    protected indicators: any;
    protected candles: Array < ICandle > ;
    private candlesList: {
        high: Array < number > ,
        low: Array < number > ,
        close: Array < number > ,
    };

    protected constructor(setting: any) {
        this.indicators = {};
        this.candles = [];
        this.candlesList = {
            high: [],
            low: [],
            close: []
        };

        this.setSetting(setting);
        this.init();

        console.info("Start strategy: ", this.getInformation());
    }

    getInformation(): IStrategyInfo {
        return {
            name: "Base strategy"
        };
    }

    getSetting(): StrategySetting {
        return this.setting;
    }

    private setSetting(setting) {
        this.setting = _.merge({
            event: {
                onTicker: false,
                onCandle: true,
                onPosition: true,
                onOrder: false,
            },
            warmup: 30,
        }, this.defaultSetting(), setting);
    }

    protected defaultSetting() {
        return {};
    }

    protected addIndicator(key: string, name: string, params: Object = {}) {
        if (this.indicators[key]) {
            throw Boom.preconditionFailed(`Indicator ${key} already existed`);
        }

        const indicator = tulipIndicators[name];
        if (!indicator) {
            throw Boom.notFound(`Indicator ${name} not found`);
        }

        this.indicators[key] = {
            name,
            params,
            execute: indicator.create(params)
        };
    }

    private async calculateIndicators(candle: ICandle) {
        await Bluebird.map(_.keys(this.indicators), async (key) => {
            const indicator = this.indicators[key];
            indicator.result = await indicator.execute(this.candlesList);
        }, {
            concurrency: 5
        });
    }

    // data input
    setWarmupCandles(candles: ICandle[]) {
        candles.forEach(candle => {
            this.candles.unshift(candle);
            this.candlesList.high.push(candle.high);
            this.candlesList.low.push(candle.low);
            this.candlesList.close.push(candle.close);
        });
    }
    async pushCandle(candle: ICandle) {
        // check persistence candle data

        if (this.candles.length > 0) {
            if (candle.at === this.candles[0].at) {
                this.candles[0] = candle;
            } else if (this.candles[0].at !== candle.at - parseTimeFrameToSecond(candle.timeframe) * 1000) {
                console.debug(`Candle ${candle.symbol}:${candle.timeframe} at ${new Date(candle.at).toISOString()} ` +
                    `is not persist with existed ${new Date(this.candles[0].at).toISOString()}`);
            }
        }

        // store and clean up candles
        this.candles.unshift(candle);
        this.candles = this.candles.slice(0, this.setting.warmup);

        // store candles lists for indicator calculate
        if (this.candlesList.high.length > this.setting.warmup) {
            this.candlesList.high.shift();
            this.candlesList.low.shift();
            this.candlesList.close.shift();
        }
        this.candlesList.high.push(candle.high);
        this.candlesList.low.push(candle.low);
        this.candlesList.close.push(candle.close);

        if (!this.isAvailable()) return;
        await this.calculateIndicators(candle);
        await this.onCandle(candle);
    }

    pushTicker = this.onTicker;
    pushPosition = this.onPosition;
    pushOrder = this.onOrder;

    protected async onTicker(ticker: ITicker) {}
    protected async onPosition(position: IPosition) {}
    protected async onOrder(order: IOrder) {}

    // advice action
    onAdvice(advicer: (order: IOrder) => Promise < IOrder > ) {
        this.advisor = advicer;
    }
    protected async advice(side: ExchangeSide, type: OrderType, amount: number, options ? : {
        price ? : number,
        leverage ? : number;
        stopLoss ? : number;
        trailingStop ? : boolean;
        takeProfit ? : number;
        expire ? : number; // expire minutes
        tag ? : Object;
    }) {
        const order = new Order();
        order.exchange = this.setting.exchange;
        order.symbol = this.setting.symbol;
        order.side = side;
        order.type = type;
        order.amount = amount;
        if (options) {
            if (options.price) order.price = options.price;
            if (options.leverage) order.leverage = options.leverage;
            if (options.stopLoss) order.stopLoss = options.stopLoss;
            if (options.trailingStop) order.trailingStop = options.trailingStop;
            if (options.takeProfit) order.takeProfit = options.takeProfit;
            if (options.expire) order.expire = options.expire;
            if (options.tag) order.tag = options.tag;
        }
        if (!order.amount) {
            throw Boom.preconditionRequired(`Order type ${type} amount (${amount}) is invalid`);
        }
        if (order.type === OrderType.LIMIT && !order.price) {
            throw Boom.preconditionRequired(`Order type ${type} requires option price value`);
        }
        if (order.type === OrderType.BINARY_OPTION) {
            if (!order.expire) {
                throw Boom.preconditionRequired(`Order type ${type} requires option expire time`);
            }
            if (order.expire <= 0) {
                throw Boom.preconditionRequired(`Order type ${type} requires expire time must > 0 in minutes`);
            }
            order.expire = order.expire * 60; // to secound
        }

        await this.advisor(order);
    }

    // implements
    protected isAvailable(): boolean {
        return true;
    }

    protected abstract async init();
    protected abstract async onCandle(candle: ICandle);
}