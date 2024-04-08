import { Request, Response } from "express";
import { generateSnippetId, getDataLayer } from "../dataLayer/dataLayer";
import { Snippet, SnippetRequest } from "../dataLayer/interfaces";

export const getSnippet = async (req: Request, res: Response): Promise<void> => {
    const dataLayer = await getDataLayer();
    // get version
    const version = req.params.version ? +req.params.version : 0;
    try {
        const snippet = await dataLayer.getSnippet(req.params.id, version);
        res.json(snippet);
    } catch (error) {
        // console.log(error);
        res.status(404).send("Snippet not found");
    }
};

export const createSnippet = async (req: Request, res: Response): Promise<void> => {
    const dataLayer = await getDataLayer();
    const snippetRequest: SnippetRequest = req.body;
    const id = req.params.id || snippetRequest.id || generateSnippetId();
    const version = await dataLayer.getNextVersion(id);
    const snippet: Snippet = {
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
    try {
        await dataLayer.saveSnippet(snippet);
        res.json(snippet);
    } catch (error) {
        // console.log(error);
        res.status(500).send("Error saving snippet");
    }
};
