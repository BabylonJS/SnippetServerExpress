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
    const version = await layers[0].getNextVersion(id);
    const snippetResult: Snippet = {
        id,
        version,
        description: snippetRequest.description,
        jsonPayload: snippetRequest.payload,
        name: snippetRequest.name,
        snippetIdentifier: `${id}-${version}`,
        tags: snippetRequest.tags,
        metadata: snippetRequest.metadata,
        date: new Date().toISOString(),
    };

    for (const dataLayer of layers) {
        try {
            if (dataLayer.processSnippet) {
                const processed = dataLayer.processSnippet(snippetResult);
                await dataLayer.saveSnippet(processed);
            } else {
                await dataLayer.saveSnippet(snippetResult);
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
