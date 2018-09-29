import * as WebSocket from "ws";
import * as _ from "lodash";
import * as Boom from "boom";
import * as _request from "request";
import * as BlueBird from "bluebird";

import {
    WsExchanger,
    IOrder,
    ICandle,
    IPosition,
    TimeFrame,
    ITicker,
    Symbol,
    ExchangeSide,
    OrderType
} from "../..";
import {
    parseAccount,
    parseOptionPositions,
    parseSymbolToId,
    parseCandles,
    parseCandle,
    parseCandleIdFromTime,
    parseCandleIdToTime
} from "./parser";
import {
    parseTimeFrameToSecond,
    randomNumber
} from "../../../../helpers";
import {
    MarketClosedError
} from "../../../../exceptions";


const request: any = BlueBird.promisifyAll(_request, {
    multiArgs: true
});

export enum WalletType {
    REAL = "real", PRACTICE = "practice"
}

export class Wallet {
    public id: string;
    public type: WalletType;
    public balance: number;
    public currency: string;
}

export class IQOptionExchanger extends WsExchanger {
    private apiEndpoint = "https://iqoption.com/api";
    private apiLoginEndpoint = "https://auth.iqoption.com/api/v1.0/login";
    private wsEndpoint = "wss://iqoption.com/echo/websocket";

    private headers = {
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
        "Connection": "Upgrade",
        "Host": "iqoption.com",
        "Origin": "https://iqoption.com",
        "Pragma": "no-cache",
        "Sec-WebSocket-Extensions": "permessage-deflate; client_max_window_bits",
        "Sec-WebSocket-Version": "13",
        "Upgrade": "websocket",
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.108 Safari/537.36",
    };

    private wallets: Map < WalletType, Wallet > ;
    private walletType: WalletType;

    private candles: Map < String, ICandle[] > = new Map();
    private candlesCount: number = 3;

    private timeSync: number;

    private timeCheckLooper;
    private timeCheck: Map < String, {
        at: number,
        symbol: Symbol,
        timeframe: TimeFrame
    } > ;

    constructor() {
        super();
        this.wallets = new Map();
        this.timeSync = Date.now();
        this.timeCheck = new Map();

        if (process.env.IQOPTION_ACCOUNT_TYPE.toUpperCase() === "REAL") {
            this.walletType = WalletType.REAL;
        } else {
            this.walletType = WalletType.PRACTICE;
        }
    }

    // WS functions
    private wsOpen() {
        return new Promise((resolve, reject) => {
            if (this.ws) {
                try {
                    this.ws.close();
                } catch (error) {
                    console.log(error);
                }
            }
            this.ws = new WebSocket(this.wsEndpoint, [], {
                headers: this.headers
            });

            this.ws.once("open", () => resolve());
            this.ws.once("close", () => reject());
            this.ws.once("error", (error) => reject(error));
            this.wsOnMessage();
            this.loopCheckCandleTimeout();
        });
    }

    private wsLogin() {
        return new Promise(async (resolve, reject) => {
            const response = await request.postAsync(this.apiLoginEndpoint, {
                headers: _.merge(this.headers, {
                    "Host": "auth.iqoption.com",
                    "Origin": "https://auth.iqoption.com",
                }),
                form: {
                    "email": process.env.IQOPTION_ACCOUNT_USERNAME,
                    "password": process.env.IQOPTION_ACCOUNT_PASSWORD
                }
            });
            const msg = JSON.parse(response[1]);
            const ssid = msg.data.ssid;

            if (!ssid) return reject("Login false");
            this.listener.once("login", () => resolve(ssid));

            this.wsSend("ssid", ssid);
        });
    }

    private async wsSend(name: string, msg: any, id ? : string) {
        if (!id) {
            id = randomNumber(15).toString();
        }
        msg = {
            "name": name,
            "request_id": id,
            "msg": msg
        };
        msg = JSON.stringify(msg);
        try {
            this.ws.send(msg);
        } catch (error) {
            await this.init();
            throw error;
        }

        if (["heartbeat"].indexOf(name) < 0) {
            console.debug("===>>> Send WS", msg);
        }
        return id;
    }

