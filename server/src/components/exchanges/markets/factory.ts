import * as Boom from "boom";
import * as _ from "lodash";
import {
    EventEmitter
} from "events";

import {
    Market
} from "./../domains";
import {
    ExchangeName
} from "./../types";
import {
    WsExchanger,
    HttpExchanger,
    IQOptionExchanger
} from "..";
import {
    CryptoExchanger
} from "./crypto";

// todo: cleanup
class ExchangeFactory {
    private markets: Map < ExchangeName, Map < String, HttpExchanger | WsExchanger > > = new Map();
    private listener: EventEmitter = new EventEmitter();

    getExchange(name: ExchangeName): Promise < HttpExchanger | WsExchanger > {
        return new Promise(async (resolve, reject) => {
            this.listener.once(name, (error, exchange) => {
                if (error) return reject(error);
                resolve(exchange);
            });
            this.initExchange(name);
        });
    }

    private async initExchange(name) {
        if (this.markets[name] instanceof Promise) {
            return;
        }
        if (this.markets[name]) {
            this.listener.emit(name, undefined, this.markets[name]);
            return;
        }

        this.markets[name] = new Promise(() => {});
        console.log(`Market ${name} loading`);
        // todo: trick for iq option, will update later
        if (name === ExchangeName.IQOPTION) {
            const market = new IQOptionExchanger();
            market
                .init()
                .then(() => {
                    this.markets[name] = market;
                    this.listener.emit(name, undefined, market);
                })
                .catch((error) => this.listener.emit(name, error));
            return;
        }

        // load market
        let setting = await Market.findOne({
            name
        });
        if (!setting) {
            // this.isProcessing = false;
            // return reject(Boom.notFound(`Market ${name} setting not found`));
            setting = new Market();
        }
        const market = new CryptoExchanger(name, {
            apiKey: setting.key,
            secret: setting.secret
        });
        market.init()
            .then(() => {
                this.markets[name] = market;
                this.listener.emit(name, undefined, market);
            })
            .catch((error) => this.listener.emit(name, error));
    }
}
export const exchangeFactory = new ExchangeFactory();