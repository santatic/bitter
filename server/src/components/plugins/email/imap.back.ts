import * as Imap from "imap";
import * as _ from "lodash";
import {
  inspect
} from "util";
import {
  EventEmitter
} from "events";


export class ImapConfig {
  public host: string = "imap.gmail.com";
  public port: number = 993;
  public tls: boolean = true;

  public user: string;
  public password: string;
}

export class ImapMailer {
  private imap;
  private listener: EventEmitter;

  constructor(config) {
    this.imap = new Imap(_.merge(new ImapConfig, config));

    this.listener = new EventEmitter();
  }

  open = _.once(() => new Promise((resolve, reject) => {
    this.imap.once("ready", () => {
      console.debug("Imap was ready!");

      this.imap.subscribeBox("INBOX", (a, b, c) => {
        console.log("on new message", a, b, c);
      });

      this.imap.openBox("INBOX", true, (err, box) => {
        if (err) reject(err);

        console.debug("Imap open INBOX success!");

        const fetch = this.imap.seq.fetch("1:3", {
          bodies: ["HEADER.FIELDS (FROM SUBJECT)", "TEXT"],
          struct: true
        });

        fetch.on("message", (msg, seqno) => {
          this.messageParser(msg, seqno);
        });

        resolve();
      });
    });

    this.imap.once("error", reject);
    this.imap.once("end", reject);
    this.imap.connect();

    console.debug("Imap is connecting...");
  }));

  private messageParser(msg, seqno) {
    let header;
    let body;
    msg.on("body", (stream, info) => {
      let buffer = "";

      stream.on("data", (chunk) => {
        buffer += chunk.toString("utf8");
      });

      stream.once("end", () => {
        if (info.which === "TEXT") {
          body = buffer;
        } else {
          header = inspect(Imap.parseHeader(buffer));
        }
      });
    });

    msg.on("end", () => {
      this.listener.emit("message", body, header, seqno);
    });
  }

  onMessage(callback: Function) {
    this.open().then(() => this.listener.on("message", (buffer, header, seqno) => {
      callback(buffer, header, seqno);
    }));
  }
}