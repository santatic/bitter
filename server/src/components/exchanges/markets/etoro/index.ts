import * as _ from "lodash";
import * as WebSocket from "ws";
import * as Boom from "boom";
import * as _request from "request";
import * as BlueBird from "bluebird";

import {
  IOrder,
  ExchangeSide,
  Symbol,
  OrderType,
  Position,
  IPosition,
  PositionStatus,
  ExchangeName,
  PositionStrategy,
} from "../..";
import {
  getUuid,
  getDeviceId
} from "../../../../helpers";
import {
  symbolToId,
  symbolFromId
} from "./symbolMapping";
import {
  IEtoroExpert,
  EtoroExpert,
  EtoroTrade,
  IEtoroTrade
} from "../../../plugins/etoro";

const request: any = BlueBird.promisifyAll(_request, {
  multiArgs: true
});

///////////////////////////////
export interface IEtoroPositionTag {
  expertId: number;
  instrumentID: number;
}

export enum EtoroAccountType {
  REAL = "Real", DEMO = "Demo"
}

enum HttpMethod {
  GET = "get",
    POST = "post",
    DELETE = "delete"
}

export class EtoroMarketExchange {
  private endpoint: string = "https://www.etoro.com";

  private headers: any = {
    "accept": "application/json, text/plain, */*",
    "accept-encoding": "gzip, deflate, br",
    "applicationidentifier": "ReToro",
    "applicationversion": "95.0.1",
    "content-type": "application/json",
    // "host": "www.etoro.com",
    "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36",

    "authorization": "NV%7CMfVANN5xNbNA4WbVcL9hTuCqQBu5OGPNLSoNxeNXw3fsuBe9U9Odx2MXYaZ0Yf1NnfzKTWSgBeUwzTX2zS1gDkUgZULMk52RMgZKWkJfLOB8Lu07fBHuPDXjKaiDIoqunvkNNH9GoO3pamaT%7CtB%7CByHSJTXUX7eCc2zbP1KrmtnwOqEgVowp4qXntF6tGGKCOAlRa7Yspul6dUsLlMZvFBylqYQJPooMux66XKWXAmm4p9QWvH%7CCzlOxzL528Ddvj3mDU0OIV52aS19EjHsUwlXklrWx8uX5kslwNFqpZs5wHCgt%7ChvrwiGrws71EZq35Q1tbqZPnRbD5K6mNfQ__",
    "cookie": "visid_incap_20269=yP5Tbc1qT7+kuRcLusjvqHgI2loAAAAAQUIPAAAAAACAKQiCnHll2acEZkp6YKml; _ga=GA1.2.1111384389.1524238462; etoro_rmk_visit_v1=a-34; G_ENABLED_IDPS=google; etoroHPRedirect=1; intercom-lou-x8o64ufr=1; visid_incap_773285=jgCzRQgyRnSbxrkS+VAHZ2f12loAAAAAQUIPAAAAAAAmZxX7Jt3u5rDe/CT+XnTX; _ym_uid=1524299116343229682; mp_a46ed246b149568e354e40df267dcbe2_mixpanel=%7B%22distinct_id%22%3A%20%22162e74ea7ce37-0c8196dcf8f004-3b7c015b-1fa400-162e74ea7cf15a3%22%2C%22%24initial_referrer%22%3A%20%22%24direct%22%2C%22%24initial_referring_domain%22%3A%20%22%24direct%22%7D; posts_view=a%3A1%3A%7Bi%3A0%3Bs%3A5%3A%2224944%22%3B%7D; __zlcmid=mGhJlDWsVoTekd; nlbi_20269=jcnaD2q2Nyuc/8m1W3HQvwAAAAByh140ecV4SM4a2Jc/1J8T; incap_ses_431_20269=16vrP+LVMkxgN1lBIDn7Bc0b81oAAAAAaZk39s316p5du+3RBZ7dEg==; eToroLocale=en-gb; TMIS2=9a74f2a102375b68ae57c89253d9c7530322a1fb2fe9a337d0e320615e7e16cd6d439ac8f7154971eafd369b2beefd9989c03b2ef24ef87b116c3b6eb9a78894b3e64dff5be8da07da786698458b98fa4cd52a68c71c013b22d060a7642a7a3a1034b281e43199d3241695562ad162ecbd836467a2cf168f07742471591fdcd9ca; mp_dbbd7bd9566da85f012f7ca5d8c6c944_mixpanel=%7B%22distinct_id%22%3A%20%22162e3b1301f63c-09560d0c696cd3-3b7c015b-1fa400-162e3b13020e2d%22%2C%22%24initial_referrer%22%3A%20%22%24direct%22%2C%22%24initial_referring_domain%22%3A%20%22%24direct%22%2C%22__alias%22%3A%209716487%2C%22utm_source%22%3A%20%2257602%22%2C%22utm_medium%22%3A%20%22email%22%2C%22utm_campaign%22%3A%20%22249%22%2C%22KYCExperiment333%22%3A%20%22AfterDeposit%22%7D; _gid=GA1.2.1945662055.1525883380; _gat=1; TS01047baf=01f1b32d7ec6a6809677dafb411be0e785f0a031e62f4373a58a14ff96645aa7641b8e934b8573b91d6b590ca437bef77108f616b311df5b33c60c22a4ad094c6ce62e2dd9"
  };

