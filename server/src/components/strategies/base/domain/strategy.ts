import {
    Document,
    Schema,
    Model,
    model
} from "mongoose";

import {
    Symbol,
    ExchangeName,
} from "../../../exchanges";

export interface IStrategy extends Document {
    market: ExchangeName;
    name: String;
    status: string;
    symbol: Symbol;
    setting: Object;
    createdAt: Date;
}

/**
 * schema
 */
export let StrategySchema: Schema = new Schema({
    userId: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        required: true,
    },
    market: {
        type: String,
        required: true
    },
    symbol: {
        type: String,
        required: true
    },
    setting: {
        type: Object,
        required: true
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

StrategySchema.index({
    userId: 1,
    strategy: 1,
    market: 1,
}, {
    unique: true
});

export const Strategy: Model < IStrategy > = model < IStrategy > ("Strategies", StrategySchema);