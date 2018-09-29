import * as Inbox from "inbox";
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

  public username: string;
  public password: string;
}

export class ImapMailer {
  private imap;
  private listener: EventEmitter;

  constructor(config) {
    config = _.merge(new ImapConfig, config);

    this.imap = Inbox.createConnection(config.port, config.host, {
      secureConnection: config.tls,
      auth: {
        user: config.username,
        pass: config.password
      }
    });

    this.listener = new EventEmitter();
  }

  open = _.once(() => new Promise((resolve, reject) => {
    this.imap.on("connect", () => {
      console.debug("IMAP: Successfully connected to server");

      this.imap.openMailbox("INBOX", (error, info) => {
        if (error) return reject(error);

        resolve();
      });
    });

    this.imap.on("close", () => {
      console.debug("IMAP: Disconnected!");
      setTimeout(() => {
        this.imap.connect();
      }, 3000);
    });

    this.imap.on("new", (message) => {
      // console.debug("IMAP: New incoming message ", message);
      let body = "";
      this.imap.createMessageStream(message.UID).on("data", (buffer) => {
        body += buffer.toString();
      }, {
        end: true
      }).on("end", () => {
        // console.log(message, body);
        this.listener.emit("message", {
          uid: message.UID,
          sender: message.address,
          subject: message.title,
          body,
        });
      });
    });

    this.imap.connect();
    console.debug("IMAP: is connecting...");
  }));

  private messageParser(msg, seqno) {}

  onMessage(callback: Function) {
    this.open().then(() => this.listener.on("message", (message) => {
      callback(message);
    }));
  }
}