    private wsOnMessage() {
        this.ws.on("message", (data) => {
            const res = JSON.parse(data.toString());
            if (res.name === "timeSync") {
                this.timeSync = res.msg;
                return;
            }
            if (res.name === "heartbeat") {
                this.wsSend("heartbeat", {
                    "userTime": Date.now(),
                    "heartbeatTime": res.msg - 500
                });
                return;
            }
            if (res.name === "profile") {
                const wallets = parseAccount(res.msg);
                if (wallets) {
                    this.wallets = wallets;
                    this.wsEmit("login");
                }
                return;
            }

            // on candle
            if (res.name === "candle-generated") {
                this.wsOnCandle(res.msg);
                return;
            }
            if (res.name === "candles") {
                this.wsOnCandles(res);
                return;
            }

            // on order
            if (res.name === "buyComplete") {
                this.wsOnOrder(res);
                return;
            }
            // on option position
            if (res.name === "listInfoData") {
                const positions = parseOptionPositions(res.msg);
                positions.forEach((position) => {
                    if (!position.profit) return;

                    const channel = this.getPositionChannel(position.symbol);
                    this.wsEmit(channel, position);
                });
                return;
            }

            // on digital position
            if (res.name === "position-changed" && res.msg.status === "closed") {
                const isWin = res.msg.close_effect_amount > 0;
                if (!isWin) {
                    console.error("Position LOSS");
                    return;
                }
                if (isWin) {
                    console.warn("Position WIN");
                    return;
                }
            }

            console.debug("message", JSON.stringify(res));
        });
    }

    private wsEmit(channel: string, data ? ): boolean {
        if (this.listener.listenerCount(channel) > 0) {
            this.listener.emit(channel, data);
            return true;
        }
        // console.warn(`Channel ${channel} does't have any listener`);
        return false;
    }

    // on candle
    private wsOnCandles(res) {
        const candles = parseCandles(res.msg.candles);
        if (candles.length === 0) return;

        const channel = this.getCandlesChannel(candles[0].timeframe, res.request_id);
        const isSent = this.wsEmit(channel, candles);
        if (!isSent) {
            console.error("Candles don't have listener");
        }
    }

    private wsOnCandle(raw) {
        const candle = parseCandle(raw);
        const channel = this.getCandleChannel(candle.symbol, candle.timeframe);

        // update candle timeout check
        this.timeCheck[channel] = {
            at: Date.now(),
            symbol: candle.symbol,
            timeframe: candle.timeframe
        };

        // detect closed market symbol
        if (raw.to < this.timeSync / 1000 - raw.size) {
            this.wsUnsubscribeCandle(candle.symbol, candle.timeframe);
            this.wsEmit(channel, new MarketClosedError(`Market ${candle.symbol} closed`));
            return;
        }

        if (!this.candles[channel]) {
            this.candles[channel] = [];
        }
        const candles = this.candles[channel];

        // if candle are ready exist, check it is a ticker of existed candle or a new ticker
        // if has candle in queue
        if (candles.length > 0) {
            const lastCandle = candles[0];
            // still in ticker of candle
            if (candle.at === lastCandle.at) {
                candles[0] = candle;
            } else { // candle was completed by new ticker
                lastCandle.close = candle.open;
                candles.unshift(candle);

                // push new event for new candle
                this.wsEmit(channel, lastCandle);
            }
        } else {
            candles.unshift(candle);
        }

        // push new event for ticker
        const channelTicker = this.getTickerChannel(candle.symbol, candle.timeframe);
        this.wsEmit(channelTicker, candle);

        // clean candles stack
        // +1 is for ticker
        this.candles[channel] = candles.slice(0, this.candlesCount + 1);
    }

    private wsSubscribeCandle(symbol: Symbol, timeframe: TimeFrame): Promise < any > {
        const channel = this.getCandleChannel(symbol, timeframe);
        // if (this.listener.listenerCount(channel) > 0) {
        //     return;
        // }

        return this.wsSend("subscribeMessage", {
            name: "candle-generated",
            params: {
                routingFilters: {
                    active_id: parseSymbolToId(symbol),
                    size: parseTimeFrameToSecond(timeframe)
                }
            }
        });
    }

    private wsUnsubscribeCandle(symbol: Symbol, timeframe: TimeFrame) {
        const channel = this.getCandleChannel(symbol, timeframe);
        return this.wsSend("unsubscribeMessage", {
            name: "candle-generated",
            params: {
                routingFilters: {
                    active_id: parseSymbolToId(symbol),
                    size: parseTimeFrameToSecond(timeframe)
                }
            }
        });
    }

    // on order
    private wsOnOrder(res) {
        if (res.msg && res.msg.isSuccessful == true) {
            this.wsEmit(res.request_id, true);
            return;
        }

        let message;
        try {
            message = res.msg.message;
        } catch (error) {
            message = "Order failed";
        }
        this.wsEmit(res.request_id, new Error(message));
    }

