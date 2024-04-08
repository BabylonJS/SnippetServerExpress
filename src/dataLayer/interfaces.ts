export interface SnippetMetadata {
  created?: string;
  /**
   * The type of engine that the snippet was created for
   * webgl1, webgl2, webgpu
   */
  engineType?: string;
  /**
   * The version of the engine that the snippet was created for
   */
  engineVersion?: string;
  /**
   * The type of API that the snippet was created for
   */
  apiVersion?: string;
  /**
   * The type of language that the snippet was created in
   */
  language?: string;
  /**
   * The type of editor that the snippet was created in
   * Playground, NGE, NME, etc.
   */
  editor?: string;
}

export interface SnippetRequest {
  payload: string;
  name: string;
  description: string;
  tags: string;
  id?: string;
  metadata?: SnippetMetadata;
}

export interface Snippet {
  id: string;
  version: number;
  snippetIdentifier: string;
  jsonPayload: string;
  name: string;
  description: string;
  tags: string;
  metadata?: SnippetMetadata;
  date: string;
}

export interface SnippetStorageService {
  getSnippet: (id: string, version?: number) => Promise<Snippet>;
  saveSnippet: (snippet: Snippet) => Promise<void>;
  getNextVersion: (id: string) => Promise<number>;
}