  // private deviceId: string;`
  private accountType: EtoroAccountType;

  constructor(accountType: EtoroAccountType = EtoroAccountType.DEMO) {
    // this.deviceId = getDeviceId();
    this.accountType = accountType;
  }

  init = _.once((account: {
    username: string,
    password: string
  }): Promise < any > => {
    return Promise.resolve();
    // return this.login(account);
  });

  login = _.once((account: {
    username: string,
    password: string
  }): Promise < any > => new Promise(async (resolve, reject) => {
    const [response, data] = await this.request(HttpMethod.POST, "/api/sts/v2/login/", {
      "UserLoginIdentifier": account.username,
      "Username": account.username,
      "Password": account.password,
      "rememberMe": true
    });

    this.headers.authorization = data.accessToken;
    if (!this.headers.authorization) {
      return reject("Etoro login false");
    }

    resolve();
  }));

  newOrder(order: IOrder): Promise < any > {
    return new Promise(async (resolve, reject) => {
      const orderType = order.type == OrderType.LIMIT ? "orders" : "positions";
      const params: any = {
        "Amount": order.amount,
        "Rate": order.price,
        "IsBuy": order.side == ExchangeSide.BUY,
        "InstrumentID": this.getInstrumentID(order.symbol),
        "Leverage": order.leverage || 1,
        "IsTslEnabled": order.trailingStop || false,
        "ClientViewRate": order.price,
      };

      if (order.side === ExchangeSide.BUY) {
        params.StopLossRate = order.stopLoss || Math.floor(order.price / 10);
        params.TakeProfitRate = order.takeProfit || order.price * 10;
      } else {
        params.StopLossRate = order.stopLoss || order.price * 10;
        params.TakeProfitRate = order.takeProfit || Math.floor(order.price / 10);
      }

      console.log("new order", params);
      const [response, data] = await this.request(HttpMethod.POST, `/sapi/trade-${this.accountType.toLowerCase()}/${orderType}`, params);

      const token = data.Token;
      if (!token) {
        return reject(`new order error: ${data.Message}`);
      }
      resolve(token);
    });
  }

  // public
  getExperts(expertIds: Array < number > ): Promise < Array < IEtoroExpert > > {
    return new Promise(async (resolve, reject) => {
      const [response, data] = await this.request(HttpMethod.GET, `/api/logininfo/v1.1/aggregatedInfo`, {
        cidList: JSON.stringify(expertIds),
        realcid: true
      });

      const users = _.map(data.Users, (user) => {
        const expert = new EtoroExpert();
        expert.cid = user.realCID;
        expert.name = user.username;
        expert.avatar = user.avatars[1].url;
        return expert;
      });
      resolve(users);
    });
  }

  getExpertPortfolios(expertId: number): Promise < Array < any > > {
    return new Promise(async (resolve, reject) => {
      const [response, data] = await this.request(HttpMethod.GET, `/sapi/trade-data-real/live/public/portfolios`, {
        cid: expertId
      });

      const ids = data.AggregatedPositions.map(r => r.InstrumentID);
      if (ids.length === 0) {
        return reject(`Get expert error: ${data.Message}`);
      }
      const result = await BlueBird.reduce(ids, async (results: Array < any > , id: any) => {
        const details = await this.getExpertPositions(expertId, id);
        results.push(...details);
        return results;
      }, []);
      resolve(result);
    });
  }

