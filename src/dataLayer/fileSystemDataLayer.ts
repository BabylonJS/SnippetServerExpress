import { Snippet, SnippetStorageService } from "./interfaces";
import fs from "fs";

function checkDirectory(directory: string) {
    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory);
    }
}

const directory = process.env.FILE_SYSTEM_DIRECTORY || "./data";
checkDirectory("./data");

const FileSystemStorageService = (): SnippetStorageService => {
    const service = {
        getSnippet: async (id: string, version: number = 0) => {
            // check if the directory exists
            checkDirectory(`${directory}/${id}`);
            const snippet = fs.readFileSync(`${directory}/${id}/${version}.json`, "utf-8");
            return JSON.parse(snippet);
        },
        getNextVersion: async (id: string) => {
            checkDirectory(`${directory}/${id}`);
            const files = fs.readdirSync(`${directory}/${id}`);
            return files.length;
        },
        saveSnippet: async (snippet: Snippet) => {
            const snippetAsString = JSON.stringify(snippet);
            checkDirectory(`${directory}/${snippet.id}`);
            fs.writeFileSync(`${directory}/${snippet.id}/${snippet.version}.json`, snippetAsString);
        },
    };
    return service;
};

const fileSystemStorageService = FileSystemStorageService();

export { fileSystemStorageService };
export default fileSystemStorageService;
