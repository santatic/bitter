import * as _ from "lodash";
import * as Boom from "boom";

import {
  TimeFrame
} from "../components/exchanges";

const second2Time = {
  5: TimeFrame.S5,
  10: TimeFrame.S10,
  15: TimeFrame.S15,
  30: TimeFrame.S30,
  60: TimeFrame.M1,
  120: TimeFrame.M2,
  300: TimeFrame.M5,
  600: TimeFrame.M10,
  900: TimeFrame.M15,
  1800: TimeFrame.M30,
  3600: TimeFrame.H1,
  7200: TimeFrame.H2,
  14400: TimeFrame.H4,
};
const time2Second = _.invert(second2Time);

export function parseTimeFrameFromSecound(sec: number): TimeFrame {
  if (!second2Time[sec]) {
    throw Boom.badData(`Candle time ${sec} is invalid`);
  }
  return second2Time[sec];
}

export function parseTimeFrameToSecond(timeframe: TimeFrame): number {
  if (!time2Second[timeframe]) {
    throw Boom.badData(`Candle time ${timeframe} is invalid`);
  }
  return _.toNumber(time2Second[timeframe]);
}