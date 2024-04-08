// init dotenv
import dotenv from "dotenv";
dotenv.config();

export async function getDataLayer(dataLayer: string = process.env.STORAGE_TYPE || "fileSystem") {
    console.log("Data layer init", dataLayer);
  switch (dataLayer) {
    case "fileSystem":
      return (await import("./fileSystemDataLayer")).default;
    case "azureBlob":
      return (await import("./azureBlobStorageDataLayer")).default;
    case "inMemory":
      return (await import("./inMemoryDataLayer")).default;
    default:
      throw new Error(`Data layer ${dataLayer} not supported`);
  }
}

export function generateSnippetId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

const dataLayerPromise = getDataLayer();

export { dataLayerPromise };
