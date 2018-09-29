import * as Bluebird from "bluebird";

import {
  IEtoroTrade,
  IEtoroExpert,
  EtoroExpert,
  EtoroTrade
} from ".";
import {
  etoroMarketExchange,
  IPosition,
  Position,
  PositionStrategy,
  PositionStatus
} from "../../exchanges";

class PluginEtoroManager {

  async getExperts(ids: Array < number > ): Promise < Array < IEtoroExpert >> {
    const etoro = await etoroMarketExchange();
    const expertsRaw = await etoro.getExperts(ids);

    return Bluebird.map(expertsRaw, (expert): Promise < IEtoroExpert > =>
      new Promise((resolve, reject) => {
        EtoroExpert.findOneAndUpdate({
          cid: expert.cid,
          name: expert.name,
        }, {
          cid: expert.cid,
          name: expert.name,
          avatar: expert.avatar,
          status: expert.status,
        }, {
          upsert: true,
          new: true
        }, (err, data) => {
          if (err) {
            return reject(err);
          }
          resolve(data);
        });
      })
    );
  }

  async getExpertTrades(expertId: number): Promise < Array < IEtoroTrade >> {
    const etoro = await etoroMarketExchange();
    const tradesRaw = await etoro.getExpertTradeSummary(expertId);

    return Bluebird.map(tradesRaw, (trade): Promise < IEtoroTrade > =>
      new Promise((resolve, reject) => {
        EtoroTrade.findOneAndUpdate({
          expertId: trade.expertId,
          symbol: trade.symbol,
        }, {
          expertId: trade.expertId,
          symbol: trade.symbol,
          totalTrades: trade.totalTrades,
          pctOfTrades: trade.pctOfTrades,
          pctOfInvestment: trade.pctOfInvestment,
          winRatio: trade.winRatio,
          avgProfitPct: trade.avgProfitPct,
          avgLossPct: trade.avgLossPct,
          avgHoldingTimeInMinutes: trade.avgHoldingTimeInMinutes,
        }, {
          upsert: true,
          new: true
        }, (err, data) => {
          if (err) {
            return reject(err);
          }
          resolve(data);
        });
      }));
  }

  async getExpertPositions(expertIds: Array < number > ): Promise < Array < IPosition >> {
    const etoro = await etoroMarketExchange();
    const positions = await Bluebird.reduce(expertIds, async (result, expertId) => {
      const positions = await etoro.getExpertPortfolios(expertId);
      result.push(...positions);
      return result;
    }, []);


    return Bluebird.map(positions, (position): Promise < IPosition > =>
      new Promise((resolve, reject) =>
        Position.findOneAndUpdate({
          market: position.market,
          symbol: position.symbol,
          positionId: position.positionId,
        }, {
          status: position.status,
          market: position.market,
          symbol: position.symbol,
          orderId: position.orderId,
          positionId: position.positionId,
          strategy: position.strategy,
          side: position.side,
          price: position.price,
          amount: position.amount,
          filled: position.filled,
          leverage: position.leverage,
          stopLoss: position.stopLoss,
          trailingStop: position.trailingStop,
          takeProfit: position.takeProfit,
          tag: position.tag,
        }, {
          upsert: true,
          new: true
        }, (err, data) => {
          if (err) {
            return reject(err);
          }
          resolve(data);
        })
      ));
  }

  async getCopyClosedPosition(openingPositionIds: Array < number > ): Promise < Array < IPosition >> {
    return await Position.find({
      status: PositionStatus.OPEN,
      strategy: PositionStrategy.ETORO_COPY_EXPERT,
      parrentId: {
        $nin: openingPositionIds
      }
    });
  }
}

export const pluginEtoroManager = new PluginEtoroManager();