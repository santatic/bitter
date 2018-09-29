import * as _ from "lodash";
import * as Boom from "boom";
import * as tulind from "tulind";

const verifyParams = (self, params) => {
    _.each(self.requiredParams, paramName => {
        if (!_.has(params, paramName)) {
            throw Boom.preconditionRequired(`${self.name} requires ${paramName}`);
        }

        const val = params[paramName];
        if (!_.isNumber(val)) {
            throw Boom.preconditionRequired(`${self.name} needs to be a number`);
        }
    });
};

const execute = async (params): Promise < any > => {
    return new Promise((resolve, reject) => {
        const minPeriod = params.indicator.start(params.options);
        if (params.inputs.length > 0 && params.inputs[0].length < minPeriod) {
            return resolve();
        }

        params.indicator.indicator(params.inputs, params.options, (error, result) => {
            if (error) return reject(error);

            const table = {};
            for (let i = 0; i < params.results.length; ++i) {
                table[params.results[i]] = result[i];
            }
            resolve(table);
        });
    });
};

export const cci = {
    requires: ["period"],
    create: (params) => {
        verifyParams(this, params);
        return (data): Promise < any > => execute({
            indicator: tulind.indicators.cci,
            inputs: [data.high, data.low, data.close],
            options: [params.period],
            results: ["result"],
        });
    }
};


export const ema = {
    requires: ["period"],
    create: (params) => {
        verifyParams(this, params);
        return (data): Promise < any > => execute({
            indicator: tulind.indicators.ema,
            inputs: [data.close],
            options: [params.period],
            results: ["result"],
        });
    }
};

export const rsi = {
    requires: ["period"],
    create: (params) => {
        verifyParams("rsi", params);
        return (data): Promise < any > => execute({
            indicator: tulind.indicators.rsi,
            inputs: [data.close],
            options: [params.period],
            results: ["result"],
        });
    }
};

export const bbands = {
    requires: ["period", "deviation"],
    create: (params) => {
        verifyParams("bbands", params);

        return (data): Promise < any > => execute({
            indicator: tulind.indicators.bbands,
            inputs: [data.close],
            options: [params.period, params.deviation],
            results: ["lower", "middle", "upper"],
        });
    }
};

export const stoch = {
    requires: ["fastKPeriod", "slowKPeriod", "slowDPeriod"],
    create: (params) => {
        verifyParams("stoch", params);

        return (data): Promise < any > => execute({
            indicator: tulind.indicators.stoch,
            inputs: [data.high, data.low, data.close],
            options: [params.fastKPeriod, params.slowKPeriod, params.slowDPeriod],
            results: ["stochK", "stochD"],
        });
    }
};