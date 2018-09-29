import {
    Document,
    Schema,
    Model,
    model
} from "mongoose";

import {
    Symbol,
    ExchangeType,
    ExchangeName,
    ExchangeSide
} from "./../types";


// Model
export enum OrderStatus {
    OPEN = "OPEN", FILLED = "FILLED", PARTIAL_FILL = "PARTIAL_FILL", CANCELED = "CANCELED"
}

export enum OrderType {
    LIMIT = "LIMIT", STOP_LIMIT = "STOP_LIMIT", MARKET = "MARKET", TRAILING_STOP = "TRAILING_STOP",
        BINARY_OPTION = "BINARY_OPTION"
}

export interface IOrder extends Document {
    exchange: ExchangeName;
    symbol: Symbol;
    orderId: string;
    strategyId: String;

    status: OrderStatus;
    type: OrderType;
    side: ExchangeSide;

    price: number;
    amount: number;
    filled: number;
    leverage: number;
    stopLoss: number;
    trailingStop: boolean;
    takeProfit: number;
    expire: number;
    tag: Object;

    createdAt: Date;
}

// Schema
export const OrderSchema: Schema = new Schema({
    exchange: {
        type: String,
        required: true
    },
    symbol: {
        type: String,
        required: true
    },
    orderId: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    side: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    leverage: {
        type: Number,
        default: 1
    },
    stopLoss: {
        type: Number,
        default: 0
    },
    trailingStop: {
        type: Number,
        default: false
    },
    takeProfit: Number,

    filled: Number,
    expire: Number,
    strategyId: String,
    tag: Object,

    createAt: {
        type: Date,
        default: Date.now
    }
});

OrderSchema.set("toJSON", {
    transform: function (doc, ret, options) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
    }
});

/**
 * Model object
 */
export const Order: Model < IOrder > = model < IOrder > ("Orders", OrderSchema);