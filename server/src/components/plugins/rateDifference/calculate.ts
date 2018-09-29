import * as Boom from "boom";
import * as Bluebird from "bluebird";
import * as _ from "lodash";

import {
    Symbol,
    ExchangeName,
    ExchangeSide,
    exchangeFactory
} from "./../../exchanges";
import {
    symbolOfMarkets
} from "./../";
import {
    PluginRateDifference,
    PluginRateDifferenceStatus,
    IPluginRateDifference,
} from "./";

class Calculator {
    private markets = [
        // MarketName._1BROKER,
        // MarketName._1BTCXE,
        // MarketName.ACX,
        // MarketName.ALLCOIN, // timeout, cannot create account
        ExchangeName.ANXPRO,
        ExchangeName.BIBOX,
        ExchangeName.BINANCE,
        // MarketName.BIT2C,
        ExchangeName.BITBAY,
        // MarketName.BITCOINCOID,
        ExchangeName.BITFINEX,
        // MarketName.BITFLYER,
        // MarketName.BITHUMB,
        // MarketName.BITLISH,
        // MarketName.BITMARKET,
        // MarketName.BITMEX,
        ExchangeName.BITSO,
        ExchangeName.BITSTAMP,
        ExchangeName.BITTREX,
        // MarketName.BL3P,
        ExchangeName.BLEUTRADE,
        ExchangeName.BRAZILIEX,
        // MarketName.BTCBOX,
        // MarketName.BTCCHINA,
        // MarketName.BTCEXCHANGE,
        // MarketName.BTCMARKETS,
        ExchangeName.BTCTRADEUA,
        // MarketName.BTCTURK,
        // MarketName.BTCX,
        // MarketName.BTER,
        ExchangeName.BXINTH,
        // MarketName.CCEX, // cannot register, try again later
        ExchangeName.CEX,
        // MarketName.CHBTC,
        // MarketName.CHILEBIT,
        // MarketName.COINCHECK,
        ExchangeName.COINEXCHANGE,
        // MarketName.COINFLOOR,
        ExchangeName.COINGI,
        // MarketName.COINMARKETCAP,
        // MarketName.COINMATE,
        // MarketName.COINSECURE,
        // MarketName.COINSPOT,
        ExchangeName.CRYPTOPIA, // * need verify account to withdrawals
        // MarketName.DSX,
        // MarketName.EXMO,
        // MarketName.FLOWBTC,
        // MarketName.FOXBIT,
        // MarketName.FYBSE,
        // MarketName.FYBSG,
        ExchangeName.GATECOIN,
        ExchangeName.GATEIO,
        // MarketName.GDAX,
        // MarketName.GEMINI,
        // MarketName.GETBTC,
        ExchangeName.HITBTC,
        // MarketName.HUOBI,
        // MarketName.HUOBICNY,
        ExchangeName.HUOBIPRO,
        // MarketName.INDEPENDENTRESERVE,
        // MarketName.ITBIT,
        // MarketName.JUBI,
        ExchangeName.KRAKEN,
        ExchangeName.KUCOIN,
        ExchangeName.KUNA,
        // MarketName.LAKEBTC,
        ExchangeName.LIQUI,
        ExchangeName.LIVECOIN, // timeout
        // MarketName.LUNO,
        // MarketName.LYKKE,
        // MarketName.MERCADO,
        ExchangeName.MIXCOINS,
        // MarketName.NOVA, // scam, need re-confirm
        // MarketName.OKCOINCNY,
        // MarketName.OKCOINUSD,
        // MarketName.OKEX,
        // MarketName.PAYMIUM,
        // MarketName.POLONIEX, // recheck
        ExchangeName.QRYPTOS,
        // MarketName.QUADRIGACX,
        // MarketName.QUOINE,
        ExchangeName.SOUTHXCHANGE,
        // MarketName.SURBITCOIN,
        // MarketName.THEROCK,
        ExchangeName.TIDEX,
        // MarketName.URDUBIT,
        // MarketName.VAULTORO,
        // MarketName.VBTC,
        // MarketName.VIRWOX,
        ExchangeName.WEX,
        // MarketName.XBTCE, // recheck
        ExchangeName.YOBIT,
        // MarketName.YUNBI, // recheck
        ExchangeName.ZAIF,
    ];

    init = _.once(async () => {
        await this.syncSymbols();
        await this.monitor();
    });

    private async syncSymbols() {
        console.log("Plugin:RateDifference ", "loading symbols");
        let symbols = await symbolOfMarkets(this.markets);

        symbols = _.pickBy(symbols, (val: any, symbol) =>
            val.length > 1 && (
                _.endsWith(symbol, "/BTC") ||
                _.endsWith(symbol, "/ETH")));

        // symbols = {"ETH/BTC": ["BINANCE", "BITTREX"]}
        _.forEach(symbols, async (markets, symbol) => {
            await PluginRateDifference.update({
                symbol
            }, {
                $set: {
                    symbol,
                    status: PluginRateDifferenceStatus.AVAILABLE,
                    markets: _.uniq(markets)
                }
            }, {
                upsert: true
            });
        });
    }

