import { createOpenAI } from "@ai-sdk/openai";

const USE_LOCAL_OLLAMA_EMBEDDINGS = !process.env.EMBEDDING_PROVIDER_API_KEY
    && !process.env.EMBEDDING_PROVIDER_BASE_URL
    && !process.env.EMBEDDING_MODEL
    && !process.env.OPENAI_API_KEY;

const EMBEDDING_PROVIDER_API_KEY = process.env.EMBEDDING_PROVIDER_API_KEY
    || process.env.OPENAI_API_KEY
    || (USE_LOCAL_OLLAMA_EMBEDDINGS ? 'ollama' : '');
const EMBEDDING_PROVIDER_BASE_URL = process.env.EMBEDDING_PROVIDER_BASE_URL
    || (USE_LOCAL_OLLAMA_EMBEDDINGS ? 'http://127.0.0.1:11434/v1' : undefined);
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL
    || (USE_LOCAL_OLLAMA_EMBEDDINGS ? 'nomic-embed-text' : 'text-embedding-3-small');

const openai = createOpenAI({
    apiKey: EMBEDDING_PROVIDER_API_KEY,
    baseURL: EMBEDDING_PROVIDER_BASE_URL,
});

export const embeddingModel = openai.embedding(EMBEDDING_MODEL);
