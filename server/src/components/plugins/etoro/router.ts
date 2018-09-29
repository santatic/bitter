import * as express from "express";
import * as Boom from "boom";
import * as _ from "lodash";
import * as Bluebird from "bluebird";

import {
    etoroMarketExchange
} from "../../exchanges";
import {
    EtoroExpert,
    EtoroExpertStatus,
    EtoroTrade,
    pluginEtoroManager
} from "./";

const router = express.Router();

// get list of expert from database
router.get("/experts", async function getExperts(req, res, next) {
    let status;
    if (req.query.status) {
        status = req.query.status.toUpperCase();
    } else {
        status = EtoroExpertStatus.ACTIVE;
    }

    try {
        const experts = await EtoroExpert.find({
            status
        });
        res.send({
            experts
        });
    } catch (error) {
        next(error);
    }
});

// get expert profile from etoro and store in database
router.post("/experts", async function getExperts(req, res, next) {
    if (!req.body.ids) {
        throw Boom.preconditionRequired("ids paramater not found");
    }

    try {
        const experts = await pluginEtoroManager.getExperts(req.body.ids);
        res.send({
            experts
        });
    } catch (error) {
        next(error);
    }
});


// get expert trades summary
router.get("/experts/:expertId/trades", async function getExpertTrades(req, res, next) {
    if (!req.params.expertId) {
        throw Boom.preconditionRequired("ids paramater not found");
    }

    try {
        const trades = await pluginEtoroManager.getExpertTrades(req.params.expertId);
        res.send({
            trades
        });
    } catch (error) {
        next(error);
    }
});

// get expert position from etoro
router.get("/experts/positions", async function getPosisions(req, res, next) {
    if (!req.query.ids) {
        throw Boom.preconditionRequired("ids paramater not found");
    }
    const expertIds = _.map(req.query.ids.split(","), id => _.parseInt(id));

    try {
        const positions = await pluginEtoroManager.getExpertPositions(expertIds);
        res.send({
            positions
        });
    } catch (error) {
        next(error);
    }
});

export const etoroExpertRouter = router;