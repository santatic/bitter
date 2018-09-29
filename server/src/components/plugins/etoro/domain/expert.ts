import {
    Document,
    Schema,
    Model,
    model
} from "mongoose";

import {
    Symbol,
} from "./../../../exchanges";

const TABLE_NAME = "PluginEtoroExperts";

/**
 * interface
 */

export enum EtoroExpertStatus {
    ACTIVE = "ACTIVE", DISABLED = "DISABLED"
}

/**
 * model
 */
export interface IEtoroExpert extends Document {
    status: EtoroExpertStatus;
    cid: number;
    name: string;
    avatar: string;
    createdAt: Date;
}

/**
 * schema
 */
export let EtoroExpertSchema: Schema = new Schema({
    status: {
        type: String,
        default: EtoroExpertStatus.ACTIVE
    },
    cid: {
        type: Number,
        unique: true,
        required: true,
    },
    name: {
        type: String,
        unique: true,
        required: true,
    },
    avatar: String,

    createdAt: {
        type: Date,
        default: Date.now
    }
});

EtoroExpertSchema.set("toJSON", {
    transform: function (doc, ret, options) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
    }
});


export const EtoroExpert = model < IEtoroExpert > (TABLE_NAME, EtoroExpertSchema);