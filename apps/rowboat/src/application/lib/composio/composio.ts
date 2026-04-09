import { z } from "zod";
import { PrefixLogger } from "@/app/lib/utils";
import { Composio } from "@composio/core";
import { ZAuthConfig, ZConnectedAccount, ZCreateAuthConfigRequest, ZCreateAuthConfigResponse, ZCreateConnectedAccountRequest, ZCreateConnectedAccountResponse, ZDeleteOperationResponse, ZErrorResponse, ZGetToolkitResponse, ZListResponse, ZTool, ZToolkit, ZTriggerType } from "./types";

const BASE_URL = 'https://backend.composio.dev/api/v3';
const COMPOSIO_API_KEY = normalizeComposioApiKey(process.env.COMPOSIO_API_KEY);

let composioClient: Composio | null = null;

export const composio = new Proxy({} as Composio, {
    get(_target, property) {
        const client = getComposioClient();
        const value = Reflect.get(client as object, property);
        return typeof value === 'function' ? value.bind(client) : value;
    },
});

// Warn if API key is missing, helps diagnose HTML error pages from auth proxies
if (!COMPOSIO_API_KEY) {
    const warnLogger = new PrefixLogger('composioApiCall');
    warnLogger.log('WARNING: COMPOSIO_API_KEY is not configured. Composio list endpoints will return empty results and write actions will fail fast.');
}

function normalizeComposioApiKey(rawValue: string | undefined): string {
    const value = rawValue?.trim() || "";
    return value && value !== "test" ? value : "";
}

export function isComposioConfigured(): boolean {
    return Boolean(COMPOSIO_API_KEY);
}

function getComposioClient(): Composio {
    if (!COMPOSIO_API_KEY) {
        throw new Error('Composio is not configured for this workspace.');
    }

    composioClient ??= new Composio({
        apiKey: COMPOSIO_API_KEY,
    });

    return composioClient;
}

function createEmptyListResponse<T>(items: T[] = []) {
    return {
        items,
        next_cursor: null,
        total_pages: 0,
        current_page: 0,
        total_items: items.length,
    };
}

function isComposioUnavailableError(error: unknown): boolean {
    if (!(error instanceof Error)) {
        return false;
    }

    return (
        error.message.includes('401 Unauthorized') ||
        error.message.includes('403 Forbidden') ||
        error.message.includes('Invalid API key format') ||
        error.message.includes('COMPOSIO_API_KEY is not configured') ||
        error.message.includes('Composio is not configured for this workspace') ||
        error.message.includes('No Composio API key provided') ||
        error.message.includes('TS-SDK::NO_API_KEY')
    );
}

function getComposioHeaders(method: string | undefined, existingHeaders: HeadersInit | undefined): HeadersInit {
    if (!COMPOSIO_API_KEY) {
        throw new Error('Composio is not configured for this workspace.');
    }

    return {
        ...existingHeaders,
        "x-api-key": COMPOSIO_API_KEY,
        ...(method === 'POST' ? {
            "Content-Type": "application/json",
        } : {}),
    };
}

export async function composioApiCall<T extends z.ZodTypeAny>(
    schema: T,
    url: string,
    options: RequestInit = {},
): Promise<z.infer<T>> {
    const logger = new PrefixLogger('composioApiCall');
    logger.log(`[${options.method || 'GET'}] ${url}`, options);

    const then = Date.now();

    try {
        const response = await fetch(url, {
            ...options,
            headers: getComposioHeaders(options.method, options.headers),
        });
        const duration = Date.now() - then;
        logger.log(`Took: ${duration}ms`);

        const contentType = response.headers.get('content-type') || '';
        const rawText = await response.text();

        // Helpful logging when non-OK or non-JSON
        if (!response.ok || !contentType.includes('application/json')) {
            logger.log(`Non-JSON or non-OK response`, {
                status: response.status,
                statusText: response.statusText,
                contentType,
                preview: rawText.slice(0, 200),
            });
        }

        if (!response.ok) {
            throw new Error(`Composio API error: ${response.status} ${response.statusText} (url: ${url}) body: ${rawText.slice(0, 500)}`);
        }

        let data: unknown;
        try {
            data = contentType.includes('application/json') ? JSON.parse(rawText) : (() => { throw new Error('Expected JSON but received non-JSON response'); })();
        } catch (e: any) {
            throw new Error(`Failed to parse Composio JSON response (url: ${url}): ${e?.message || e}. Body preview: ${rawText.slice(0, 500)}`);
        }

        if (typeof data === 'object' && data !== null && 'error' in (data as any)) {
            const parsedError = ZErrorResponse.parse(data);
            throw new Error(`(code: ${parsedError.error.error_code}): ${parsedError.error.message}: ${parsedError.error.suggested_fix}: ${parsedError.error.errors?.join(', ')}`);
        }

        return schema.parse(data);
    } catch (error) {
        logger.log(`Error:`, error);
        throw error;
    }
}