    private monitor() {
        console.log("Plugin:RateDifference ", "monitoring symbols");
        setInterval(async () => {
            const rate = await this.getAvailableRateFromDB();
            if (!rate) {
                return;
            }

            this.fetchRateDifference(rate);
        }, 30000);
    }

    async getMonitorCaching(fromMarket ? : ExchangeName, toMarket ? : ExchangeName,
        rateSide ? : String, excludes ? : ExchangeName[]) {
        const query: any = {};
        if (fromMarket && toMarket) {
            query.markets = {
                $all: [fromMarket, toMarket]
            };
        } else if (fromMarket) {
            query.markets = fromMarket;
        } else if (toMarket) {
            query.markets = toMarket;
        }

        const dbRates = await PluginRateDifference.find(query);

        return _.orderBy(_.compact(_.map(dbRates, (dbRate) => {
            try {
                const calculatedRate = this.calculateRateDifferenceCaching(dbRate, fromMarket, toMarket, rateSide, excludes);
                return {
                    best: calculatedRate.best,
                    symbol: calculatedRate.symbol,
                    rates: calculatedRate.rates,
                    at: calculatedRate.at,
                    markets: calculatedRate.markets,
                };
            } catch (error) {
                return;
            }
        })), ["best"], ["desc"]);
    }

    private async getAvailableRateFromDB(symbol ? : Symbol,
        fromMarket ? : ExchangeName, toMarket ? : ExchangeName) {

        const query: any = {
            $or: [{
                status: PluginRateDifferenceStatus.AVAILABLE
            }, {
                // symbol processing but timeout is 5 minutes
                // in case process was die
                status: PluginRateDifferenceStatus.PROCESSING,
                at: {
                    $lt: new Date(Date.now() - 1000 * 60 * 5) // 5 minutes
                }
            }]
        };

        if (symbol) {
            query.symbol = symbol;
        }

        if (fromMarket && toMarket) {
            query.markets = {
                $all: [fromMarket, toMarket]
            };
        } else if (fromMarket) {
            query.markets = fromMarket;
        } else if (toMarket) {
            query.markets = toMarket;
        }

        return await PluginRateDifference.findOneAndUpdate(query, {
            $set: {
                status: PluginRateDifferenceStatus.PROCESSING,
                at: new Date(),
            }
        }, {
            sort: {
                "at": 1
            },
            new: true
        });
    }

    async getRateDifference(symbol: Symbol,
        fromMarket ? : ExchangeName, toMarket ? : ExchangeName,
        rateSide ? : String, excludes ? : ExchangeName[]): Promise < any > {

        const dbRate = await this.getAvailableRateFromDB(symbol, fromMarket, toMarket);
        if (!dbRate) {
            throw Boom.notFound(`Symbol ${symbol} not found on multiple market exchange`);
        }

        const rawRate = await this.fetchRateDifference(dbRate, fromMarket, toMarket);
        return this.calculateRateDifferenceCaching(rawRate, fromMarket, toMarket, rateSide, excludes);
    }

    private async fetchRateDifference(dbRate: IPluginRateDifference,
        fromMarket ? : ExchangeName, toMarket ? : ExchangeName) {
        console.log(`Exchange rate Plugin monitoring symbol: ${dbRate.symbol}`);

        dbRate.markets = _.uniq(dbRate.markets);
        if (fromMarket && dbRate.markets.indexOf(fromMarket) < 0) {
            throw Boom.notFound(`Market ${fromMarket} is not exists in ${dbRate.markets}`);
        }
        if (toMarket && dbRate.markets.indexOf(toMarket) < 0) {
            throw Boom.notFound(`Market ${toMarket} is not exists in ${dbRate.markets}`);
        }

        const tickers: any = _.compact(await Bluebird.map(
            dbRate.markets,
            (market: any) => exchangeFactory
            .getExchange(market)
            .then(exchange => exchange.getTicker(dbRate.symbol))
            .catch(console.log), {
                concurrency: 3
            }));

        dbRate.tickers = tickers;
        return await this.calculateRateDifference(dbRate, fromMarket, toMarket).save();
    }

