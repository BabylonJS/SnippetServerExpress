import { Snippet, SnippetStorageService } from "./interfaces";

const AzureSearchIndexDataLayer = (): SnippetStorageService => {
    const service = {
        getSnippet,
        getNextVersion,
        saveSnippet: addSnippetItem,
        processSnippet: snippetMapper,
    };
    return service;
};

const azureSearchIndexDataLayer = AzureSearchIndexDataLayer();
export default azureSearchIndexDataLayer;
export { azureSearchIndexDataLayer };

const getUrl = (type = "index", indexName = process.env.AZURE_SEARCH_INDEX_INDEX_NAME || "snippets") => {
    return `https://${process.env.AZURE_SEARCH_INDEX_SERVICE_NAME}.search.windows.net/indexes/${indexName}/docs/${type}?api-version=2023-11-01`;
};

const sek = process.env.AZURE_SEARCH_INDEX_KEY || "";

const headers: HeadersInit = {
    "Content-type": "application/json; charset=UTF-8",
    "api-key": sek,
};

export async function searchSnippets(query: string, searchType: "code" | "name" | "tags" | "description" | "all" = "all", page = 0) {
    const searchFields = searchType === "all" ? "" : searchType === "code" ? "jsonPayload" : searchType === "name" ? "name, description" : searchType;
    try {
        const result = await fetch(getUrl("search"), {
            // Adding method type
            method: "POST",

            // Adding body or contents to send
            body: JSON.stringify({
                search: query,
                top: 100,
                searchFields,
                skip: page * 100,
                facets: ["snippetIdentifier,count:10"],
            }),

            // Adding headers to the request
            headers,
        });

        if (!result.ok) {
            console.log(await result.json());
            throw new Error("error searching snippets");
        }
        return await result.json();
    } catch (e) {
        console.log("error searching snippets", e);
        throw new Error("error searching snippets");
    }
}

async function addSnippetItem(snippet: Snippet) {
    // skip indexing if the snippet is more than 200kb in size
    if (snippet.jsonPayload.length > (process.env.MAX_SNIPPET_SEARCH_INDEX_SIZE ? +process.env.MAX_SNIPPET_SEARCH_INDEX_SIZE : 300000)) {
        console.log("skipping indexing snippet", snippet.id, snippet.version);
        return;
    }
    console.log("indexing snippet", snippet.id, snippet.version, snippet.jsonPayload.length);
    let retires = 3;
    while (retires > 0) {
        try {
            const result = await fetch(getUrl("index"), {
                // Adding method type
                method: "POST",

                signal: AbortSignal.timeout(4000),

                // Adding body or contents to send
                body: JSON.stringify({
                    // adjust according to the search index!
                    value: [
                        {
                            "@search.action": "mergeOrUpload",
                            id: snippet.id,
                            version: snippet.version,
                            snippetIdentifier: snippet.snippetIdentifier,
                            jsonPayload: snippet.jsonPayload,
                            name: snippet.name,
                            description: snippet.description,
                            tags: snippet.tags?.split(",").map((tag) => tag.trim()) || [],
                            date: new Date(snippet.date),
                            // isWorking: snippet.metadata?.isWorking || false,
                            // fromDoc: snippet.metadata?.isFromDocs || false,
                        },
                    ],
                }),

                // Adding headers to the request
                headers,
            });

            if (!result.ok) {
                console.log("Error", await result.text());
                throw new Error("error indexing snippet");
            } else {
                console.log("indexed snippet", snippet.id, snippet.version);
                return;
            }
        } catch (e) {
            console.log("Retrying indexing snippet", e);
            retires--;
        }
    }
}

async function getSnippet(id: string, version = 0) {
    const result = await fetch(getUrl("search"), {
        // Adding method type
        method: "POST",

        body: JSON.stringify({
            filter: `id eq '${id}-${version}'`,
        }),

        // Adding headers to the request
        headers,
    });

    if (!result.ok) {
        console.log(await result.json());
        throw new Error("error getting snippet");
    }
    return await result.json();
}