export async function listToolkits(cursor: string | null = null): Promise<z.infer<ReturnType<typeof ZListResponse<typeof ZToolkit>>>> {
    const logger = new PrefixLogger('composioApiCall');
    if (!isComposioConfigured()) {
        logger.log('Skipping toolkit fetch because COMPOSIO_API_KEY is not configured.');
        return ZListResponse(ZToolkit).parse(createEmptyListResponse());
    }

    const url = new URL(`${BASE_URL}/toolkits`);

    // set params
    url.searchParams.set("sort_by", "usage");
    if (cursor) {
        url.searchParams.set("cursor", cursor);
    }

    // fetch
    try {
        return await composioApiCall(ZListResponse(ZToolkit), url.toString());
    } catch (error) {
        if (isComposioUnavailableError(error)) {
            logger.log('Returning empty toolkit list because Composio is unavailable.', {
                message: error instanceof Error ? error.message : String(error),
            });
            return ZListResponse(ZToolkit).parse(createEmptyListResponse());
        }

        throw error;
    }
}

export async function getToolkit(toolkitSlug: string): Promise<z.infer<typeof ZGetToolkitResponse>> {
    const url = new URL(`${BASE_URL}/toolkits/${toolkitSlug}`);
    return composioApiCall(ZGetToolkitResponse, url.toString());
}

export async function listTools(toolkitSlug: string, searchQuery: string | null = null, cursor: string | null = null): Promise<z.infer<ReturnType<typeof ZListResponse<typeof ZTool>>>> {
    const logger = new PrefixLogger('composioApiCall');
    if (!isComposioConfigured()) {
        logger.log('Skipping tools fetch because COMPOSIO_API_KEY is not configured.');
        return ZListResponse(ZTool).parse(createEmptyListResponse());
    }

    const url = new URL(`${BASE_URL}/tools`);

    // set params
    url.searchParams.set("toolkit_slug", toolkitSlug);
    if (searchQuery) {
        url.searchParams.set("search", searchQuery);
    }
    if (cursor) {
        url.searchParams.set("cursor", cursor);
    }

    try {
        // First get the tools list response
        const toolsResponse = await fetch(url.toString(), {
            headers: getComposioHeaders(undefined, undefined),
        });

        if (!toolsResponse.ok) {
            throw new Error(`Failed to fetch tools list: ${toolsResponse.status} ${toolsResponse.statusText}`);
        }

        const toolsData = await toolsResponse.json();

        // Check for error response
        if ('error' in toolsData) {
            const response = ZErrorResponse.parse(toolsData);
            throw new Error(`(code: ${response.error.error_code}): ${response.error.message}: ${response.error.suggested_fix}: ${response.error.errors?.join(', ')}`);
        }

        // Get toolkit data to compute no_auth for all tools
        const toolkitUrl = new URL(`${BASE_URL}/toolkits/${toolkitSlug}`);
        const toolkitResponse = await fetch(toolkitUrl.toString(), {
            headers: getComposioHeaders(undefined, undefined),
        });

        if (!toolkitResponse.ok) {
            throw new Error(`Failed to fetch toolkit: ${toolkitResponse.status} ${toolkitResponse.statusText}`);
        }

        const toolkitData = await toolkitResponse.json();

        // Compute no_auth from toolkit data
        const no_auth = toolkitData.composio_managed_auth_schemes?.includes('NO_AUTH') ||
                        toolkitData.auth_config_details?.some((config: any) => config.mode === 'NO_AUTH') ||
                        false;

        // Enrich all tools in the list with computed no_auth
        const enrichedToolsData = {
            ...toolsData,
            items: toolsData.items.map((tool: any) => ({
                ...tool,
                no_auth
            }))
        };

        // Now parse with our schema
        return ZListResponse(ZTool).parse(enrichedToolsData);
    } catch (error) {
        if (isComposioUnavailableError(error)) {
            logger.log('Returning empty tool list because Composio is unavailable.', {
                message: error instanceof Error ? error.message : String(error),
            });
            return ZListResponse(ZTool).parse(createEmptyListResponse());
        }

        throw error;
    }
}

