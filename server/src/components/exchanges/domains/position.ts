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
export enum PositionStrategy {
    ETORO_EXPERT = "ETORO_EXPERT",
        ETORO_COPY_EXPERT = "ETORO_COPY_EXPERT"
}

export enum PositionStatus {
    OPEN = "OPEN", FILLED = "FILLED", PARTIAL_FILL = "PARTIAL_FILL", CANCELED = "CANCELED", CLOSED = "CLOSED"
}

export interface IPosition extends Document {
    exchange: ExchangeName;
    symbol: Symbol;
    positionId: string;
    strategy: PositionStrategy;
    orderId: string;
    parrentId: string;

    status: PositionStatus;
    side: ExchangeSide;

    price: number;
    amount: number;
    leverage: number;
    stopLoss: number;
    trailingStop: boolean;
    takeProfit: number;
    close: number;
    profit: number;

    tag: Object;
    createdAt: Date;
}

// Schema
export const PositionSchema: Schema = new Schema({
    market: {
        type: String,
        required: true
    },
    symbol: {
        type: String,
        required: true
    },
    positionId: {
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
    close: Number,
    profit: Number,

    strategy: String,
    parrentId: String,
    tag: Object,

    createAt: {
        type: Date,
        default: Date.now
    }
});

// index
PositionSchema.index({
    market: 1,
    symbol: 1,
    positionId: 1,
}, {
    unique: true
});


PositionSchema.set("toJSON", {
    transform: function (doc, ret, options) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
    }
});

/**
 * Model object
 */
export const Position: Model < IPosition > = model < IPosition > ("Positions", PositionSchema);