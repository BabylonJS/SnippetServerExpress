# Babylon.js Snippet Server

This the implementation used by Babylon's snippet server.

It is an Express.js implementation, written in TypeScript.

## Why is it needed

Babylon allows you as a developer to replace the snippet server that is used in your implementation. 
If, for example, you want to deploy your own version of the NME, NGE, Playground or the GUI Editor, you are able to change the snippet base URL.
Using this implementation you will be able to deploy your own version of the snippet server as well, and keep your snippets out of the public snippet repository.

So, if you:

- Don't want others to find your playground snippets
- Keep your code snippets secure and internal
- Don't want to depend on Babylon's infrastructure

this implementation is for you!

## How to prepare

## Configuration

All configuration elements are read from the environment variables. DotEnv is integrated in the repository, so adding a .env file in the main directory will allow you to define those environment variables when running the server from the repository.

The application will work without a .env using the default values.

These are the environment variables supported (and their default values, if defined):

```yaml
PORT=3000 ## The port number to use when starting the server
STORAGE_TYPE=fileSystem ## The default data layer
CREATE_DATA_LAYERS ## If provided, this comma-separated value will register these as the create layer(s). For example: "inMemory,fileSystem"
GET_DATA_LAYERS ## If provided, this comma-separated value will register these as the getter layer(s). For example: "inMemory"
FILE_SYSTEM_DIRECTORY="./data" ## if using file system, where should the snippets be saved.
AZURE_STORAGE_ACCOUNT_NAME ## The azure storage account name
AZURE_STORAGE_CONTAINER_NAME=snippets ## the name of the container in the blob storage
AZURE_STORAGE_ACCOUNT_KEY ## the key to use to log in to the azure storage account
AZURE_SEARCH_INDEX_KEY ## search index key
AZURE_SEARCH_INDEX_SERVICE_NAME ## search index searvice name
AZURE_SEARCH_INDEX_INDEX_NAME="snippets" ## name of the search index
JSON_SIZE_LIMIT="5mb" ## the limit put on JSON provided by the users
UPDATE_KEY ## an optional update key to allow updating a version instead of saving a new one
MAX_SNIPPET_SEARCH_INDEX_SIZE ## The maximum size of snippet that will be sent to the search index
CORS_ORIGINS="*" ## comma-separated domains for CORS. For example: "https://is.babylonjs.com,https://not.babylonjs.com"
```

### Data layers

You will first need to decide which data layer(s) you want to use. We currently implement the following:

- (inMemory) In-Memory data layer - will save your snippets in-memory, for as long as the server is running and will lose all content if the server stops.
- (fileSystem) File system data layer - keep the snippet on the local file system. Running the server in the same place will allow serving these snippets again.
- (azureBlob) Azure Blob storage data layer - store the snippets in an azure blob storage (think - cloud-based file system).
- (azureSearch) Azure search index data layer - filters and stores the snippet in a searchi index. Note that this implementation is very much targeted towards Babylon's needs.

The last 2 are used in our snippet server.

## Run the server

Run `npm install`
Run `npm start` to start the server or `npm run watch` to run the server in watch mode
