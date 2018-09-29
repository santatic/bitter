import {
    Document,
    Schema,
    Model,
    model
} from "mongoose";

import {
    Symbol,
} from "./../../exchanges";

const TABLE_NAME = "PluginRateDifferences";

/**
 * interface
 */

export enum PluginRateDifferenceStatus {
    AVAILABLE = "AVAILABLE",
        PROCESSING = "PROCESSING",
        ERROR = "ERROR",
}

/**
 * model
 */
export interface IPluginRateDifference extends Document {
    symbol: Symbol;
    status: PluginRateDifferenceStatus;
    markets: Array < string > ;
    best: number;
    rates: Object;
    tickers: Object;

    at: Date;
}

/**
 * schema
 */
export let PluginRateDifferenceSchema: Schema = new Schema({
    symbol: {
        type: String,
        required: true,
        unique: true
    },
    status: {
        type: String,
        default: PluginRateDifferenceStatus.AVAILABLE
    },
    markets: {
        type: Array,
        default: []
    },
    best: {
        type: Number,
        default: 0
    },
    rates: {
        type: Object,
        default: {}
    },
    tickers: {
        type: Object,
        default: {}
    },

    at: {
        type: Date,
        default: Date.now
    }
});

PluginRateDifferenceSchema.set("toJSON", {
    transform: function (doc, ret, options) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
    }
});


export const PluginRateDifference = model < IPluginRateDifference > (TABLE_NAME, PluginRateDifferenceSchema);