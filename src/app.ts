import express from "express";
import logger from "morgan";

import { errorHandler, errorNotFoundHandler } from "./middlewares/errorHandler";
import bodyParser from "body-parser";
// import timeout from "connect-timeout";
import dotenv from "dotenv";
dotenv.config();

// Routes
import { index } from "./routes/index";
import { populateDataLayers } from "./dataLayer/dataLayer";
// Create Express server
export const app = express();

populateDataLayers();

// Express configuration
app.set("port", process.env.PORT || 3000);
const supportedOrigins = process.env.CORS_ORIGINS?.split(",") || ["*"];
app.use(function (_req, res, next) {
    res.header("Access-Control-Allow-Origin", supportedOrigins.join(","));
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
// app.use(timeout("5s"));
app.use(logger("common"));
app.use(bodyParser.json({ limit: process.env.JSON_SIZE_LIMIT || "5mb" }));
app.use(haltOnTimedout);
// CORS
app.use("/", index);
app.use(haltOnTimedout);

app.use(errorNotFoundHandler);
app.use(errorHandler);

function haltOnTimedout(req: express.Request, res: express.Response, next: express.NextFunction) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!(req as any).timedout) next();
}
