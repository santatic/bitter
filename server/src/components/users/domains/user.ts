import {
    Document,
    Schema,
    Model,
    model
} from "mongoose";

export interface IUser extends Document {
    email: String;
    name: String;
    token: String;
    createdAt: Date;
}

export let UserSchema: Schema = new Schema({
    email: {
        type: String,
        unique: true,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    token: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export const User: Model < IUser > = model < IUser > ("Users", UserSchema);