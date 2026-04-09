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
    const isLocal = providerConfig.flavor === "ollama" || providerConfig.flavor === "openai-compatible";
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
        const message = error instanceof Error ? error.message : "Connection test failed";
        return { success: false, error: message };
    } finally {
        clearTimeout(timeout);
    }
}
