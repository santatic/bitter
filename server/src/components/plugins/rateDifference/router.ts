import * as express from "express";
import * as Boom from "boom";

import {
    pluginRateDifferenceCalculator
} from "./";

const router = express.Router();

router.get("", async function getRateDifference(req, res, next) {
    if (!req.query.symbol) {
        throw Boom.preconditionFailed("Symbol is invalid");
    }
    const symbol = req.query.symbol.toUpperCase();

    let fromMarket;
    if (req.query.from) {
        fromMarket = req.query.from.toUpperCase();
    }
    let toMarket;
    if (req.query.to) {
        toMarket = req.query.to.toUpperCase();
    }
    let side;
    if (req.query.side) {
        side = req.query.side.toLowerCase();
    }
    let excludes;
    if (req.query.excludes) {
        excludes = req.query.excludes.toUpperCase().split(",");
    }

    try {
        const rate = await pluginRateDifferenceCalculator.init()
            .then(() => pluginRateDifferenceCalculator.getRateDifference(symbol, fromMarket, toMarket, side, excludes));

        res.send(rate);
    } catch (error) {
        next(error);
    }
});

router.get("/caches", async function getRateDifferenceCache(req, res, next) {
    let fromMarket;
    if (req.query.from) {
        fromMarket = req.query.from.toUpperCase();
    }
    let toMarket;
    if (req.query.to) {
        toMarket = req.query.to.toUpperCase();
    }
    let side;
    if (req.query.side) {
        side = req.query.side.toLowerCase();
    }
    let excludes;
    if (req.query.excludes) {
        excludes = req.query.excludes.toUpperCase().split(",");
    }

    try {
        const rates = await pluginRateDifferenceCalculator.init()
            .then(() => pluginRateDifferenceCalculator.getMonitorCaching(fromMarket, toMarket, side, excludes));

        res.send({
            rates
        });
    } catch (error) {
        next(error);
    }
});

export const pluginRateDifferenceRouter = router;