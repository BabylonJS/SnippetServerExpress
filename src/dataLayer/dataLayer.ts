// init dotenv
import dotenv from "dotenv";
import { SnippetStorageService } from "./interfaces";
import fileSystemStorageService from "./fileSystemDataLayer";
import azureBlobStorageService from "./azureBlobStorageDataLayer";
import inMemoryStorageService from "./inMemoryDataLayer";
import azureSearchIndexDataLayer from "./azureSearchIndexDataLayer";
dotenv.config();

function getDataLayer(dataLayer: string = process.env.STORAGE_TYPE || "fileSystem") {
    console.log("Data layer init", dataLayer);
    switch (dataLayer) {
        case "fileSystem":
            return fileSystemStorageService;
        case "azureBlob":
            return azureBlobStorageService;
        case "inMemory":
            return inMemoryStorageService;
        case "azureSearch":
            return azureSearchIndexDataLayer;
        default:
            throw new Error(`Data layer ${dataLayer} not supported`);
    }
}

export function generateSnippetId(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export const getDataLayers: SnippetStorageService[] = [];

export const createDataLayers: SnippetStorageService[] = [];

export const populateDataLayers = () => {
    console.log("Populating data layers");
    if (process.env.CREATE_DATA_LAYERS) {
        const createDataLayersEnv = process.env.CREATE_DATA_LAYERS.split(",");
        for (const dataLayer of createDataLayersEnv) {
            const layer = getDataLayer(dataLayer);
            createDataLayers.push(layer);
        }
    }
    if (process.env.GET_DATA_LAYERS) {
        const getDataLayersEnv = process.env.GET_DATA_LAYERS.split(",");
        for (const dataLayer of getDataLayersEnv) {
            const layer = getDataLayer(dataLayer);
            getDataLayers.push(layer);
        }
    }
    if (createDataLayers.length === 0 || getDataLayers.length === 0) {
        console.log("No data layers defined, using default");
        const dataLayer = getDataLayer();
        if (createDataLayers.length === 0) {
            createDataLayers.push(dataLayer);
        }
        if (getDataLayers.length === 0) {
            getDataLayers.push(dataLayer);
        }
    }
};
