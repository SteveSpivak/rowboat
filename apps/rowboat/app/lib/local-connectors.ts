export type LocalConnectorKey = 'codex' | 'gemini' | 'claude' | 'ollama';

export type LocalConnectorInfo = {
    key: LocalConnectorKey;
    label: string;
    description: string;
};

export type LocalConnectorModel = {
    id: string;
    connector: LocalConnectorKey;
    model: string;
    label: string;
};

export const DEFAULT_LOCAL_CONNECTOR_BASE_URL = 'http://127.0.0.1:8765/v1';

export const LOCAL_CONNECTORS: LocalConnectorInfo[] = [
    {
        key: 'codex',
        label: 'Codex CLI',
        description: 'Primary local coding backend routed through the local bridge.',
    },
    {
        key: 'gemini',
        label: 'Gemini CLI',
        description: 'Alternate local reasoning backend routed through the local bridge.',
    },
    {
        key: 'claude',
        label: 'Claude CLI',
        description: 'Alternate local assistant backend routed through the local bridge.',
    },
    {
        key: 'ollama',
        label: 'Ollama / local 11434',
        description: 'Local model backend routed through the bridge when a 11434-compatible server is reachable.',
    },
];

const CONNECTOR_LABELS = new Map(
    LOCAL_CONNECTORS.map((connector) => [connector.key, connector.label]),
);

const CONNECTOR_KEYS = new Set<LocalConnectorKey>(
    LOCAL_CONNECTORS.map((connector) => connector.key),
);

function isConnectorKey(value: string): value is LocalConnectorKey {
    return CONNECTOR_KEYS.has(value as LocalConnectorKey);
}

function inferConnectorFromModel(model: string): LocalConnectorKey {
    if (model.startsWith('gemini')) return 'gemini';
    if (model.startsWith('claude')) return 'claude';
    if (model.startsWith('ollama/')) return 'ollama';
    return 'codex';
}

export function splitConnectorModel(value: string | null | undefined): {
    connector: LocalConnectorKey;
    model: string;
} {
    const raw = value?.trim();
    if (!raw) {
        return { connector: 'codex', model: 'gpt-5.4' };
    }

    if (raw.includes('/')) {
        const [prefix, ...rest] = raw.split('/');
        if (isConnectorKey(prefix) && rest.length > 0) {
            return {
                connector: prefix,
                model: rest.join('/'),
            };
        }
    }

    return {
        connector: inferConnectorFromModel(raw),
        model: raw,
    };
}

export function joinConnectorModel(connector: LocalConnectorKey, model: string): string {
    const trimmed = model.trim();
    if (!trimmed) {
        return `${connector}/`;
    }
    return `${connector}/${trimmed}`;
}

export function labelConnectorModel(connector: LocalConnectorKey, model: string): string {
    return `${CONNECTOR_LABELS.get(connector) || connector} / ${model}`;
}

export function mapBridgeModelsToConnectorModels(
    models: Array<{ id: string }>
): LocalConnectorModel[] {
    return models.map((entry) => {
        const { connector, model } = splitConnectorModel(entry.id);
        return {
            id: joinConnectorModel(connector, model),
            connector,
            model,
            label: labelConnectorModel(connector, model),
        };
    });
}

export function resolveLocalConnectorBaseUrl(): string {
    const baseUrl = process.env.PROVIDER_BASE_URL || DEFAULT_LOCAL_CONNECTOR_BASE_URL;
    return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
}

export async function fetchLocalConnectorModels(): Promise<LocalConnectorModel[]> {
    const normalizedBaseUrl = resolveLocalConnectorBaseUrl();

    try {
        const response = await fetch(`${normalizedBaseUrl}/models`, {
            cache: 'no-store',
        });

        if (!response.ok) {
            return [];
        }

        const body = await response.json();
        const data = Array.isArray(body?.data) ? body.data : [];
        return mapBridgeModelsToConnectorModels(
            data.filter((item): item is { id: string } => typeof item?.id === 'string')
        );
    } catch {
        return [];
    }
}
