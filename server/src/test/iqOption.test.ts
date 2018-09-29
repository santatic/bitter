import {
    ExchangeName,
    Symbol,
    TimeFrame,
    ICandle,
    MarketDatatype,
    exchanger,
    Order,
    OrderType,
    ExchangeSide,
} from "../components/exchanges";

// gekko redis beacon
export const iqOptionTest = () => {
    // watchCandleUpdate();
    addNewOrder();
};

function watchCandleUpdate() {
    exchanger.onCandle(ExchangeName.IQOPTION, Symbol.EUR_USD, TimeFrame.S10, async (candle: ICandle) => {
        console.warn("Listening for canndle from IQ Option: EUR/USD", candle);
    });
}

async function addNewOrder() {
    const order = new Order();
    order.exchange = ExchangeName.IQOPTION;
    order.symbol = Symbol.EUR_USD;
    order.amount = 1;
    order.expire = 1;
    order.side = ExchangeSide.BUY;
    order.type = OrderType.BINARY_OPTION;

    try {
        await exchanger.newOrder(order);
    } catch (error) {
        console.error("====>", error);
    }
}