import * as Boom from "boom";
import * as _ from "lodash";

import {
    ICandle,
    ExchangeName,
    Symbol,
    TimeFrame,
    Candle
} from "../exchanges";
import {
    BackTestSetting
} from "./exchanger";
import {
    candleImporter
} from "./importer";
import {
    parseTimeFrameToSecond
} from "../../helpers";
import {
    reject
} from "bluebird";

export class BackTestCandler {
    private candles: ICandle[];
    private setting: BackTestSetting;
    private currentTime: number;

    private onCandleCallback: (candle: ICandle) => Promise < void > ;
    private onStopCallback: () => void;

    constructor(setting: BackTestSetting) {
        this.setting = setting;
        this.candles = [];

        this.currentTime = this.setting.sinceTime;
        this.start();
    }

    start = _.once(async () => {

        if (this.candles.length === 0 && !this.setting.forceImport) {
            await this.loadMoreCandles();
        }

        if (this.candles.length === 0) {
            const timeframeInSec = parseTimeFrameToSecond(this.setting.timeframe);
            const startTime = this.setting.sinceTime - this.setting.warmup * timeframeInSec;

            console.debug(`Backtest import ${this.setting.exchange}:${this.setting.symbol}:${this.setting.timeframe} ` +
                `candles since ${new Date(startTime * 1000).toISOString()} to ${new Date(this.setting.toTime * 1000).toISOString()} is empty`);

            await candleImporter.import(this.setting.exchange, this.setting.symbol, startTime, this.setting.toTime, this.setting.timeframe);
            await this.loadMoreCandles();
        }

        _.delay(() => this.pushNext(), 1000);
    });

    private async pushNext() {
        while (this.candles.length > 0) {
            const candle = this.candles.shift();
            await this.onCandleCallback(candle);

            if (this.candles.length === 0) {
                if (this.currentTime >= this.setting.toTime) {
                    console.log(`Backtest ${this.setting.exchange}:${this.setting.symbol}:${this.setting.timeframe} ` +
                        `push candle completed`, this.setting);
                    this.onStopCallback();
                    return;
                }
                await this.loadMoreCandles();
                if (this.candles.length === 0) {
                    console.log(`Backtest ${this.setting.exchange}:${this.setting.symbol}:${this.setting.timeframe} ` +
                        `push candle completed`, this.setting);
                    this.onStopCallback();
                    return;
                }
            }
        }
    }

    private async loadMoreCandles() {
        const candles = await Candle.find({
                exchange: this.setting.exchange,
                symbol: this.setting.symbol,
                timeframe: this.setting.timeframe,
                at: {
                    $gte: this.currentTime * 1000,
                    $lte: this.setting.toTime * 1000
                }
            })
            .limit(1000)
            .sort({
                at: 1
            });

        if (candles.length === 0) {
            console.debug(`Backtest candles data in time ${new Date(this.currentTime * 1000).toISOString()} ` +
                `to ${new Date(this.setting.toTime * 1000).toISOString()} not found`);
        } else {
            const timeframeInSec = parseTimeFrameToSecond(this.setting.timeframe);
            this.currentTime = Math.round(candles[candles.length - 1].at / 1000) + timeframeInSec;
            this.candles.push(...candles);
        }
    }

    async onCandle(exchange: ExchangeName, symbol: Symbol, timeframe: TimeFrame, callback: (candle: ICandle) => Promise < void > ) {
        this.onCandleCallback = callback;
    }

    async getCandles(exchange: ExchangeName, symbol: Symbol, timeframe: TimeFrame, sinceInSec: number, toInSec: number): Promise < ICandle[] > {
        await this.start();

        console.debug(`Backtest ${exchange}:${symbol}:${timeframe} get candles since ` +
            `${new Date(sinceInSec * 1000).toISOString()} to ${new Date(toInSec * 1000).toISOString()}`);
        const candles = await Candle.find({
                exchange: this.setting.exchange,
                symbol: this.setting.symbol,
                timeframe: this.setting.timeframe,
                at: {
                    $gte: sinceInSec * 1000,
                    $lte: toInSec * 1000,
                }
            })
            .sort({
                at: 1
            });

        if (candles.length === 0) {
            console.debug(`Backtest ${exchange}:${symbol}:${timeframe} get 0 candle since ` +
                `${new Date(sinceInSec * 1000).toISOString()} to ${new Date(toInSec * 1000).toISOString()}`);
        }
        return Promise.resolve(candles);
    }

    onStop(callback: () => void) {
        this.onStopCallback = callback;
    }
    stop() {
        this.currentTime = this.setting.toTime;
        this.candles = [];
    }
}