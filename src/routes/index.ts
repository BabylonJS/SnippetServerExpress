import { Router } from "express";
import * as controller from "../controllers/index";

export const index = Router();

// get snippet with id and version
index.get("/:id/:version", controller.getSnippet);
// get snippet with id
index.get("/:id", controller.getSnippet);

// create new snippet
index.post("/", controller.createSnippet);
// create a new version of a snippet
index.post("/:id", controller.createSnippet);
