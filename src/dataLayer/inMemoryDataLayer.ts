// in-memory snippet service implementation
import { Snippet, SnippetStorageService } from "./interfaces";

const InMemoryStorageService = (): SnippetStorageService => {
  const snippets: { [key: string]: Snippet[] } = {};

  const service = {
    getSnippet: async (id: string, version: number = 0): Promise<Snippet> => {
      return snippets[id][version];
    },
    getNextVersion: async (id: string): Promise<number> => {
      if (snippets[id]) {
        return snippets[id].length;
      }
      return 0;
    },
    saveSnippet: async (snippet: Snippet): Promise<void> => {
      if (!snippets[snippet.id]) {
        snippets[snippet.id] = [];
      }
      snippets[snippet.id][snippet.version] = snippet;
    },
  };

  return service;
};

const inMemoryStorageService = InMemoryStorageService();

export { inMemoryStorageService };
export default inMemoryStorageService;
