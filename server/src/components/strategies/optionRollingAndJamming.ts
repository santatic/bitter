import {
    Strategy
} from "./base";

export class OptionRollingAndJammingStrategy extends Strategy {
    getInformation() {
        return {
            name: "Option Rolling and Jamming with Bollinger's Band (Hubba Hubba)"
        };
    }

    defaultSetting() {
        return {
            params: {
                bbands: {
                    period: 20,
                    deviation: 2,
                },
                expire: 1
            }
        };
    }

    async init() {
        this.addIndicator("bbands", "bbands", this.setting.params.bbands);
    }

    async onCandle(candle) {

    }
}