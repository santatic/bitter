import {
    Symbol,
    ExchangeName
} from "./..";

export interface ITicker {
    exchange: ExchangeName;
    symbol: Symbol;

    ask: number;
    bid: number;
    high: number;
    low: number;
    open: number;
    close: number;
    last: number;

    volume: number;
    vwap: number;

    at: number;
}

export class Ticker implements ITicker {
    public exchange: ExchangeName;
    public symbol: Symbol;

    public ask: number;
    public bid: number;
    public high: number;
    public low: number;
    public open: number;
    public close: number;
    public last: number;

    public volume: number;
    public vwap: number;

    public at: number;
}