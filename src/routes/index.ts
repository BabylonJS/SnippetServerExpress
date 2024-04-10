import { Router } from "express";
import * as controller from "../controllers/index";
import { searchSnippets } from "../dataLayer/azureSearchIndexDataLayer";

export const index = Router();

index.get("/search", async (req, res) => {
    if(!req.query.query || typeof req.query.query !== "string") {
        res.status(400).send("missing query");
        return;
    }
    console.log("searching for " + req.query.query);
    const result = await searchSnippets(req.query.query);
    res.json(result);
    return;
});

// get snippet with id and version
index.get("/:id/:version", controller.getSnippet);
// get snippet with id
index.get("/:id", controller.getSnippet);

// create new snippet
index.post("/", controller.createSnippet);
// create a new version of a snippet
index.post("/:id", controller.createSnippet);
