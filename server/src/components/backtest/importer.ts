import * as _ from "lodash";
import * as Boom from "boom";
import {
    ExchangeName,
    Symbol,
    TimeFrame,
    Candle,
    exchanger
} from "../exchanges";
import {
    parseTimeFrameToSecond
} from "../../helpers/exchange";


class CandleImporter {
    import (market: ExchangeName, symbol: Symbol, sinceInSec: number, toInSec: number, timeframe: TimeFrame = TimeFrame.M1): Promise < any > {
        return new Promise(async (resolve, reject) => {
            const timeframeInSec = parseTimeFrameToSecond(timeframe);
            if (toInSec % timeframeInSec > 0) {
                toInSec = toInSec + (timeframeInSec - toInSec % timeframeInSec);
            }
            if (sinceInSec % timeframeInSec > 0) {
                sinceInSec = sinceInSec - sinceInSec % timeframeInSec;
            }

            if (sinceInSec >= toInSec) {
                reject(Boom.preconditionRequired(`Since ${sinceInSec} must be left than ${toInSec}`));
                return;
            }

            const size = Math.ceil((toInSec - sinceInSec) / timeframeInSec);

            // confirm db imported
            const dbSize = await Candle.count({
                at: {
                    $gte: sinceInSec - timeframeInSec,
                    $lte: toInSec + timeframeInSec
                }
            });

            if (dbSize >= size) {
                resolve(`Import market ${market}:${symbol} existed ${dbSize} candles since ` +
                    `[${new Date(sinceInSec).toISOString()}] to [${new Date(toInSec).toISOString()}]`);
                return;
            }

            // import data when db doesn't have enough data
            console.debug(`Market ${market}:${symbol} is importing candles since ` +
                `[${new Date(sinceInSec * 1000).toISOString()}] to [${new Date(toInSec * 1000).toISOString()}]`);
            const candles = await exchanger.getCandles(market, symbol, timeframe, sinceInSec, toInSec);

            if (candles.length === 0) {
                console.debug(`Import ${market}:${symbol} completed!`);
                resolve();
                return;
            }
            const firstTimeInSec = Math.floor(candles[0].at / 1000);
            const lastTimeInSec = Math.floor(candles[candles.length - 1].at / 1000);
            if (sinceInSec > firstTimeInSec) {
                reject(Boom.badData(`Market ${market} get candle response not in range ` +
                    `${new Date(firstTimeInSec * 1000).toISOString()} to ${new Date(lastTimeInSec * 1000).toISOString()}`));
                return;
            }

            // insert data to db
            Candle.collection.insertMany(candles, {
                ordered: false
            }).then(() => {
                console.debug(`Market ${market}:${symbol} imported ${candles.length} candles since ` +
                    `[${new Date(firstTimeInSec * 1000).toISOString()}] to [${new Date(lastTimeInSec * 1000).toISOString()}]`);
            }).catch(error => {
                // skip duplicate error
                console.debug(`Market ${market}:${symbol} imports ${candles.length} candles since ` +
                    `[${new Date(firstTimeInSec * 1000).toISOString()}] to [${new Date(lastTimeInSec * 1000).toISOString()}], ` +
                    `got an error: ${error}`);
            }).then(async () => {
                // loop next pages
                const childStartTime = lastTimeInSec + timeframeInSec;
                if (childStartTime >= toInSec) {
                    console.debug(`Import ${market}:${symbol} completed!`);
                    resolve();
                    return;
                }
                await this.import(market, symbol, childStartTime, toInSec, timeframe);
                resolve();
            });
        });
    }
}

export const candleImporter = new CandleImporter();