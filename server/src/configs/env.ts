import * as _ from "lodash";
import * as dotenv from "dotenv";
import * as fs from "fs";
import {
    EventEmitter
} from "events";

export const setupEnvironments = () => {
    EventEmitter.defaultMaxListeners = 50;

    if (process.env.NODE_ENV !== "production") {
        console.log("Loading development environment");
        dotenv.config({
            path: ".env/.env.dev"
        });
    } else {
        console.log("Loading production environment");
        dotenv.config({
            path: ".env/.env.prod"
        });
    }

    if (process.env.CONFIG) {
        const config = JSON.parse(fs.readFileSync(process.env.CONFIG, {
            encoding: "utf-8"
        }));

        process.env = _.merge(config, process.env);
    }
};