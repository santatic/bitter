import * as ccxt from "ccxt";
import * as Boom from "boom";
import * as _ from "lodash";

import {
    ExchangeName,
    ExchangeSide,
    Symbol
} from "./../../types";
import {
    ICandle,
    Order,
    IOrder,
    OrderType,
    OrderStatus,
    Candle,
    Ticker,
    TimeFrame,
    IPosition,
    ITicker,
} from "./../../domains";
import {
    HttpExchanger
} from "../..";
import {
    parseTimeFrameToSecond
} from "../../../../helpers";

const MARKETS_LIB = {
    "_1BROKER": ccxt._1broker,
    "_1BTCXE": ccxt._1btcxe,
    "ACX": ccxt.acx,
    "ALLCOIN": ccxt.allcoin,
    "ANXPRO": ccxt.anxpro,
    "BIBOX": ccxt.bibox,
    "BINANCE": ccxt.binance,
    "BIT2C": ccxt.bit2c,
    "BITBAY": ccxt.bitbay,
    "BITFINEX": ccxt.bitfinex,
    "BITFLYER": ccxt.bitflyer,
    "BITHUMB": ccxt.bithumb,
    "BITLISH": ccxt.bitlish,
    "BITMARKET": ccxt.bitmarket,
    "BITMEX": ccxt.bitmex,
    "BITSO": ccxt.bitso,
    "BITSTAMP": ccxt.bitstamp,
    "BITTREX": ccxt.bittrex,
    "BL3P": ccxt.bl3p,
    "BLEUTRADE": ccxt.bleutrade,
    "BRAZILIEX": ccxt.braziliex,
    "BTCBOX": ccxt.btcbox,
    "BTCCHINA": ccxt.btcchina,
    "BTCEXCHANGE": ccxt.btcexchange,
    "BTCMARKETS": ccxt.btcmarkets,
    "BTCTRADEUA": ccxt.btctradeua,
    "BTCTURK": ccxt.btcturk,
    "BTCX": ccxt.btcx,
    "BXINTH": ccxt.bxinth,
    "CCEX": ccxt.ccex,
    "CEX": ccxt.cex,
    "CHBTC": ccxt.chbtc,
    "CHILEBIT": ccxt.chilebit,
    "COINCHECK": ccxt.coincheck,
    "COINEXCHANGE": ccxt.coinexchange,
    "COINFLOOR": ccxt.coinfloor,
    "COINGI": ccxt.coingi,
    "COINMARKETCAP": ccxt.coinmarketcap,
    "COINMATE": ccxt.coinmate,
    "COINSECURE": ccxt.coinsecure,
    "COINSPOT": ccxt.coinspot,
    "CRYPTOPIA": ccxt.cryptopia,
    "DSX": ccxt.dsx,
    "EXMO": ccxt.exmo,
    "FLOWBTC": ccxt.flowbtc,
    "FOXBIT": ccxt.foxbit,
    "FYBSE": ccxt.fybse,
    "FYBSG": ccxt.fybsg,
    "GATECOIN": ccxt.gatecoin,
    "GATEIO": ccxt.gateio,
    "GDAX": ccxt.gdax,
    "GEMINI": ccxt.gemini,
    "GETBTC": ccxt.getbtc,
    "HITBTC": ccxt.hitbtc,
    "HUOBI": ccxt.huobi,
    "HUOBICNY": ccxt.huobicny,
    "HUOBIPRO": ccxt.huobipro,
    "INDEPENDENTRESERVE": ccxt.independentreserve,
    "ITBIT": ccxt.itbit,
    "JUBI": ccxt.jubi,
    "KRAKEN": ccxt.kraken,
    "KUCOIN": ccxt.kucoin,
    "KUNA": ccxt.kuna,
    "LAKEBTC": ccxt.lakebtc,
    "LIQUI": ccxt.liqui,
    "LIVECOIN": ccxt.livecoin,
    "LUNO": ccxt.luno,
    "LYKKE": ccxt.lykke,
    "MERCADO": ccxt.mercado,
    "MIXCOINS": ccxt.mixcoins,
    "NOVA": ccxt.nova,
    "OKCOINCNY": ccxt.okcoincny,
    "OKCOINUSD": ccxt.okcoinusd,
    "OKEX": ccxt.okex,
    "PAYMIUM": ccxt.paymium,
    "POLONIEX": ccxt.poloniex,
    "QRYPTOS": ccxt.qryptos, // could be scam
    "QUADRIGACX": ccxt.quadrigacx, // could be scam
    "QUOINEX": ccxt.quoinex, // could be scam
    "SOUTHXCHANGE": ccxt.southxchange,
    "SURBITCOIN": ccxt.surbitcoin,
    "THEROCK": ccxt.therock,
    "TIDEX": ccxt.tidex,
    "URDUBIT": ccxt.urdubit,
    "VAULTORO": ccxt.vaultoro,
    "VBTC": ccxt.vbtc,
    "VIRWOX": ccxt.virwox,
    "WEX": ccxt.wex,
    "XBTCE": ccxt.xbtce,
    "YOBIT": ccxt.yobit,
    "YUNBI": ccxt.yunbi,
    "ZAIF": ccxt.zaif,
    "ZB": ccxt.zb,
};

