import express from "express";
import logger from "morgan";

import { errorHandler, errorNotFoundHandler } from "./middlewares/errorHandler";
import bodyParser from "body-parser";
import dotenv from "dotenv";
dotenv.config();

// Routes
import { index } from "./routes/index";
// Create Express server
export const app = express();

// Express configuration
app.set("port", process.env.PORT || 3000);

app.use(logger("common"));
app.use(
    bodyParser.json({
        limit: process.env.JSON_SIZE_LIMIT || "5mb",
    })
);

// CORS
const supportedOrigins = process.env.CORS_ORIGINS?.split(",") || ["*"];
app.use(function (_req, res, next) {
    res.header("Access-Control-Allow-Origin", supportedOrigins.join(","));
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
app.use("/", index);

app.use(errorNotFoundHandler);
app.use(errorHandler);
