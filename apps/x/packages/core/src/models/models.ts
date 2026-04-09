import { ProviderV2 } from "@ai-sdk/provider";
import { createGateway, generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOllama } from "ollama-ai-provider-v2";
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { LlmModelConfig, LlmProvider } from "@x/shared/dist/models.js";
import z from "zod";
import { isSignedIn } from "../account/account.js";
import { getGatewayProvider } from "./gateway.js";

export const Provider = LlmProvider;
export const ModelConfig = LlmModelConfig;

const CLI_BRIDGE_BASE_URL = "http://127.0.0.1:8765/v1";
const CLI_PROVIDER_HEADERS: Record<"codex-cli" | "gemini-cli" | "claude-cli", Record<string, string>> = {
    "codex-cli": { "x-cli-backend": "codex" },
    "gemini-cli": { "x-cli-backend": "gemini" },
    "claude-cli": { "x-cli-backend": "claude" },
};

export function createProvider(config: z.infer<typeof Provider>): ProviderV2 {
    const { apiKey, baseURL, headers } = config;
    switch (config.flavor) {
        case "openai":
            return createOpenAI({
                apiKey,
                baseURL,
                headers,
            });
        case "aigateway":
            return createGateway({
                apiKey,
                baseURL,
                headers,
            });
        case "anthropic":
            return createAnthropic({
                apiKey,
                baseURL,
                headers,
            });
        case "google":
            return createGoogleGenerativeAI({
                apiKey,
                baseURL,
                headers,
            });
        case "ollama": {
            // ollama-ai-provider-v2 expects baseURL to include /api
            let ollamaURL = baseURL;
            if (ollamaURL && !ollamaURL.replace(/\/+$/, '').endsWith('/api')) {
                ollamaURL = ollamaURL.replace(/\/+$/, '') + '/api';
            }
            return createOllama({
                baseURL: ollamaURL,
                headers,
            });
        }
        case "openai-compatible":
            return createOpenAICompatible({
                name: "openai-compatible",
                apiKey,
                baseURL: baseURL || "",
                headers,
            });
        case "codex-cli":
        case "gemini-cli":
        case "claude-cli": {
            const cliHeaders = CLI_PROVIDER_HEADERS[config.flavor];
            return createOpenAICompatible({
                name: config.flavor,
                apiKey,
                baseURL: baseURL || CLI_BRIDGE_BASE_URL,
                headers: { ...cliHeaders, ...(headers ?? {}) },
            });
        }
        case "openrouter":
            return createOpenRouter({
                apiKey,
                baseURL,
                headers,
            }) as unknown as ProviderV2;
        default:
            throw new Error(`Unsupported provider flavor: ${config.flavor}`);
    }
}

function hasExplicitProviderConfig(config: z.infer<typeof Provider>): boolean {
    return Boolean(
        config.apiKey?.trim()
        || config.baseURL?.trim()
        || (config.headers && Object.keys(config.headers).length > 0),
    );
}

export function shouldUseGatewayProvider(config: z.infer<typeof Provider>, signedIn: boolean): boolean {
    if (!signedIn) return false;
    if (config.flavor === "aigateway") return true;
    if (hasExplicitProviderConfig(config)) return false;
    return config.flavor === "openai"
        || config.flavor === "anthropic"
        || config.flavor === "google";
}

export async function resolveProvider(config: z.infer<typeof Provider>): Promise<{ provider: ProviderV2; signedIn: boolean; usingGateway: boolean }> {
    const signedIn = await isSignedIn();
    if (shouldUseGatewayProvider(config, signedIn)) {
        return {
            provider: await getGatewayProvider(),
            signedIn,
            usingGateway: true,
        };
    }

    return {
        provider: createProvider(config),
        signedIn,
        usingGateway: false,
    };
}

export async function testModelConnection(
    providerConfig: z.infer<typeof Provider>,
    model: string,
    timeoutMs?: number,
): Promise<{ success: boolean; error?: string }> {
    const isLocal =
        providerConfig.flavor === "ollama"
        || providerConfig.flavor === "openai-compatible"
        || providerConfig.flavor === "codex-cli"
        || providerConfig.flavor === "gemini-cli"
        || providerConfig.flavor === "claude-cli";
    const effectiveTimeout = timeoutMs ?? (isLocal ? 60000 : 8000);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), effectiveTimeout);
    try {
        const { provider } = await resolveProvider(providerConfig);
        const languageModel = provider.languageModel(model);
        await generateText({
            model: languageModel,
            prompt: "ping",
            abortSignal: controller.signal,
        });
        return { success: true };
    } catch (error) {
        const rawMessage = error instanceof Error ? error.message : "Connection test failed";
        const message = rawMessage.includes("ECONNREFUSED") && rawMessage.includes("127.0.0.1:8765")
            ? "Local CLI bridge is not running at http://127.0.0.1:8765. Start the CLI bridge and try again."
            : rawMessage;
        return { success: false, error: message };
    } finally {
        clearTimeout(timeout);
    }
}
