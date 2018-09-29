import * as _ from "lodash";
import * as Boom from "boom";
// import * as talib from "talib";

const verifyParams = (self, params) => {
    _.each(self.requiredParams, paramName => {
        if (!_.has(params, paramName))
            throw Boom.preconditionRequired(`${self.name} requires ${paramName}`);

        const val = params[paramName];
        if (!_.isNumber(val)) {
            throw Boom.preconditionRequired(`${self.name} needs to be a number`);
        }
    });
};

const execute = async (params) => {
    // return await talib.execute(params);
};

export const cci = {
    requires: ["period"],
    create: (params) => {
        verifyParams(this, params);

        return async (data) => await execute({
            name: this.name,
            high: data.high,
            low: data.low,
            close: data.close,
            startIdx: 0,
            endIdx: data.high.length - 1,
            optInTimePeriod: params.period
        });
    }
};