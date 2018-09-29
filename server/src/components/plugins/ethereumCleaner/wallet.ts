import * as request from "request";

class EtherScanEthereumAPI {
  sendRawTransaction(raw: string): Promise < any > {
    return new Promise((resolve, reject) => {
      const endpoint = process.env.ETHERSCAN_ENDPOINT;
      const apiKey = process.env.ETHERSCAN_API_KEY;

      request({
        method: "GET",
        url: endpoint,
        qs: {
          module: "proxy",
          action: "eth_sendRawTransaction",
          apikey: apiKey,
          hex: raw
        }
      }, (err, response, body) => {
        console.log(err, body);
        if (err) return reject(err);

        resolve(parseInt(JSON.parse(body).result));
      });
    });
  }

  getBalance(address: string): Promise < any > {
    return new Promise((resolve, reject) => {
      const endpoint = process.env.ETHERSCAN_ENDPOINT;
      const apiKey = process.env.ETHERSCAN_API_KEY;

      request({
        method: "GET",
        url: endpoint,
        qs: {
          module: "account",
          action: "balance",
          address,
          tag: "latest",
          apikey: apiKey,
        }
      }, (err, response, body) => {
        console.log(err, body);
        if (err) return reject(err);

        resolve(parseInt(JSON.parse(body).result));
      });
    });
  }
}

export const etherScanEthereumAPI = new EtherScanEthereumAPI();