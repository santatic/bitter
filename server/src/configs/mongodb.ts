import * as mongo from "connect-mongo";
import * as mongoose from "mongoose";
import * as session from "express-session";
import * as Bluebird from "bluebird";

export const setupMongoDB = (app: any) => {
    const MongoStore = mongo(session);

    // mongoose.set("debug", true);
    // ( < any > mongoose).Promise = global.Promise;
    ( < any > mongoose).Promise = Bluebird;

    mongoose.connect( < string > process.env.MONGODB_URI);
    mongoose.connection.on("error", () => {
        console.log("MongoDB connection error. Please make sure MongoDB is running.");
        process.exit();
    });

    const mongoStore = new MongoStore( < mongo.MongoUrlOptions > {
        url: process.env.MONGODB_URI,
        autoReconnect: true
    });

    app.use(session( < session.SessionOptions > {
        resave: true,
        saveUninitialized: true,
        secret: process.env.SESSION_SECRET,
        store: mongoStore
    }));
};