export async function getTool(toolSlug: string): Promise<z.infer<typeof ZTool>> {
    const url = new URL(`${BASE_URL}/tools/${toolSlug}`);
    
    // First get the tool response
    const toolResponse = await fetch(url.toString(), {
        headers: {
            "x-api-key": COMPOSIO_API_KEY,
        },
    });
    
    if (!toolResponse.ok) {
        throw new Error(`Failed to fetch tool: ${toolResponse.status} ${toolResponse.statusText}`);
    }
    
    const toolData = await toolResponse.json();
    
    // Check for error response
    if ('error' in toolData) {
        const response = ZErrorResponse.parse(toolData);
        throw new Error(`(code: ${response.error.error_code}): ${response.error.message}: ${response.error.suggested_fix}: ${response.error.errors?.join(', ')}`);
    }
    
    // Get toolkit data to compute no_auth
    const toolkitSlug = toolData.toolkit?.slug;
    if (!toolkitSlug) {
        throw new Error(`Tool response missing toolkit slug: ${JSON.stringify(toolData)}`);
    }
    
    const toolkitUrl = new URL(`${BASE_URL}/toolkits/${toolkitSlug}`);
    const toolkitResponse = await fetch(toolkitUrl.toString(), {
        headers: {
            "x-api-key": COMPOSIO_API_KEY,
        },
    });
    
    if (!toolkitResponse.ok) {
        throw new Error(`Failed to fetch toolkit: ${toolkitResponse.status} ${toolkitResponse.statusText}`);
    }
    
    const toolkitData = await toolkitResponse.json();
    
    // Compute no_auth from toolkit data
    const no_auth = toolkitData.composio_managed_auth_schemes?.includes('NO_AUTH') || 
                    toolkitData.auth_config_details?.some((config: any) => config.mode === 'NO_AUTH') || 
                    false;
    
    // Inject computed no_auth into tool data
    const enrichedToolData = {
        ...toolData,
        no_auth
    };
    
    // Now parse with our schema
    return ZTool.parse(enrichedToolData);
}

export async function listAuthConfigs(toolkitSlug: string, cursor: string | null = null, managedOnly: boolean = false): Promise<z.infer<ReturnType<typeof ZListResponse<typeof ZAuthConfig>>>> {
    const logger = new PrefixLogger('composioApiCall');
    if (!isComposioConfigured()) {
        logger.log('Skipping auth config fetch because COMPOSIO_API_KEY is not configured.');
        return ZListResponse(ZAuthConfig).parse(createEmptyListResponse());
    }

    const url = new URL(`${BASE_URL}/auth_configs`);
    url.searchParams.set("toolkit_slug", toolkitSlug);
    if (cursor) {
        url.searchParams.set("cursor", cursor);
    }
    if (managedOnly) {
        url.searchParams.set("is_composio_managed", "true");
    }

    // fetch
    return composioApiCall(ZListResponse(ZAuthConfig), url.toString());
}

export async function createAuthConfig(request: z.infer<typeof ZCreateAuthConfigRequest>): Promise<z.infer<typeof ZCreateAuthConfigResponse>> {
    const url = new URL(`${BASE_URL}/auth_configs`);
    return composioApiCall(ZCreateAuthConfigResponse, url.toString(), {
        method: 'POST',
        body: JSON.stringify(request),
    });
}

export async function getAuthConfig(authConfigId: string): Promise<z.infer<typeof ZAuthConfig>> {
    const url = new URL(`${BASE_URL}/auth_configs/${authConfigId}`);
    return composioApiCall(ZAuthConfig, url.toString());
}

export async function deleteAuthConfig(authConfigId: string): Promise<z.infer<typeof ZDeleteOperationResponse>> {
    const url = new URL(`${BASE_URL}/auth_configs/${authConfigId}`);
    return composioApiCall(ZDeleteOperationResponse, url.toString(), {
        method: 'DELETE',
    });
}

// export async function createComposioManagedOauth2AuthConfig(toolkitSlug: string): Promise<z.infer<typeof ZAuthConfig>> {
//     const response = await createAuthConfig({
//         toolkit: {
//             slug: toolkitSlug,
//         },
//         auth_config: {
//             type: 'use_composio_managed_auth',
//         },
//     });
//     return response.auth_config;
// }

