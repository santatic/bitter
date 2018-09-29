import {
    Document,
    Schema,
    Model,
    model
} from "mongoose";

import {
    Currency,
    ExchangeName
} from "./../../exchanges";


export interface IWallet extends Document {
    market: ExchangeName;

    currency: Currency;
    amount: number;

    syncAt: Date;
    createdAt: Date;
}

// Schema
export let WalletSchema: Schema = new Schema({
    market: {
        type: String,
        required: true
    },
    currency: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    available: {
        type: Number,
        required: true
    },

    syncAt: {
        type: Date,
        default: Date.now
    },
    createAt: {
        type: Date,
        default: Date.now
    }
});

// Index
WalletSchema.index({
    market: 1,
    currency: 1
}, {
    unique: true
});

export const Wallet: Model < IWallet > = model < IWallet > ("Wallets", WalletSchema);