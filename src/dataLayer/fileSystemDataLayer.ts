import { Snippet, SnippetStorageService } from "./interfaces";
import fs from "fs";

function checkDirectory(directory: string) {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory);
  }
}

checkDirectory("./data");

const FileSystemStorageService = (): SnippetStorageService => {
  const service = {
    getSnippet: async (id: string, version: number = 0) => {
      // check if the directory exists
      checkDirectory(`./data/${id}`);
      const snippet = fs.readFileSync(`./data/${id}/${version}.json`, "utf-8");
      return JSON.parse(snippet);
    },
    getNextVersion: async (id: string) => {
      checkDirectory(`./data/${id}`);
      const files = fs.readdirSync(`./data/${id}`);
      return files.length;
    },
    saveSnippet: async (snippet: Snippet) => {
      const snippetAsString = JSON.stringify(snippet);
      checkDirectory(`./data/${snippet.id}`);
      fs.writeFileSync(
        `./data/${snippet.id}/${snippet.version}.json`,
        snippetAsString
      );
    },
  };
  return service;
};

const fileSystemStorageService = FileSystemStorageService();

export { fileSystemStorageService };
export default fileSystemStorageService;
