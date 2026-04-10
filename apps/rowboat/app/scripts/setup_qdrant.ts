import '../lib/loadenv';
import { qdrantClient } from '../lib/qdrant';

const USE_LOCAL_OLLAMA_EMBEDDINGS = !process.env.EMBEDDING_PROVIDER_API_KEY
    && !process.env.EMBEDDING_PROVIDER_BASE_URL
    && !process.env.EMBEDDING_MODEL
    && !process.env.OPENAI_API_KEY;

const EMBEDDING_VECTOR_SIZE = Number(process.env.EMBEDDING_VECTOR_SIZE)
    || (USE_LOCAL_OLLAMA_EMBEDDINGS ? 768 : 1536);

(async () => {
    try {
        const result = await qdrantClient.createCollection('embeddings', {
            vectors: {
                size: EMBEDDING_VECTOR_SIZE,
                distance: 'Dot',
            },
        });
        console.log(`Create qdrant collection 'embeddings' completed with result: ${result}`);
    } catch (error) {
        console.error(`Unable to create qdrant collection 'embeddings': ${error}`);
    }
})();