  getExpertPositions(expertId: number, instrumentID: string): Promise < any > {
    return new Promise(async (resolve, reject) => {
      const [response, data] = await this.request(HttpMethod.GET, `/sapi/trade-data-real/live/public/positions`, {
        cid: expertId,
        InstrumentID: instrumentID
      });

      const positionsRaw = data.PublicPositions;
      const positions = positionsRaw.map(p => {
        const position = new Position();
        position.strategy = PositionStrategy.ETORO_EXPERT;
        position.exchange = ExchangeName.ETORO;
        position.positionId = p.PositionID;
        position.symbol = this.getSymbol(p.InstrumentID);
        position.side = p.IsBuy === true ? ExchangeSide.BUY : ExchangeSide.SELL;

        position.status = PositionStatus.OPEN;
        position.amount = p.Amount;
        position.price = p.OpenRate;
        position.stopLoss = p.StopLossRate;
        position.takeProfit = p.TakeProfitRate;
        position.trailingStop = p.IsTslEnabled;
        position.leverage = p.Leverage;

        position.tag = < IEtoroPositionTag > {
          expertId: p.CID,
          instrumentID: p.InstrumentID
        };
        return position;
      });
      resolve(positions);
    });
  }

  getExpertTradeSummary(expertId: number): Promise < Array < IEtoroTrade > > {
    return new Promise(async (resolve, reject) => {
      const [response, data] = await this.request(HttpMethod.GET, `/sapi/userstats/stats/cid/8503793/trades/oneYearAgo`, {
        CopyAsAsset: true
      });

      const trades = _.map(data.assets, (asset): IEtoroTrade => {
        const trade = new EtoroTrade();
        trade.expertId = expertId;
        trade.symbol = this.getSymbol(asset.instrumentId);
        trade.totalTrades = asset.totalTrades;
        trade.pctOfTrades = asset.pctOfTrades;
        trade.pctOfInvestment = asset.pctOfInvestment;
        trade.winRatio = asset.winRatio;
        trade.avgProfitPct = asset.avgProfitPct;
        trade.avgLossPct = asset.avgLossPct;
        trade.avgHoldingTimeInMinutes = asset.avgHoldingTimeInMinutes;
        return trade;
      });
      resolve(trades);
    });
  }

  getSymbolMapping(): Promise < any > {
    return new Promise(async (resolve, reject) => {
      const [response, data] = await this.request(HttpMethod.GET, `https://api.etorostatic.com/sapi/instrumentsmetadata/V1.1/instruments`);

      const instruments = data.InstrumentDisplayDatas;
      const symbols = instruments.map(i => {
        return {
          id: i.InstrumentID,
          image: i.Images[0].Uri,
          name: i.InstrumentDisplayName.trim(),
          symbol: i.SymbolFull.trim()
        };
      });
      resolve(symbols);
    });
  }

  private getInstrumentID(symbol: Symbol): number {
    if (symbolToId[symbol]) {
      return symbolToId[symbol];
    }
    return symbolToId[symbol.replace("/", "")];
  }

  private getSymbol(instrumentID: number): Symbol {
    return symbolFromId[instrumentID];
  }

  // http
  private async request(method: HttpMethod, api: string, params: Object = {}) {
    const options: any = {
      headers: _.merge({
        "accounttype": this.accountType || EtoroAccountType.DEMO,
        "x-csrf-token": "wGLRuGOpVeYCQSb6u-xxfQ__",
      }, this.headers),
      qs: {
        client_request_id: getUuid()
      },
      gzip: true,
      jar: true,
      forever: true
    };

    let httpFunction;
    if (method === HttpMethod.GET) {
      httpFunction = request.getAsync;
      _.merge(options.qs, params);

    } else if (method === HttpMethod.DELETE) {
      httpFunction = request.deleteAsync;
      _.merge(options.qs, params);

    } else if (method === HttpMethod.POST) {
      httpFunction = request.postAsync;
      options.body = JSON.stringify(params);

    } else {
      throw Boom.preconditionFailed(`Method ${method} is invalid`);
    }

    const endpoint = api.startsWith("/") ? `${this.endpoint}${api}` : api;
    const [response, data] = await httpFunction(endpoint, options);
    return [response, JSON.parse(data)];
  }
}

export const etoroMarketExchange = _.once(async (): Promise < EtoroMarketExchange > => {
  console.log("Loading etoro market exchange");

  const etoro = new EtoroMarketExchange(EtoroAccountType.DEMO);
  await etoro.init({
    username: process.env.ETORO_ACCOUNT_USERNAME,
    password: process.env.ETORO_ACCOUNT_PASSWORD
  });
  return etoro;
});