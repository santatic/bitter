import * as express from "express";
import * as compression from "compression";
import * as bodyParser from "body-parser";
import * as expressValidator from "express-validator";
import * as cors from "cors";

import {
  setupEnvironments,
  setupMongoDB,
  setupLogging,
  setupAuth
} from "./configs";
import {
  pluginRouters
} from "./components/plugins/router";
import { strategyTest } from "./test/strategy.test";

// Load environments
setupEnvironments();

// Create Express server.
const app = express();

app.set("port", process.env.PORT || 1412);
app.set("host", process.env.HOST || "localhost");
app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(expressValidator());

app.use(cors({
  origin: "http://localhost:8080",
  optionsSuccessStatus: 200
}));

// Config
setupLogging(app);
setupMongoDB(app);
setupAuth(app);

// Router handler
app.use("/api/plugins", pluginRouters);

// Error handler
app.use(function (err, req, res, next) {
  console.error("[-] Express error: ", err);
  if (typeof err === "string") {
    err = {
      message: err
    };
  }
  if (err.status && typeof err.status !== "number") {
    err.status = 400;
  }

  res.status(err.status || 400);
  res.send({
    error: {
      code: err.code || err.status,
      message: err.message || err.msg,
    }
  });
});

// Start Express server.
app.listen(app.get("port"), app.get("host"), () => {
  console.log("App is running at http://%s:%d in %s mode", app.get("host"), app.get("port"), app.get("env"));
  console.log("Press CTRL-C to stop");
});

strategyTest();

export default app;