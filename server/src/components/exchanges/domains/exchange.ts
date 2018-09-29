import {
    Document,
    Schema,
    Model,
    model
} from "mongoose";

import {
    ExchangeName
} from "../types";


/**
 * Model
 */
export interface IExchange extends Document {
    name: ExchangeName;
    key: string;
    secret: string;
    updatedAt: Date;
}

/**
 * Schema
 */
export const ExchangeSchema: Schema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    key: {
        type: String,
        required: true
    },
    secret: {
        type: String,
        required: true
    },

    updatedAt: {
        type: Date,
        default: Date.now
    }
});

export const Market: Model < IExchange > = model < IExchange > ("markets", ExchangeSchema);