import * as express from "express";
import * as Bluebird from "bluebird";
import * as Boom from "boom";

import {
    ExchangeName
} from "../exchanges";
import {
    exchangeFactory
} from "../exchanges/markets";

export async function symbolOfMarkets(markets: Array < ExchangeName > ) {
    const all = await Bluebird.map(
        markets,
        (market: any) => exchangeFactory
        .getExchange(market)
        .then((exchange) => exchange.getSymbols())
        .catch(console.log), {
            concurrency: 5
        });

    const results = {};
    all.forEach((symbols, index) => {
        if (!symbols) {
            return;
        }
        const market = markets[index];
        symbols.forEach(sym => {
            if (!results[sym]) {
                results[sym] = {};
            }
            results[sym][market] = true;
        });
    });

    for (const key in results) {
        results[key] = Object.keys(results[key]);
    }

    return results;
}

// Router
const router = express.Router();
router.get("", getMarketSymbols);
async function getMarketSymbols(req, res, next) {
    if (!req.query.markets) {
        throw Boom.preconditionRequired("Market name not found");
    }

    const markets = req.query.markets.toUpperCase().split(",");

    try {
        const symbols = await symbolOfMarkets(markets);

        res.send({
            symbols
        });
    } catch (error) {
        return next(error);
    }
}
export const symbolOfMarketsRouter = router;