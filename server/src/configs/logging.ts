import * as morgan from "morgan";
import * as winston from "winston";
import * as fs from "fs";

// create log folder
const logDir = "./logs";
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

// init
export const logger = new winston.Logger({
    transports: [
        new winston.transports.File({
            level: "info",
            filename: logDir + "/app.log",
            handleExceptions: true,
            json: true,
            maxSize: 5242880, // 5MB
            maxFiles: 5,
            colorize: false
        }),
        new winston.transports.Console({
            level: "debug",
            handleExceptions: true,
            json: false,
            colorize: true
        })
    ],
    exitOnError: false
});

console.log = (...args) => logger.info.call(logger, ...args);
console.info = (...args) => logger.info.call(logger, ...args);
console.warn = (...args) => logger.warn.call(logger, ...args);
console.error = (...args) => logger.error.call(logger, ...args);
console.debug = (...args) => logger.debug.call(logger, ...args);

export function setupLogging(app: any) {
    console.log("Overriding Express logger");
    app.use(( < any > morgan)("combined", {
        stream: {
            write: function (message, encoding) {
                logger.info(message);
            }
        }
    }));
}