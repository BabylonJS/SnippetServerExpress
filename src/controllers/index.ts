import { Request, Response } from "express";
import { createDataLayers, generateSnippetId, getDataLayers } from "../dataLayer/dataLayer";
import { Snippet, SnippetRequest } from "../dataLayer/interfaces";

export const getSnippet = async (req: Request, res: Response): Promise<void> => {
    const layers = getDataLayers;
    if (layers.length === 0) {
        res.status(500).send("No data layers available");
        return;
    }
    const version = req.params.version ? +req.params.version : 0;
    let resolved = false;
    // make sure we for-each async sequentially
    await layers.reduce(async (previousPromise, layer) => {
        await previousPromise;
        try {
            const snippet = await layer.getSnippet(req.params.id, version);
            if (snippet && !resolved) {
                res.json(snippet);
                resolved = true;
            }
        } catch (error) {
            // no-op, go to the next one
        }
    }, Promise.resolve());

    if (!resolved) {
        res.status(404).send("Snippet not found");
    }
};

export const createSnippet = async (req: Request, res: Response): Promise<void> => {
    const layers = createDataLayers;

    if (layers.length === 0) {
        res.status(500).send("No data layers available");
        return;
    }
    const snippetRequest: SnippetRequest = req.body;
    let id = req.params.id || snippetRequest.id || generateSnippetId();
    // is snippet was generated, check it does not already exist!
    if (!(req.params.id || snippetRequest.id)) {
        // use main layer
        try {
            const snippetTest = await layers[0].getSnippet(id);
            if (snippetTest) {
                let searchNewId = true;
                while (searchNewId) {
                    id = generateSnippetId();
                    const snippetTest = await layers[0].getSnippet(id);
                    if (!snippetTest) {
                        searchNewId = false;
                    }
                }
            }
        } catch (e) {
            // no-op
        }
    }
    // get the next version of the main data layer
    if (req.query.version) {
        // a version was provided, check if the update key was provided a well
        if (!req.query.updateKey || (req.query.updateKey as string) !== process.env.UPDATE_KEY) {
            res.status(400).send("updateKey is required when providing a version");
            return;
        }
    }
    const version = req.query.version ? +(req.query.version as string) : await layers[0].getNextVersion(id);
    console.log("Creating snippet", id, version, snippetRequest.date);
    const snippetResult: Snippet = {
        id,
        version,
        description: snippetRequest.description,
        jsonPayload: snippetRequest.payload,
        name: snippetRequest.name,
        snippetIdentifier: `${id}-${version}`,
        tags: snippetRequest.tags,
        metadata: snippetRequest.metadata,
        date: snippetRequest.date ?? new Date().toISOString(),
    };

    for (const dataLayer of layers) {
        try {
            if (dataLayer.processSnippet) {
                try {
                    const processed = dataLayer.processSnippet(snippetResult);
                    await dataLayer.saveSnippet(processed, req.query.version ? true : false);
                } catch (e) {
                    console.log("Error processing snippet on data layer " + layers.indexOf(dataLayer));
                    //no-op - if process snippet fails, do nothing.
                }
            } else {
                await dataLayer.saveSnippet(snippetResult, req.query.version ? true : false);
            }
        } catch (error) {
            console.log(error);
            res.status(500).send("Error saving snippet on data layer " + layers.indexOf(dataLayer));
            return;
        }
    }
    res.json(snippetResult);
    return;
};
