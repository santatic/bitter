import * as WebSocket from "ws";
import * as Boom from "boom";
import {
    EventEmitter
} from "events";

import {
    randomString
} from "./../../../helpers";
import {
    ExchangeName,
    ExchangeSide,
    Symbol,
    MarketDatatype
} from "./../types";
import {
    ICandle,
    Order,
    IOrder,
    OrderType,
    OrderStatus,
    Candle,
    Ticker,
} from "./../domains";


class TradingView {
    private isOpening: boolean = false;
    private ws;

    private charts: {
        id: number,
        session: Map < string,
        {
            market: ExchangeName,
            symbol: Symbol
        } >
    };

    private listener: EventEmitter;

    constructor() {
        this.charts = {
            id: 1,
            session: new Map(),
        };

        this.listener = new EventEmitter();
    }

    open(): Promise < any > {
        if (this.isOpening) {
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            const date = new Date().toISOString().replace(/-/g, "_").replace("T", "-").replace(":", "_").split(":")[0];
            const url = `wss://data-wdc.tradingview.com/socket.io/websocket?from=chart%2FuAJ6NNzA%2F&date=${date}`;
            this.ws = new WebSocket(url, [], {
                headers: {
                    "Accept-Encoding": "gzip, deflate, br",
                    "Accept-Language": "en-US,en;q=0.9",
                    "Cache-Control": "no-cache",
                    "Connection": "Upgrade",
                    "Cookie": "sessionid=pq8tan3dp8pni6sf8ehidfnjvsq4szsb; csrftoken=2PWt71abuhRLA22ezb5we9DKi1rTqjtl; km_ni=namns1337%40gmail.com; km_ai=namns1337%40gmail.com; km_lv=x; _ga=GA1.2.1986132996.1512998457; _gid=GA1.2.1228106378.1514945161; __utmc=226258911; __utmz=226258911.1515067347.33.16.utmcsr=google|utmccn=(organic)|utmcmd=organic|utmctr=(not%20provided); cachec=87508c69-7d4a-432e-8716-bd041e583937; etg=87508c69-7d4a-432e-8716-bd041e583937; kvcd=1515083983369; png=87508c69-7d4a-432e-8716-bd041e583937; tv_ecuid=87508c69-7d4a-432e-8716-bd041e583937; __utma=226258911.1986132996.1512998457.1515067347.1515083983.34; __utmb=226258911.10.9.1515086319475",
                    "Host": "data.tradingview.com",
                    "Origin": "https://www.tradingview.com",
                    "Pragma": "no-cache",
                    "Sec-WebSocket-Extensions": "permessage-deflate; client_max_window_bits",
                    "Sec-WebSocket-Version": "13",
                    "Upgrade": "websocket",
                    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.108 Safari/537.36",
                }
            });

            this.ws.on("open", () => {
                resolve();

                this.send('~m~36~m~{"m":"set_data_quality","p":["low"]}');

                // this.subscribeCandle(MarketName.BITFINEX, Symbol.ETH_BTC);
                // this.subscribeCandle(MarketName.BINANCE, Symbol.XRP_BTC);
                // this.subscribeCandle(MarketName.BITTREX, Symbol.OMG_BTC);
            });
            this.ws.on("close", () => reject());

            this.ws.on("message", (msg) => {
                // health check
                if (msg.match(/^~m~\d+~m~~h~\d+$/g)) {
                    return this.ws.send(msg);
                }
                // console.debug(msg);
                const msges = msg.split(/~m~\d+~m~/);
                msges.forEach(m => {
                    if (m) {
                        try {
                            this.onMessage(JSON.parse(m));
                        } catch (error) {
                            console.error(error);
                        }
                    }
                });
            });

            this.ws.on("error", (error) => {
                console.log(error);
            });
        });
    }

    private onMessage(msg: any) {
        if (msg.m === "du") {
            const session = this.charts.session.get(msg.p[0]);
            if (!session) {
                throw Boom.notFound(`TradingView: Channel not found`, msg);
            }
            let c = msg.p[1];
            c = c[Object.keys(c)[0]].s[0].v;

            const candle = new Candle();
            candle.at = c[0] * 1000;
            candle.open = c[1];
            candle.high = c[2];
            candle.low = c[3];
            candle.close = c[4];
            candle.volume = c[5];
            candle.exchange = session.market;
            candle.symbol = session.symbol;

            console.debug(candle);
            this.listener.emit(`${MarketDatatype.CANDLE}.${session.market}.${session.symbol}`, candle);
        } else {
            console.debug(JSON.stringify(msg));
        }
    }

    private send(msg) {
        console.debug("===>>> Send ws", msg);
        this.ws.send(msg);
    }

    private subscribeCandle(market: ExchangeName, symbol: Symbol) {
        const id = this.charts.id;
        this.charts.id++;

        const session = `cs_${randomString(12)}`;

        this.charts.session.set(session, {
            market,
            symbol
        });

        const sym = parseSymbol2Market(market, symbol);

        let channel;
        switch (market) {
            case ExchangeName.BITFINEX:
                channel = 75;
                break;
            default:
                channel = 74;
        }

        this.send(`~m~55~m~{"m":"chart_create_session","p":["${session}",""]}`);
        this.send(`~m~${channel}~m~{"m":"resolve_symbol","p":["${session}","symbol_${id}","${sym}"]}`);
        this.send(`~m~74~m~{"m":"create_series","p":["${session}","s${id}","s${id}","symbol_${id}","1",300]}`);
    }

    async onCandle(market: ExchangeName, symbol: Symbol, callback: (candle: ICandle) => void) {
        await this.open();
        this.listener.on(`${MarketDatatype.CANDLE}.${market}.${symbol}`, (candle: ICandle) => callback(candle));
        this.subscribeCandle(market, symbol);
    }
}

function parseSymbol2Market(market: ExchangeName, symbol: Symbol) {
    return `${market}:${symbol.toString().split("/").join("")}`;
}

export const tradingView = new TradingView();