async function getNextVersion(id: string) {
    const result = await fetch(getUrl("search"), {
        // Adding method type
        method: "POST",

        body: JSON.stringify({
            filter: `snippetIdentifier eq '${id}'`,
            select: "version",
            orderby: "version desc",
            top: 1,
        }),

        // Adding headers to the request
        headers,
    });

    if (!result.ok) {
        console.log(await result.json());
        throw new Error("error getting next version");
    }
    const res = await result.json();
    return res.value.length ? res.value[0].version + 1 : 0;
}

export const clearIndex = async (isApi = false, doNotDelete: string[] = []) => {
    console.log("clearing search index. isApi:", isApi);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getResults = async (params?: any) => {
        return await fetch(getUrl("search"), {
            // Adding method type
            method: "POST",

            body: JSON.stringify({
                top: 10000,
                ...params,
            }),
            // Adding headers to the request
            headers,
        });
    };
    const removeDocuments = async (ids: string[]) => {
        return await fetch(getUrl("index"), {
            // Adding method type
            method: "POST",

            // Adding body or contents to send
            body: JSON.stringify({
                value: ids.map((id) => {
                    return {
                        "@search.action": "delete",
                        id,
                    };
                }),
            }),

            // Adding headers to the request
            headers,
        });
    };
    const values = [];
    let result = await (await getResults()).json();
    while (result["@odata.nextLink"]) {
        values.push(...result.value);
        result = await (await getResults(result["@search.nextPageParameters"])).json();
    }
    values.push(...result.value);
    const filtered = values && values.filter((res: { path: string }) => !doNotDelete.includes(res.path));
    while (filtered.length) {
        const toDelete = filtered.splice(0, 50);
        const httpResult = await removeDocuments(toDelete.map((item) => item.id));
        console.log("Removed documents - ", toDelete.length, "api - ", isApi);
        if (!httpResult.ok) {
            throw new Error("error clearing index");
        }
    }
    console.log("search index cleared. isApi:", isApi);
};

const processJsonPayload = (jsonPayload: string) => {
    try {
        const payload = JSON.parse(jsonPayload);
        if (!payload.code) throw new Error("no code in snippet");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updated: any = {};
        Object.keys(payload).forEach((key) => {
            if (key !== "code") return;
            const code = payload[key];
            if (!code) {
                console.log("no code in snippet");
                return;
            }
            // remove base64 strings
            let processed: string = code.replace(/([0-9a-zA-Z+/]{100})/gm, "");
            processed = processed.replace(/([0-9a-zA-Z+/]{1})*(([0-9a-zA-Z+/]{40}==)|([0-9a-zA-Z+/]{40}=))/gm, "");
            // remove all references to BABYLON
            processed = processed.replace(/BABYLON\./gm, "");
            // round all numbers to 2 decimal places
            processed = processed.replace(/(\d+\.\d+)/gm, (match) => {
                return Number(match).toFixed(2);
            });
            // multiple white spaces to single space
            processed = processed.replace(/\s+/gm, " ");
            // remove \r
            processed = processed.replace(/\\r/gm, "");
            // remove multiple new lines
            processed = processed.replace(/\n{2,}/gm, "\n");
            // improve tokenization by removing dots in code, i.e. scene.meshes -> scene meshes
            // only remove dots between two letters to avoid tokenizing integers only
            processed = processed.replace(/([a-zA-Z])\.([a-zA-Z])/gm, "$1 $2");
            updated[key] = processed;
        });

        const str = JSON.stringify(updated);
        return str;
    } catch (e) {
        throw new Error("error parsing json, skipping");
    }
};
function snippetMapper(snippet: Snippet): Snippet {
    const jsonPayload = processJsonPayload(snippet.jsonPayload);
    if (!jsonPayload) throw new Error("error processing json payload");
    return {
        ...snippet,
        id: snippet.snippetIdentifier,
        snippetIdentifier: snippet.id,
        jsonPayload: processJsonPayload(snippet.jsonPayload),
    };
}