// export async function autocreateOauth2Integration(toolkitSlug: string): Promise<z.infer<typeof ZAuthConfig | typeof ZError>> {
//     // fetch toolkit
//     const toolkit = await getToolkit(toolkitSlug);

//     // ensure oauth2 is supported
//     if (!toolkit.auth_config_details?.some(config => config.mode === 'OAUTH2')) {
//         throw new Error(`OAuth2 is not supported for toolkit ${toolkitSlug}`);
//     }

//     // fetch existing auth configs
//     const authConfigs = await fetchAuthConfigs(toolkitSlug);

//     // find a valid oauth2 config
//     const oauth2AuthConfig = authConfigs.items.find(config => config.auth_scheme === 'OAUTH2');

//     // if valid auth config, return it
//     if (oauth2AuthConfig) {
//         return oauth2AuthConfig;
//     }

//     // check if composio managed oauth2 is supported
//     if (toolkit.composio_managed_auth_schemes.includes('OAUTH2')) {
//         return await createComposioManagedOauth2AuthConfig(toolkitSlug);
//     }

//     // else return error
//     return {
//         error: 'CUSTOM_OAUTH2_CONFIG_REQUIRED',
//     };
// }

export async function createConnectedAccount(request: z.infer<typeof ZCreateConnectedAccountRequest>): Promise<z.infer<typeof ZCreateConnectedAccountResponse>> {
    const url = new URL(`${BASE_URL}/connected_accounts`);
    return composioApiCall(ZCreateConnectedAccountResponse, url.toString(), {
        method: 'POST',
        body: JSON.stringify(request),
    });
}

// export async function createOauth2ConnectedAccount(toolkitSlug: string, userId: string, callbackUrl: string): Promise<z.infer<typeof ZCreateConnectedAccountResponse | typeof ZError>> {
//     // fetch auth config
//     const authConfig = await autocreateOauth2Integration(toolkitSlug);

//     // if error, return error
//     if ('error' in authConfig) {
//         return authConfig;
//     }

//     // create connected account
//     return await createConnectedAccount({
//         auth_config: {
//             id: authConfig.id,
//         },
//         connection: {
//             user_id: userId,
//             callback_url: callbackUrl,
//         },
//     });
// }

export async function getConnectedAccount(connectedAccountId: string): Promise<z.infer<typeof ZConnectedAccount>> {
    const url = new URL(`${BASE_URL}/connected_accounts/${connectedAccountId}`);
    return await composioApiCall(ZConnectedAccount, url.toString());
}

export async function deleteConnectedAccount(connectedAccountId: string): Promise<z.infer<typeof ZDeleteOperationResponse>> {
    const url = new URL(`${BASE_URL}/connected_accounts/${connectedAccountId}`);
    return await composioApiCall(ZDeleteOperationResponse, url.toString(), {
        method: 'DELETE',
    });
}

export async function listTriggersTypes(toolkitSlug: string, cursor?: string): Promise<z.infer<ReturnType<typeof ZListResponse<typeof ZTriggerType>>>> {
    const logger = new PrefixLogger('composioApiCall');
    if (!isComposioConfigured()) {
        logger.log('Skipping trigger type fetch because COMPOSIO_API_KEY is not configured.');
        return ZListResponse(ZTriggerType).parse(createEmptyListResponse());
    }

    const url = new URL(`${BASE_URL}/triggers_types`);

    // set params
    url.searchParams.set("toolkit_slugs", toolkitSlug);
    if (cursor) {
        url.searchParams.set("cursor", cursor);
    }

    // fetch
    try {
        return await composioApiCall(ZListResponse(ZTriggerType), url.toString());
    } catch (error) {
        if (isComposioUnavailableError(error)) {
            logger.log('Returning empty trigger type list because Composio is unavailable.', {
                message: error instanceof Error ? error.message : String(error),
            });
            return ZListResponse(ZTriggerType).parse(createEmptyListResponse());
        }

        throw error;
    }
}

export async function getTriggersType(triggerTypeSlug: string): Promise<z.infer<typeof ZTriggerType>> {
    const url = new URL(`${BASE_URL}/triggers_types/${triggerTypeSlug}`);
    return composioApiCall(ZTriggerType, url.toString());
}
