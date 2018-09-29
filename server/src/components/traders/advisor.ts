import {
  ExchangeName,
  Symbol
} from "../exchanges";


export class TradingAdvisor {
  constructor(setting) {}

  long(option) {
    console.log("Advisor LONG");
  }

  short(option) {
    console.log("Advisor SHORT");
  }

  close(option) {
    console.log("Advisor CLOSE");
  }
}