export class CryptoExchanger extends HttpExchanger {
    private name: ExchangeName;

    constructor(name: ExchangeName, options: {
        apiKey: String,
        secret: String
    }) {
        super();
        this.name = name;

        if (!MARKETS_LIB[name]) {
            throw Boom.notFound(`Market exchange ${name} is not found`);
        }

        const marketClass = MARKETS_LIB[name];
        this.api = new marketClass({
            apiKey: options.apiKey,
            secret: options.secret
        });
    }

    protected parseOrder(input: ccxt.Order): IOrder {
        const output = new Order();

        output.exchange = this.name;
        output.orderId = input.id;
        output.amount = input.amount;
        output.price = input.price;
        output.filled = input.filled;
        output.symbol = Symbol[input.symbol] || input.symbol;

        output.createdAt = new Date(input.timestamp);
        output.side = input.side === "buy" ? ExchangeSide.BUY : ExchangeSide.SELL;
        output.type = input.type === "limit" ? OrderType.LIMIT : undefined;

        switch (input.status) {
            case "closed":
                output.status = OrderStatus.FILLED;
                break;
            case "open":
                output.status = OrderStatus.OPEN;
                break;
            case "canceled":
                output.status = OrderStatus.CANCELED;
                break;
            default:
                throw new Error(`Order ${input} status is invalid`);
        }

        return output;
    }

    private parseCandles(symbol: Symbol, raws: Array < ccxt.OHLCV > ) {
        return _.map(raws, (raw) => {
            const candle = new Candle();
            candle.symbol = symbol;
            candle.exchange = this.name;

            candle.at = raw[0];
            candle.open = raw[1];
            candle.high = raw[2];
            candle.low = raw[3];
            candle.close = raw[4];
            candle.volume = raw[5];
            return candle;
        });
    }

    private parseTicker(input: ccxt.Ticker) {
        const output = new Ticker();
        output.exchange = this.name;
        output.symbol = < Symbol > input.symbol;

        output.bid = input.bid;
        output.ask = input.ask;
        output.high = input.high;
        output.low = input.low;
        output.open = input.open;
        output.close = input.close;
        output.last = input.last;

        output.volume = input.baseVolume;
        output.vwap = input.vwap;
        output.at = input.timestamp;
        return output;
    }
    // actions

    init(): Promise < void > {
        return Promise.resolve();
    }

    newOrder(order: IOrder): Promise < IOrder > {
        return new Promise((resolve, reject) => {
            const params: any = {};

            this.api.createOrder(
                    order.symbol, order.type.toLowerCase(), order.symbol,
                    order.amount.toString(), order.price.toString(), params)
                .then(order => resolve(this.parseOrder(order)))
                .catch(reject);
        });
    }
    cancelOrder(order: IOrder): Promise < boolean > {
        return this.api.cancelOrder(order.orderId)
            .then(() => order);
    }
    updateOrder(order: IOrder): Promise < IOrder > {
        return this.cancelOrder(order)
            .then(() => this.newOrder(order));
    }

    getOrders(symbol ? : Symbol): Promise < IOrder[] > {
        const sym = symbol ? symbol.toString().toUpperCase() : undefined;
        return this.api.fetchOrders(sym)
            .then(orders => orders.map(order => this.parseOrder(order)));
    }
    getPositions(symbol ? : Symbol): Promise < IPosition[] > {
        return Promise.resolve([]);
    }

    getSymbols(): Promise < Symbol[] > {
        return this.api
            .loadMarkets()
            .then(markets => Object.keys(markets));
    }
    getCandles(symbol: Symbol, timeframe: TimeFrame, sinceInSec: number, toInSec: number): Promise < ICandle[] > {
        const timeframeInSec = parseTimeFrameToSecond(timeframe);
        const size = Math.ceil((toInSec - sinceInSec) / timeframeInSec);
        return this.api
            .fetchOHLCV(symbol, timeframe, sinceInSec * 1000, size)
            .then(raws => this.parseCandles(symbol, raws));
    }

    getTicker(symbol: Symbol): Promise < ITicker > {
        return this._getTickerThrottle(symbol);
    }
    private _getTickerThrottle = _.throttle((symbol: Symbol): Promise < ITicker > => {
        return this.api
            .fetchTicker(symbol)
            .then(ticker => this.parseTicker(ticker));
    }, 5 * 1000);


    public static isCryptoExchange(name: ExchangeName) {
        if (MARKETS_LIB[name]) {
            return true;
        }
        return false;
    }
}