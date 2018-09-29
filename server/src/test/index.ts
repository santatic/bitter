import * as express from "express";

import {
    setupEnvironments,
    setupMongoDB,
    setupLogging,
} from "./../configs";
import {
    gekkoRedisBeaconTest
} from "./gekkoRedisBeacon.test";
import {
    iqOptionTest
} from "./iqOption.test";
import {
    ethereumCleanerTest
} from "./ethereumCleaner.test";
import {
    etoroMarketTest
} from "./etoro.test";
import {
    tulindTest
} from "./tulind.test";
import {
    candleImportTest
} from "./candleImport.test";
import {
    backtestTest
} from "./backtest.test";
import {
    strategyTest
} from "./strategy.test";

const app = express();

setupEnvironments();
setupLogging(app);
setupMongoDB(app);

/**************/
// gekkoRedisBeaconTest();
// iqOptionTest();
// ethereumCleanerTest();
// etoroMarketTest();
// tulindTest();
// candleImportTest();

backtestTest();
// strategyTest();

/**************/
export default app;