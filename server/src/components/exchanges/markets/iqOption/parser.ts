import * as Boom from "boom";
import * as _ from "lodash";

import {
    Candle,
    ExchangeName,
    Symbol,
    IPosition,
    Position,
    ExchangeSide,
    PositionStatus,
    TimeFrame,
    OrderType
} from "../..";
import {
    parseTimeFrameFromSecound,
    parseTimeFrameToSecond
} from "../../../../helpers/exchange";
import {
    symbolFromId,
    symbolToId
} from "./symbolMapping";
import {
    Wallet,
    WalletType
} from "./exchanger";


export function parseAccount(data) {
    console.debug("Login Account", JSON.stringify(data));
    if (!data["balances"]) {
        return;
    }

    const wallets = new Map();
    const realWallet = new Wallet();
    realWallet.id = data.balances[0].id;
    realWallet.balance = data.balances[0].amount / 1000000;
    realWallet.currency = data.balances[0].currency;

    const practiceWallet = new Wallet();
    practiceWallet.id = data.balances[1].id;
    practiceWallet.balance = data.balances[1].amount / 1000000;
    practiceWallet.currency = data.balances[1].currency;

    wallets[WalletType.REAL] = realWallet;
    wallets[WalletType.PRACTICE] = practiceWallet;
    return wallets;
}
export function parseCandles(raws) {
    return _.map(raws, (raw) => parseCandle(raw));
}

export function parseCandle(raw) {
    const candle = new Candle();
    candle.exchange = ExchangeName.IQOPTION;
    // symbol
    if (raw.active_id) {
        candle.symbol = parseSymbolFromId(raw.active_id);
    }
    // timeframe
    if (raw.size) {
        candle.timeframe = parseTimeFrameFromSecound(raw.size);
    } else if (raw.from && raw.to) {
        candle.timeframe = parseTimeFrameFromSecound(raw.to - raw.from);
    } else {
        throw Boom.badData(`Candle timeframe is invalid`, raw);
    }

    candle.open = raw.open;
    candle.high = raw.max;
    candle.low = raw.min;
    candle.close = raw.close;

    candle.bid = raw.bid;
    candle.ask = raw.ask;

    candle.at = raw.from * 1000;
    return candle;
}

export function parseOptionPositions(raws): Array < IPosition > {
    return _.map(raws, (raw) => {
        const position = new Position();
        position.exchange = ExchangeName.IQOPTION;
        position.symbol = parseSymbolFromId(raw.active_id);
        position.price = raw.value;
        position.amount = Math.ceil(raw.amount / 1000000);
        position.side = raw.dir === "call" ? ExchangeSide.BUY : ExchangeSide.SELL;

        if (raw.win !== "equal") {
            if (raw.win === "win") {
                position.profit = raw.win_amount - position.amount;
            }
            if (raw.win === "loose") {
                position.profit = -position.amount;
            }
            position.profit = Math.round(position.profit * 100) / 100;
            position.status = PositionStatus.CLOSED;
        } else {
            position.status = PositionStatus.OPEN;
        }

        return position;
    });
}

export function parseDigitalPosition() {

}

export function parseSymbolToId(symbol: Symbol) {
    if (!symbolToId[symbol]) {
        throw Boom.preconditionFailed(`Symbol ${symbol} is invalid`);
    }
    return symbolToId[symbol];
}

export function parseSymbolFromId(id: number) {
    if (!symbolFromId[id]) {
        throw Boom.preconditionFailed(`Symbol id ${id} is invalid`);
    }
    return symbolFromId[id];
}

const candleIdToTimeMapping = {
    "S5": 1526984150 - 2501714 * 5,
    "S10": 1526984340 - 1250876 * 10,
    "S15": 1526984370 - 833920 * 15,
    "S30": 1526984400 - 416961 * 30,
    "M1": 1514475540,
};
export function parseCandleIdFromTime(timeframe: TimeFrame, timeInSec: number) {
    if (!candleIdToTimeMapping[timeframe]) {
        throw Boom.notImplemented(`Start time for timeframe ${timeframe} is not implement yet`);
    }

    const initTimeInSec = candleIdToTimeMapping[timeframe];
    const timeFrameInSec = parseTimeFrameToSecond(timeframe);
    const id = (timeInSec - initTimeInSec) / timeFrameInSec;
    if (id % 1 !== 0) {
        throw Boom.badData(`Cannot calculate id of candle ${timeframe} at ${timeInSec}`);
    }
    return id;
}
export function parseCandleIdToTime(timeframe: TimeFrame, id: number) {
    if (!candleIdToTimeMapping[timeframe]) {
        throw Boom.notImplemented(`Start time for timeframe ${timeframe} is not implement yet`);
    }

    const initTimeInSec = candleIdToTimeMapping[timeframe];
    const timeFrameInSec = parseTimeFrameToSecond(timeframe);
    return initTimeInSec + id * timeFrameInSec;
}