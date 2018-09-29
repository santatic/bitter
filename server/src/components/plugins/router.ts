import * as express from "express";

import {
    symbolOfMarketsRouter,
    pluginRateDifferenceRouter,
    loadEthereumCleanerRouter,
    etoroExpertRouter
} from "./";

const routers = express.Router();
routers.use("/symbols", symbolOfMarketsRouter);
routers.use("/rate_differences", pluginRateDifferenceRouter);
routers.use("/ethereum/cleaner", loadEthereumCleanerRouter);
routers.use("/etoro", etoroExpertRouter);


export const pluginRouters = routers;