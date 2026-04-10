'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Spinner } from '@heroui/react';
import { ArrowRight, BookOpen, Folder, Plug, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Panel } from '@/components/common/panel-common';
import { fetchProject } from '@/app/actions/project.actions';
import { listDataSources } from '@/app/actions/data-source.actions';
import { importLocalKnowledgeRoot } from '@/app/actions/local-knowledge.actions';
import { importLocalMicrosoftSource, listLocalMicrosoftSources } from '@/app/actions/local-microsoft.actions';
import { getLocalConnectorStatus } from '@/app/actions/local-connectors.actions';
import { BUILTIN_SKILL_CATALOG } from '@/app/lib/builtin-skill-catalog';
import { LOCAL_CONNECTORS, LocalConnectorModel } from '@/app/lib/local-connectors';
import { LOCAL_KNOWLEDGE_ROOTS } from '@/app/lib/local-knowledge-roots';
import { LocalMicrosoftSource } from '@/app/lib/local-microsoft-sources';
import { Project } from '@/src/entities/models/project';
import { z } from 'zod';

type ProjectType = z.infer<typeof Project>;

export function InventoryApp({ projectId }: { projectId: string }) {
    const [project, setProject] = useState<ProjectType | null>(null);
    const [sourceCount, setSourceCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [loadingError, setLoadingError] = useState<string | null>(null);
    const [connectorBaseUrl, setConnectorBaseUrl] = useState('http://127.0.0.1:8765/v1');
    const [connectorModels, setConnectorModels] = useState<LocalConnectorModel[]>([]);
    const [connectorStatusError, setConnectorStatusError] = useState<string | null>(null);
    const [importingRootId, setImportingRootId] = useState<string | null>(null);
    const [importingMicrosoftSourceId, setImportingMicrosoftSourceId] = useState<string | null>(null);
    const [importMessage, setImportMessage] = useState<string | null>(null);
    const [importError, setImportError] = useState<string | null>(null);
    const [importedSourceNames, setImportedSourceNames] = useState<Set<string>>(new Set());
    const [localMicrosoftSources, setLocalMicrosoftSources] = useState<LocalMicrosoftSource[]>([]);

    useEffect(() => {
        let active = true;

        async function loadInventory() {
            try {
                setLoading(true);
                setLoadingError(null);

                const [projectConfig, sources, microsoftSources, connectorStatus] = await Promise.all([
                    fetchProject(projectId),
                    listDataSources(projectId),
                    listLocalMicrosoftSources().catch(() => []),
                    getLocalConnectorStatus().catch((error) => {
                        if (active) {
                            setConnectorStatusError(
                                error instanceof Error ? error.message : 'Unable to check the local connector bridge right now.'
                            );
                        }
                        return {
                            baseUrl: 'http://127.0.0.1:8765/v1',
                            models: [],
                        };
                    }),
                ]);

                if (!active) return;

                setProject(projectConfig);
                setSourceCount(sources.length);
                setImportedSourceNames(new Set(sources.map((source) => source.name)));
                setConnectorBaseUrl(connectorStatus.baseUrl);
                setConnectorModels(connectorStatus.models);
                setLocalMicrosoftSources(microsoftSources);
            } catch (error) {
                if (!active) return;
                setLoadingError(error instanceof Error ? error.message : 'Failed to load inventory');
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        }

        loadInventory();
        return () => {
            active = false;
        };
    }, [projectId]);

    const connectorModelsByKey = useMemo(() => {
        return connectorModels.reduce<Record<string, LocalConnectorModel[]>>((accumulator, model) => {
            if (!accumulator[model.connector]) {
                accumulator[model.connector] = [];
            }
            accumulator[model.connector].push(model);
            return accumulator;
        }, {});
    }, [connectorModels]);

    const workflowToolCount = project?.liveWorkflow.tools.length ?? 0;
    const customMcpCount = project ? Object.keys(project.customMcpServers || {}).length : 0;
    const connectedAppsCount = project ? Object.keys(project.composioConnectedAccounts || {}).length : 0;
    const webhookConfigured = Boolean(project?.webhookUrl);

    const handleImportRoot = async (rootId: string) => {
        setImportMessage(null);
        setImportError(null);
        setImportingRootId(rootId);

        try {
            const result = await importLocalKnowledgeRoot({ projectId, rootId });
            const root = LOCAL_KNOWLEDGE_ROOTS.find((entry) => entry.id === rootId);
            if (root) {
                setImportedSourceNames((previous) => new Set(previous).add(`${root.name} (Local)`));
            }
            setSourceCount((previous) => previous + 1);
            setImportMessage(`Imported ${result.docCount} documents from ${rootId}.`);
        } catch (error) {
            setImportError(error instanceof Error ? error.message : 'Import failed');
        } finally {
            setImportingRootId(null);
        }
    };

    const handleImportMicrosoftSource = async (source: LocalMicrosoftSource) => {
        setImportMessage(null);
        setImportError(null);
        setImportingMicrosoftSourceId(source.id);

        try {
            const result = await importLocalMicrosoftSource({ projectId, sourceId: source.id });
            setImportedSourceNames((previous) => new Set(previous).add(`${source.name} (Local)`));
            setSourceCount((previous) => previous + 1);
            setImportMessage(`Imported ${result.docCount} files from ${source.name}.`);
        } catch (error) {
            setImportError(error instanceof Error ? error.message : 'Import failed');
        } finally {
            setImportingMicrosoftSourceId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-[360px] items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Spinner size="sm" />
                Loading inventory...
            </div>
        );
    }

    if (loadingError) {
        return (
            <div className="mx-auto max-w-5xl p-6">
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                    {loadingError}
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Inventory</h1>
                        <p className="mt-2 max-w-3xl text-sm text-gray-500 dark:text-gray-400">
                            This page shows what this project can attach or configure across folders, skills, connectors, and project tool providers.
                            Desktop remains the runtime authority for local models, MCP execution, and skill loading. The web app remains the project cockpit.
                        </p>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
                        <div className="font-medium text-gray-900 dark:text-gray-100">{project?.name || 'Project'}</div>
                        <div className="mt-1 text-xs">Project data sources: {sourceCount}</div>
                        <div className="mt-1 text-xs">Workflow tools: {workflowToolCount}</div>
                    </div>
                </div>
            </div>

            <Panel
                title={
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                        <Folder className="h-4 w-4" />
                        Workspace folders
                    </div>
                }
                rightActions={
                    <Link href={`/projects/${projectId}/sources`} className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400">
                        Open Sources
                    </Link>
                }
            >
                <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-3">
                    {LOCAL_KNOWLEDGE_ROOTS.map((root) => {
                        const imported = importedSourceNames.has(`${root.name} (Local)`);
                        return (
                            <div key={root.id} className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{root.name}</div>
                                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{root.path}</div>
                                <div className="mt-2 text-xs text-gray-600 dark:text-gray-300">{root.description}</div>
                                <div className="mt-4 flex items-center justify-between gap-3">
                                    <div className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                        imported
                                            ? 'border border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300'
                                            : 'border border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300'
                                    }`}>
                                        {imported ? 'Imported' : root.importMode === 'vault-markdown' ? 'Markdown corpus' : 'Repo knowledge'}
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        disabled={Boolean(importingRootId)}
                                        onClick={() => handleImportRoot(root.id)}
                                    >
                                        {importingRootId === root.id ? 'Importing...' : imported ? 'Import again' : 'Import'}
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
                {(importMessage || importError) && (
                    <div className="border-t border-gray-200 px-4 py-3 text-xs dark:border-gray-700">
                        {importMessage && <div className="text-green-600 dark:text-green-400">{importMessage}</div>}
                        {importError && <div className="text-red-600 dark:text-red-400">{importError}</div>}
                    </div>
                )}
            </Panel>

            <Panel
                title={
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                        <Folder className="h-4 w-4" />
                        Local Microsoft sources
                    </div>
                }
                rightActions={
                    <Link href={`/projects/${projectId}/sources`} className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400">
                        Open Sources
                    </Link>
                }
            >
                <div className="border-b border-gray-200 px-4 py-3 text-sm text-gray-600 dark:border-gray-700 dark:text-gray-300">
                    OneDrive can be imported as a local file source right now. Outlook and Teams are detected as local desktop stores,
                    but they remain desktop-only until the repo has a proven local reader for them.
                </div>
                <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2">
                    {localMicrosoftSources.map((source) => {
                        const imported = importedSourceNames.has(`${source.name} (Local)`);
                        const readyForImport = source.importStrategy === 'folder-files';
                        return (
                            <div key={source.id} className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{source.name}</div>
                                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{source.path}</div>
                                    </div>
                                    <div className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                        source.readiness === 'ready'
                                            ? 'border border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300'
                                            : source.readiness === 'partial'
                                                ? 'border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300'
                                                : 'border border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300'
                                    }`}>
                                        {source.readiness}
                                    </div>
                                </div>
                                <div className="mt-3 text-sm text-gray-600 dark:text-gray-300">{source.description}</div>
                                <div className="mt-4 flex items-center justify-between gap-3">
                                    <div className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                        readyForImport
                                            ? imported
                                                ? 'border border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300'
                                                : 'border border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300'
                                            : 'border border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300'
                                    }`}>
                                        {readyForImport ? (imported ? 'Imported' : 'Folder import') : 'Desktop only'}
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        disabled={!readyForImport || Boolean(importingMicrosoftSourceId)}
                                        onClick={() => handleImportMicrosoftSource(source)}
                                    >
                                        {importingMicrosoftSourceId === source.id
                                            ? 'Importing...'
                                            : imported
                                                ? 'Import again'
                                                : readyForImport
                                                    ? 'Import files'
                                                    : 'Desktop only'}
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                    {localMicrosoftSources.length === 0 && (
                        <div className="rounded-xl border border-dashed border-gray-200 p-4 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                            No local Microsoft app sources were discovered on this machine.
                        </div>
                    )}
                </div>
            </Panel>

            <Panel
                title={
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                        <BookOpen className="h-4 w-4" />
                        Skill catalog
                    </div>
                }
                rightActions={
                    <Link href={`/projects/${projectId}/workflow`} className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400">
                        Open Build
                    </Link>
                }
            >
                <div className="border-b border-gray-200 px-4 py-3 text-sm text-gray-600 dark:border-gray-700 dark:text-gray-300">
                    The web app mirrors the desktop skill catalog for discovery and instruction authoring.
                    Desktop loads and executes built-in skills directly today; the web workflow editor uses the same catalog as guidance rather than a separate runtime.
                </div>
                <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
                    {BUILTIN_SKILL_CATALOG.map((skill) => (
                        <div key={skill.id} className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{skill.title}</div>
                            <div className="mt-1 font-mono text-xs text-gray-500 dark:text-gray-400">{skill.id}</div>
                            <div className="mt-3 text-sm text-gray-600 dark:text-gray-300">{skill.summary}</div>
                        </div>
                    ))}
                </div>
            </Panel>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <Panel
                    title={
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                            <Plug className="h-4 w-4" />
                            Connector health
                        </div>
                    }
                >
                    <div className="border-b border-gray-200 px-4 py-3 text-sm text-gray-600 dark:border-gray-700 dark:text-gray-300">
                        <div>
                            Local connector bridge: <span className="font-mono text-xs">{connectorBaseUrl}</span>
                        </div>
                        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            Agents choose connectors per workflow agent. Desktop remains the source of truth for the bridge and local runtime.
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2">
                        {LOCAL_CONNECTORS.map((connector) => {
                            const modelsForConnector = connectorModelsByKey[connector.key] || [];
                            return (
                                <div key={connector.key} className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{connector.label}</div>
                                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{connector.description}</div>
                                    <div className="mt-3 text-xs text-gray-600 dark:text-gray-300">
                                        {modelsForConnector.length > 0
                                            ? modelsForConnector.map((model) => model.model).join(', ')
                                            : 'No models exposed right now.'}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {connectorStatusError && (
                        <div className="border-t border-gray-200 px-4 py-3 text-xs text-red-600 dark:border-gray-700 dark:text-red-400">
                            {connectorStatusError}
                        </div>
                    )}
                </Panel>

                <Panel
                    title={
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                            <Wrench className="h-4 w-4" />
                            Project tool providers
                        </div>
                    }
                >
                    <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2">
                        <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Workflow tools</div>
                            <div className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">{workflowToolCount}</div>
                            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">Tools currently attached to this workflow.</div>
                        </div>
                        <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Custom MCP servers</div>
                            <div className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">{customMcpCount}</div>
                            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">Project-level remote MCP endpoints.</div>
                        </div>
                        <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Connected apps</div>
                            <div className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">{connectedAppsCount}</div>
                            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">Project-scoped connected app accounts.</div>
                        </div>
                        <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Webhook</div>
                            <div className="mt-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                                {webhookConfigured ? 'Configured' : 'Not configured'}
                            </div>
                            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">Project webhook routing for external tool calls.</div>
                        </div>
                    </div>
                    <div className="border-t border-gray-200 px-4 py-3 dark:border-gray-700">
                        <div className="flex flex-wrap gap-2">
                            <Link href={`/projects/${projectId}/workflow`} className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-900">
                                Open Build
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                            <Link href={`/projects/${projectId}/config`} className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-900">
                                Open Settings
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                            <Link href={`/projects/${projectId}/manage-triggers`} className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-900">
                                Open Triggers
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>
                </Panel>
            </div>
        </div>
    );
}