    // on position
    private wsNewOptionPosition(order: IOrder, timeout: number = 30): Promise < IOrder > {
        console.warn("Add option position", order);

        return new Promise((resolve, reject) => {
            const expireInMin = Math.round(order.expire / 1000);
            const timeSyncInSec = Math.floor(this.timeSync / 1000);
            const exp = timeSyncInSec - (timeSyncInSec % 60) + 60 * (expireInMin + 1);

            const requestId = randomNumber(15).toString();

            // timeout checker
            const timeoutChecker = setTimeout(() => {
                this.listener.removeAllListeners(requestId);
                reject(new Error("Order request timeout"));
            }, timeout * 1000);

            // response
            const listener = this.listener.once(requestId, res => {
                clearTimeout(timeoutChecker);
                if (res instanceof Error) {
                    return reject(res);
                }
                resolve(order);
            });

            this.wsSend("buyV2", {
                price: order.amount,
                exp,
                refund_value: 0,
                act: parseSymbolToId(order.symbol),
                direction: order.side === ExchangeSide.BUY ? "call" : "put",
                user_balance_id: this.getCurrentWallet().id,
                requestId: requestId,
                type: "turbo",
                time: timeSyncInSec,
                skey: "2f63df36ce5f4fd2f072ea48c3bba913",
                plotId: 1,
                platform: "9"
            }, requestId);
        });
    }

