import {
    Strategy
} from "./base";
import {
    ICandle
} from "../exchanges";

export class SureFireHedgingStrategy extends Strategy {
    getInformation() {
        return {
            name: "Sure-Fire Hedging"
        };
    }

    defaultSetting() {
        return {
            params: {
                rsi: 14,
                low: 30,
                high: 70,
                persistent: 1
            }
        };
    }

    async init() {
        this.addIndicator("rsi", "rsi", this.setting.params.rsi);
    }

    async onCandle(candle) {
        console.log("RSI", this.indicators.rsi.result);
    }
}