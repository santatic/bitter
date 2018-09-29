import {
    Strategy,
} from "./base/strategy";

export class CCI extends Strategy {

    getInformation() {
        return {
            name: "CCI"
        };
    }

    defaultSetting() {
        return {
            setting: {
                checkCandle: true,
                checkTicker: false
            },
            params: {
                cci: 14,
                low: 30,
                high: 70,
                persistent: 1
            }
        };
    }

    async init() {
        this.addIndicator("cci", "cci", this.setting.params.cci);
    }

    async onCandle(candle) {
        console.log(this.indicators.cci.result);
    }
}