    private calculateRateDifferenceCaching(dbRate: IPluginRateDifference,
        fromMarket ? : ExchangeName, toMarket ? : ExchangeName,
        rateSide ? : String, excludes ? : ExchangeName[]) {

        let lowestRateSide, highestRateSide;
        if (rateSide && rateSide.toLocaleLowerCase() === "buy2buy") {
            lowestRateSide = ExchangeSide.BUY;
            highestRateSide = ExchangeSide.BUY;
        }

        if (excludes) {
            dbRate.tickers = _.filter(dbRate.tickers, (ticker: any) => excludes.indexOf(ticker.market) < 0);
        }

        const calculatedRate = this.calculateRateDifference(dbRate, fromMarket, toMarket);

        if (lowestRateSide || highestRateSide) {
            calculatedRate.best = _.max(_.map(_.filter(calculatedRate.rates, (rate: any) => {
                if (lowestRateSide && lowestRateSide !== rate.lowest.side) {
                    return false;
                }
                if (highestRateSide && highestRateSide !== rate.highest.side) {
                    return false;
                }
                return true;
            }), (diff: any) => diff.rate));
        }

        return calculatedRate;
    }

    private calculateRateDifference(dbRate: IPluginRateDifference,
        fromMarket ? : ExchangeName, toMarket ? : ExchangeName) {

        if (fromMarket && dbRate.markets.indexOf(fromMarket) < 0) {
            throw Boom.notFound(`Market ${fromMarket} is not exists in ${dbRate.markets}`);
        }
        if (toMarket && dbRate.markets.indexOf(toMarket) < 0) {
            throw Boom.notFound(`Market ${toMarket} is not exists in ${dbRate.markets}`);
        }

        // filter zero bid market
        const tickers = _.filter(dbRate.tickers, (ticker: any) => ticker.bid > 0);
        const listBuy = _.map(tickers, (ticker: any) => [ticker.bid, ticker.market]);
        const listSell = _.map(tickers, (ticker: any) => [ticker.ask, ticker.market]);
        const mapBuy = _.fromPairs(listBuy);
        const mapSell = _.fromPairs(listSell);

        let lowestBuy, lowestSell;
        if (fromMarket) {
            const fromBuy = _.find(listBuy, (buy) => buy[1] === fromMarket);
            const fromSell = _.find(listSell, (sell) => sell[1] === fromMarket);
            lowestBuy = _.toNumber(fromBuy[0]);
            lowestSell = _.toNumber(fromSell[0]);
        } else {
            lowestBuy = _.toNumber(_.min(Object.keys(mapBuy)));
            lowestSell = _.toNumber(_.min(Object.keys(mapSell)));
        }

        let highestBuy, highestSell;
        if (toMarket) {
            const toBuy = _.find(listBuy, (buy) => buy[1] === toMarket);
            const toSell = _.find(listSell, (sell) => sell[1] === toMarket);
            highestBuy = _.toNumber(toBuy[0]);
            highestSell = _.toNumber(toSell[0]);
        } else {
            highestBuy = _.toNumber(_.max(Object.keys(mapBuy)));
            highestSell = _.toNumber(_.max(Object.keys(mapSell)));
        }

        // calculate rate by sides
        const rateBuy2Sell = this.parseRateDifference(dbRate.symbol,
            lowestBuy, ExchangeSide.BUY, mapBuy[lowestBuy],
            highestSell, ExchangeSide.SELL, mapSell[highestSell]
        );
        const rateSell2Buy = this.parseRateDifference(dbRate.symbol,
            lowestSell, ExchangeSide.SELL, mapSell[lowestSell],
            highestBuy, ExchangeSide.BUY, mapBuy[highestBuy]
        );
        const rateSell2Sell = this.parseRateDifference(dbRate.symbol,
            lowestSell, ExchangeSide.SELL, mapSell[lowestSell],
            highestSell, ExchangeSide.SELL, mapSell[highestSell]
        );
        const rateBuy2Buy = this.parseRateDifference(dbRate.symbol,
            lowestBuy, ExchangeSide.BUY, mapBuy[lowestBuy],
            highestBuy, ExchangeSide.BUY, mapBuy[highestBuy]
        );

        // sort by best rate
        const rates = _.orderBy([rateBuy2Sell, rateSell2Buy, rateSell2Sell, rateBuy2Buy], ["rate"], ["desc"]);

        // find highest rate price
        const best = _.max(_.map([rateBuy2Sell, rateSell2Buy, rateSell2Sell, rateBuy2Buy], (diff) => diff.rate));

        // store
        dbRate.status = PluginRateDifferenceStatus.AVAILABLE;
        dbRate.best = best;
        dbRate.rates = rates;
        dbRate.at = new Date();

        return dbRate;
    }

    private parseRateDifference(symbol,
        lowest: number, lowestSide: ExchangeSide, lowestMarket: ExchangeName,
        highest: number, highestSide: ExchangeSide, highestMarket: ExchangeName) {

        const rate = (highest - lowest) / lowest * 100;
        return {
            symbol,
            rate,
            lowest: {
                price: lowest,
                side: lowestSide,
                market: lowestMarket
            },
            highest: {
                price: highest,
                side: highestSide,
                market: highestMarket,
            },
        };
    }
}

export const pluginRateDifferenceCalculator = new Calculator();