import {
    ExchangeName,
    Symbol
} from "../components/exchanges";
import {
    candleImporter
} from "../components/backtest/importer";

export const candleImportTest = () => {
    const sinceInSec = Math.round(Date.now() / 1000) - 60 * 60 * 24 * 100; // -7 days
    const toInSec = Math.round(Date.now() / 1000) - 60 * 60 * 24 * 1; // -1 days

    candleImporter.import(ExchangeName.IQOPTION, Symbol.EUR_USD, sinceInSec, toInSec);
};