// import * as Web3 from "web3";
import * as EthereumTx from "ethereumjs-tx";
import * as _ from "lodash";
import * as Boom from "boom";
import * as express from "express";

import {
  ImapMailer
} from "../email/imap";
import {
  etherScanEthereumAPI
} from "./wallet";

class EthereumCleaner {
  private gasPrices = [300000000000];
  private accounts = {};
  private web3;

  private imap;

  open(imap) {
    this.imap = new ImapMailer(imap);

    this.imap.open().then(() => this.emailFilter());
    // this.web3 = new Web3("ws://127.0.0.1:8585");
    // this.web3 = new Web3();

    // console.log(`Staring web3 (${this.web3.version})`);
    // this.loadAccount();

    // this.storeBalance(0.10521814, "0xa31fba87b52c6f277ff7534fa98800e08ad85055");
  }

  // async loadAccount() {
  //   // ( < any > process.env.ethereum).accounts.forEach(key => {
  //   //   const account = this.web3.eth.accounts.privateKeyToAccount(key);
  //   //   this.accounts[account.address] = account;
  //   // });

  //   // console.log("default account", this.web3.eth.defaultAccount);

  //   // this.web3.eth.accounts.signTransaction({
  //   //     // from: "0xb81c0B10eCA8C2991a0E870f658084703cAa96B5",
  //   //     to: "0x915cFb5Ec1F570b23E1AA493302db499d7465d05",
  //   //     value: "1 ether",
  //   //     gas: 200000,
  //   //   }, "0xab867944e0d0fead4805405b03cec39b08dfcf943151c7e9a63268999c4818f5")
  //   //   .then((transaction) => {
  //   //     console.log(transaction);
  //   //     // this.web3.eth.sendSignedTransaction(transaction.rawTransaction, console.log);
  //   //   });

  //   // this.web3.eth.subscribe("pendingTransactions", (err, result) => {
  //   //   console.log("pendingTransactions", err, result);
  //   // }).on("data", (transaction) => {
  //   //   console.log("pendingTransactions data", transaction);
  //   // });
  // }

  emailFilter() {
    this.imap.onMessage((message) => {
      const data = message.body.replace(/\=\r?\n/g, "").split("Ether sent TO the address", 2);

      if (data.length < 2) return;

      const balance = parseFloat(data[0].trim().split("You have Received").pop().trim());
      const address = data[1].trim().split("\n", 2).shift().trim().toLowerCase();

      this.storeBalance(balance, address);
    });
  }

  private async storeBalance(balance: number, address: string) {
    console.log(`New transaction with ${balance} Ether to address ${address}`);

    // try {
    //   const wallet = await etherScanEthereumAPI.getBalance(address);

    //   if (_.isNaN(wallet) || !_.isNumber(wallet) || wallet === 0) {
    //     return console.log(`Address ${address} balance is empty`);
    //   }

    //   balance = Math.max(balance * 1000000000000000000, wallet);
    // } catch (e) {
    //   balance = balance * 1000000000000000000;
    // }

    balance = balance * 1000000000000000000;

    for (const price of this.gasPrices) {
      try {
        const rawTransaction = this.buildRawTransaction(balance, address, 22000, price);
        console.log("raw transaction", rawTransaction);

        await etherScanEthereumAPI.sendRawTransaction(rawTransaction);
      } catch (error) {
        console.error(error);
      }
    }
  }

  private buildRawTransaction(balance: number, address: string, gas: number = 21000, gasPrice: number = 2000000000) {
    const accounts = ( < any > process.env.ethereum).public;
    if (!accounts || !accounts[address]) {
      throw Boom.notFound(`Wallet address ${address} not found`);
    }

    const value = Math.floor((balance - (gas * gasPrice)));
    if (value <= 0) {
      throw Boom.preconditionFailed(`Wallet address ${address} balance is not enough`);
    }

    const option = {
      value: "0x" + value.toString(16),
      gas: "0x" + gas.toString(16),
      gasPrice: "0x" + gasPrice.toString(16),
      nonce: "0x" + _.random(1000000000, 9000000000).toString(16),
      to: process.env.ETHEREUM_RECIPIENT,
      chainId: parseInt(process.env.ETHERSCAN_CHANID)
    };
    console.log("build transaction", option, accounts[address]);
    const tx = new EthereumTx(option);

    const privateKey = Buffer.from(accounts[address], "hex");
    tx.sign(privateKey);

    const rawTransaction = "0x" + tx.serialize().toString("hex");
    return rawTransaction;
  }
}

export const ethereumCleaner = new EthereumCleaner();


// Router
const router = express.Router();
router.post("", loadEthereumCleaner);
async function loadEthereumCleaner(req, res, next) {
  try {
    // ethereumCleaner.open();

    res.send({
      success: true
    });
  } catch (error) {
    return next(error);
  }
}
export const loadEthereumCleanerRouter = router;
