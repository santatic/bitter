import {
    Document,
    Schema,
    Model,
    model,
} from "mongoose";

import {
    Symbol,
    ExchangeName,
} from "./../types";


export enum TimeFrame {
    S5 = "S5",
        S10 = "S10",
        S15 = "S15",
        S30 = "S30",
        M1 = "M1",
        M2 = "M2",
        M5 = "M5",
        M10 = "M10",
        M15 = "M15",
        M30 = "M30",
        H1 = "H1",
        H2 = "H2",
        H4 = "H4",
        H8 = "H8",
        H12 = "H12",
        D1 = "D1",
        W1 = "W1",
}
// Model
export interface ICandle extends Document {
    exchange: ExchangeName;
    symbol: Symbol;
    timeframe: TimeFrame;

    high: number;
    low: number;
    open: number;
    close: number;
    volume: number;

    bid: number;
    ask: number;

    at: number;
}

/**
 * Schema
 */
export const CandleSchema: Schema = new Schema({
    exchange: {
        type: String,
        required: true,
    },
    symbol: {
        type: String,
        required: true,
    },
    timeframe: {
        type: String,
        required: true,
    },

    open: {
        type: Number,
        required: true
    },
    high: {
        type: Number,
        required: true
    },
    low: {
        type: Number,
        required: true
    },
    close: {
        type: Number,
        required: true
    },
    volume: Number,

    at: {
        type: Number,
        required: true
    },
});

CandleSchema.index({
    exchange: 1,
    symbol: 1,
    timeframe: 1,
    at: 1,
}, {
    unique: true
});

export const Candle: Model < ICandle > = model < ICandle > ("Candle", CandleSchema);