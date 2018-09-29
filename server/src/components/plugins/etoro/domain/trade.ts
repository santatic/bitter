import {
    Document,
    Schema,
    Model,
    model
} from "mongoose";

import {
    Symbol,
} from "./../../../exchanges";

const TABLE_NAME = "PluginEtoroTrades";

/**
 * model
 */
export interface IEtoroTrade extends Document {
    expertId: number;
    symbol: Symbol;
    totalTrades: number;
    pctOfTrades: number;
    pctOfInvestment: number;
    winRatio: number;
    avgProfitPct: number;
    avgLossPct: number;
    avgHoldingTimeInMinutes: number;
    updatedAt: Date;
}

/**
 * schema
 */
export let EtoroTradeSchema: Schema = new Schema({
    expertId: {
        type: Number,
        required: true
    },
    symbol: {
        type: Symbol,
        required: true,
    },
    totalTrades: Number,
    pctOfTrades: Number,
    pctOfInvestment: Number,
    winRatio: Number,
    avgProfitPct: Number,
    avgLossPct: Number,
    avgHoldingTimeInMinutes: Number,

    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// index
EtoroTradeSchema.index({
    expertId: 1,
    symbol: 1,
}, {
    unique: true
});

EtoroTradeSchema.set("toJSON", {
    transform: function (doc, ret, options) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
    }
});


export const EtoroTrade = model < IEtoroTrade > (TABLE_NAME, EtoroTradeSchema);