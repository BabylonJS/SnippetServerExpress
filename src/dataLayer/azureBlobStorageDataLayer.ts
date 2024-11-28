import { AzureCliCredential, ManagedIdentityCredential } from "@azure/identity";
import type { SnippetStorageService, Snippet } from "./interfaces";
import { BlobServiceClient } from "@azure/storage-blob";
const useManagedIdentity = process.env.PRODUCTION === "true";
// this is a singleton that is created once and used throughout the application
const AzureBlobStorageService = (): SnippetStorageService => {
    console.log("Azure Blob storage init");

    const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    if (!accountName) throw Error("Azure Storage accountName not found");

    const blobServiceClient = new BlobServiceClient(
        `https://${accountName}.blob.core.windows.net`,
        !useManagedIdentity ? new AzureCliCredential() : new ManagedIdentityCredential()
    );

    const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || "snippets";
    if (!containerName) throw Error("Azure Storage containerName not found");

    const containerClient = blobServiceClient.getContainerClient(containerName);
    const service = {
        getSnippet: async (id: string, version: number = 0): Promise<Snippet> => {
            // get the blob name
            const blobName = `${id}/${version}`;
            const blockBlobClient = containerClient.getBlockBlobClient(blobName);
            // get the blob content
            const blobContent = await blockBlobClient.downloadToBuffer();
            // create the snippet object
            return JSON.parse(blobContent.toString()) as Snippet;
        },
        getNextVersion: async (id: string): Promise<number> => {
            // get the metadata blob
            const metadataBlob = `${id}/metadata`;
            const metadataBlobClient = containerClient.getBlockBlobClient(metadataBlob);
            // get the metadata blob content
            if (!(await metadataBlobClient.exists())) {
                return 0;
            }
            // get the properties
            const blobProperties = await metadataBlobClient.getProperties();
            // get the metadata
            const metadata = blobProperties.metadata;
            if (!metadata) {
                return 0;
            }
            // get the version from the metadata
            return parseInt(metadata.version) + 1;
        },
        saveSnippet: async (snippet: Snippet, update?: boolean): Promise<void> => {
            // get the snippet id blob metadata object
            const version = snippet.version;
            const blobName = `${snippet.id}/${snippet.version}`;
            const blockBlobClient = containerClient.getBlockBlobClient(blobName);
            const snippetAsString = JSON.stringify(snippet);
            // store the payload as a blob if it doesn't exist
            if (!(await blockBlobClient.exists())) {
                await blockBlobClient.upload(snippetAsString, snippetAsString.length);
            } else {
                if (update) {
                    console.log("Snippet already exists");
                    await blockBlobClient.upload(snippetAsString, snippetAsString.length);
                } else {
                    throw Error("Snippet already exists");
                }
            }
            const metadataBlob = `${snippet.id}/metadata`;
            const metadataBlobClient = containerClient.getBlockBlobClient(metadataBlob);
            const exists = await metadataBlobClient.exists();
            // NOTE - version save and increment is not atomic and not transactional.
            // Even after checking that the blob doesn't exist, it might be created by another process before the current process creates it.
            if (!exists) {
                // upload empty content to the metadata blob
                await metadataBlobClient.upload(snippet.id, snippet.id.length, {
                    metadata: {
                        version: version.toString(),
                    },
                });
            } else {
                // update the metadata blob
                await metadataBlobClient.setMetadata({
                    version: version.toString(),
                });
            }
            console.log("Saved snippet", snippet.id, snippet.version);
        },
    };
    return service;
};

const azureBlobStorageService = AzureBlobStorageService();

export { azureBlobStorageService };
export default azureBlobStorageService;
