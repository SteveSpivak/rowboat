import z from "zod";

const DEFAULT_CLI_BRIDGE_URL = "http://127.0.0.1:8766/v1";
const DEFAULT_OLLAMA_URL = "http://127.0.0.1:11434";

export type ProviderSummary = {
    id: string;
    name: string;
    models: Array<{
        id: string;
        name?: string;
        release_date?: string;
    }>;
};

const BridgeModel = z.object({
    id: z.string(),
}).passthrough();

const BridgeResponse = z.object({
    data: z.array(BridgeModel).optional(),
}).passthrough();

const OllamaModel = z.object({
    name: z.string(),
}).passthrough();

const OllamaTagsResponse = z.object({
    models: z.array(OllamaModel).optional(),
}).passthrough();

function normalizeBaseUrl(baseUrl: string, fallback: string): string {
    const value = baseUrl?.trim() || fallback;
    return value.endsWith("/") ? value.slice(0, -1) : value;
}

function ensureV1(baseUrl: string): string {
    const normalized = normalizeBaseUrl(baseUrl, DEFAULT_CLI_BRIDGE_URL);
    return normalized.endsWith("/v1") ? normalized : `${normalized}/v1`;
}

function mapBridgeModels(models: Array<{ id: string }>): {
    codex: Array<{ id: string; name?: string }>;
    gemini: Array<{ id: string; name?: string }>;
    claude: Array<{ id: string; name?: string }>;
    ollama: Array<{ id: string; name?: string }>;
} {
    const result = {
        codex: [] as Array<{ id: string; name?: string }>,
        gemini: [] as Array<{ id: string; name?: string }>,
        claude: [] as Array<{ id: string; name?: string }>,
        ollama: [] as Array<{ id: string; name?: string }>,
    };

    for (const model of models) {
        const id = model.id;
        if (id.startsWith("codex/")) {
            result.codex.push({ id });
            continue;
        }
        if (id.startsWith("gemini/")) {
            result.gemini.push({ id });
            continue;
        }
        if (id.startsWith("claude/")) {
            result.claude.push({ id });
            continue;
        }
        if (id.startsWith("ollama/")) {
            result.ollama.push({ id: id.slice("ollama/".length), name: id.slice("ollama/".length) });
        }
    }

    return result;
}

async function fetchBridgeModels(baseUrl: string): Promise<ReturnType<typeof mapBridgeModels>> {
    try {
        const normalized = ensureV1(baseUrl);
        const response = await fetch(`${normalized}/models`, { cache: "no-store" });
        if (!response.ok) return mapBridgeModels([]);
        const parsed = BridgeResponse.safeParse(await response.json());
        const data = parsed.success ? (parsed.data.data ?? []) : [];
        return mapBridgeModels(data);
    } catch {
        return mapBridgeModels([]);
    }
}

async function fetchOllamaModels(baseUrl: string): Promise<Array<{ id: string; name?: string }>> {
    try {
        const normalized = normalizeBaseUrl(baseUrl, DEFAULT_OLLAMA_URL);
        const response = await fetch(`${normalized}/api/tags`, { cache: "no-store" });
        if (!response.ok) return [];
        const parsed = OllamaTagsResponse.safeParse(await response.json());
        const data = parsed.success ? (parsed.data.models ?? []) : [];
        return data.map((model) => ({ id: model.name, name: model.name }));
    } catch {
        return [];
    }
}

export async function listLocalProviders(options?: {
    bridgeBaseUrl?: string;
    ollamaBaseUrl?: string;
}): Promise<ProviderSummary[]> {
    const bridgeBaseUrl = options?.bridgeBaseUrl ?? DEFAULT_CLI_BRIDGE_URL;
    const ollamaBaseUrl = options?.ollamaBaseUrl ?? DEFAULT_OLLAMA_URL;
    const bridgeModels = await fetchBridgeModels(bridgeBaseUrl);
    const ollamaModels = await fetchOllamaModels(ollamaBaseUrl);

    return [
        {
            id: "codex-cli",
            name: "Codex CLI",
            models: bridgeModels.codex,
        },
        {
            id: "claude-cli",
            name: "Claude CLI",
            models: bridgeModels.claude,
        },
        {
            id: "gemini-cli",
            name: "Gemini CLI",
            models: bridgeModels.gemini,
        },
        {
            id: "ollama",
            name: "Ollama (Local)",
            models: ollamaModels.length > 0 ? ollamaModels : bridgeModels.ollama,
        },
    ];
}