    private wsNewDigitalPosition(symbol: Symbol, side: ExchangeSide, price: number, expireMinutes: number = 5) {
        console.warn("Add digital position", symbol, side, price);

        // choose position
        const spread = 1;
        let point = this.candles[0].close;
        if (expireMinutes == 1) {
            point = point * 1000000;
        } else {
            point = point * 100000;
        }
        point = side === ExchangeSide.BUY ? point + spread : point - spread;

        // expire time of position
        const timeSyncInSec = Math.floor(this.timeSync / 1000);

        let expireTime;
        if (expireMinutes == 1) {
            expireTime = timeSyncInSec - (timeSyncInSec % 60) + 60 * expireMinutes;
            if (timeSyncInSec % 60 >= 45) {
                expireTime += 60;
            }
        } else {
            expireTime = timeSyncInSec - (timeSyncInSec % 300) + 300;
        }


        // instrument id
        const time = (new Date(expireTime * 1000)).toISOString().replace(/[-T:\.]/g, "").slice(0, 12);
        const instrumentId = `do${symbol}${time}PT${expireMinutes}MP${point}`.split(".", 1)[0].replace(/\//g, "");

        return this.wsSend("sendMessage", {
            name: "place-order-temp",
            version: "3.0",
            body: {
                user_balance_id: this.getCurrentWallet().id,
                client_platform_id: "9",
                instrument_type: "digital-option",
                instrument_id: instrumentId,
                side: side === ExchangeSide.BUY ? "buy" : "sell",
                type: "market",
                amount: price,
                leverage: 1,
                limit_price: 0,
                stop_price: 0,
                use_token_for_commission: false,
                auto_margin_call: false
            }
        });
    }

    private getCurrentWallet() {
        return this.wallets[this.walletType];
    }

    private loopCheckCandleTimeout() {
        if (this.timeCheckLooper) return;

        this.timeCheckLooper = setInterval(() => {
            _.keys(this.timeCheck).forEach(key => {
                if (this.timeCheck[key].at < Date.now() - 60 * 1000) {
                    console.error(`Channel ${key} timeout`);
                    this.wsSubscribeCandle(this.timeCheck[key].symbol, this.timeCheck[key].timeframe);
                }
            });
        }, 30 * 1000);
    }

    // API
    async init(): Promise < void > {
        console.debug("Loading IQ Option exchange...");
        await this.wsOpen();
        await this.wsLogin();
    }

    getSymbols(): Promise < Symbol[] > {
        return Promise.resolve([]);
    }

    // ticker
    getTicker(symbol: Symbol): Promise < ITicker > {
        return Promise.resolve(undefined);
    }
    hasTickerSubscriber(symbol: Symbol, timeframe: TimeFrame): boolean {
        const channel = this.getTickerChannel(symbol, timeframe);
        return this.listener.listenerCount(channel) > 0;
    }
    onTicker(symbol: Symbol, timeframe: TimeFrame, callback: (ticker: ITicker) => void) {}
    offTicker(symbol: Symbol, timeframe: TimeFrame, func ? ): Promise < boolean > {
        return Promise.resolve(true);
    }
    private getTickerChannel(symbol: Symbol, candleTime: TimeFrame) {
        return `${symbol}:${candleTime}:TICKER`;
    }

    // candle
    hasCandleSubscriber(symbol: Symbol, timeframe: TimeFrame): boolean {
        const channel = this.getCandleChannel(symbol, timeframe);
        return this.listener.listenerCount(channel) > 0;
    }
    onCandle(symbol: Symbol, timeframe: TimeFrame, callback: (candle: ICandle) => Promise < void > ) {
        const channel = this.getCandleChannel(symbol, timeframe);
        this.listener.on(channel, (candle: ICandle) => callback(candle));

        // add timeout check
        this.timeCheck[channel] = {
            at: Date.now(),
            symbol,
            timeframe
        };

        this.wsSubscribeCandle(symbol, timeframe);
    }
    offCandle(symbol: Symbol, timeframe: TimeFrame, func ? ): Promise < boolean > {
        return Promise.resolve(true);
    }
    private getCandleChannel(symbol: Symbol, candleTime: TimeFrame) {
        return `${symbol}:${candleTime}:CANDLE`;
    }

    // candles
    getCandles(symbol: Symbol, timeframe: TimeFrame, sinceInSec: number, toInSec: number): Promise < ICandle[] > {
        return new Promise((resolve, reject) => {
            const timeframeInSec = parseTimeFrameToSecond(timeframe);

            const size = Math.floor((toInSec - sinceInSec) / timeframeInSec);
            const requestId = randomNumber(15).toString();
            // listen for response
            const channel = this.getCandlesChannel(timeframe, requestId);
            this.listener.once(channel, (candles) => {
                const res = _.map(candles, candle => {
                    if (candle.at > toInSec * 1000) {
                        return undefined;
                    }
                    candle.symbol = symbol;
                    return candle;
                }).filter(r => r !== undefined);

                resolve(res);
            });

            // send request
            this.wsSend("sendMessage", {
                name: "get-candles",
                version: "2.0",
                body: {
                    active_id: parseSymbolToId(symbol),
                    size: timeframeInSec,
                    // from_id: fromId,
                    // to_id: toId

                    count: size,
                    from: sinceInSec,
                    // to: toInSec
                }
            }, requestId);
        });
    }
    private getCandlesChannel(candleTime: TimeFrame, requestId ? : string) {
        let channel = `${candleTime}:CANDLES`;
        if (requestId) {
            channel = `${channel}:${requestId}`;
        }
        return channel;
    }

    // order
    newOrder(order: IOrder): Promise < IOrder > {
        if (order.type == OrderType.BINARY_OPTION) {
            return this.wsNewOptionPosition(order);
        }
        return Promise.reject(Boom.notFound(`Order type ${order.type} is not found`));
    }
    cancelOrder(order: IOrder): Promise < boolean > {
        return Promise.resolve(true);
    }
    updateOrder(order: IOrder): Promise < IOrder > {
        return Promise.resolve(undefined);
    }
    getOrders(symbol ? : Symbol): Promise < IOrder[] > {
        return Promise.resolve([]);
    }
    hasOrderSubscriber(symbol: Symbol) {
        const channel = this.getOrderChannel(symbol);
        return this.listener.listenerCount(channel) > 0;
    }
    onOrder(symbol: Symbol, callback: (order: IOrder) => void) {}
    offOrder(symbol: Symbol, func ? ): Promise < boolean > {
        return Promise.resolve(true);
    }
    private getOrderChannel(symbol: Symbol) {
        return `${symbol}:ORDER`;
    }

    // position
    getPositions(symbol ? : Symbol): Promise < IPosition[] > {
        return Promise.resolve([]);
    }
    hasPositionSubscriber(symbol: Symbol): boolean {
        const channel = this.getPositionChannel(symbol);
        return this.listener.listenerCount(channel) > 0;
    }
    onPosition(symbol: Symbol, callback: (position: IPosition) => void) {
        const channel = this.getPositionChannel(symbol);
        this.listener.on(channel, (position) => callback(position));
    }
    offPosition(symbol: Symbol, func ? ): Promise < boolean > {
        return Promise.resolve(true);
    }
    private getPositionChannel(symbol: Symbol) {
        return `${symbol}:POSITION`;
    }
}