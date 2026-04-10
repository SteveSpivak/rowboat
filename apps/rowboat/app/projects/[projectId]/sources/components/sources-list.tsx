'use client';

import { Link, Spinner } from "@heroui/react";
import { Button } from "@/components/ui/button";
import { ToggleSource } from "./toggle-source";
import { SelfUpdatingSourceStatus } from "./self-updating-source-status";
import { DataSourceIcon } from "../../../../lib/components/datasource-icon";
import { useEffect, useState } from "react";
import { DataSource } from "@/src/entities/models/data-source";
import { z } from "zod";
import { listDataSources } from "../../../../actions/data-source.actions";
import { Panel } from "@/components/common/panel-common";
import { PlusIcon } from "lucide-react";
import { LOCAL_KNOWLEDGE_ROOTS } from "@/app/lib/local-knowledge-roots";
import { importLocalKnowledgeRoot } from "@/app/actions/local-knowledge.actions";
import { importLocalMicrosoftSource, listLocalMicrosoftSources } from "@/app/actions/local-microsoft.actions";
import { LocalMicrosoftSource } from "@/app/lib/local-microsoft-sources";

export function SourcesList({ projectId }: { projectId: string }) {
    const [sources, setSources] = useState<z.infer<typeof DataSource>[]>([]);
    const [loading, setLoading] = useState(true);
    const [importingRootId, setImportingRootId] = useState<string | null>(null);
    const [importingMicrosoftSourceId, setImportingMicrosoftSourceId] = useState<string | null>(null);
    const [importMessage, setImportMessage] = useState<string | null>(null);
    const [importError, setImportError] = useState<string | null>(null);
    const [localMicrosoftSources, setLocalMicrosoftSources] = useState<LocalMicrosoftSource[]>([]);

    useEffect(() => {
        let ignore = false;

        async function fetchSources() {
            setLoading(true);
            const [sources, microsoftSources] = await Promise.all([
                listDataSources(projectId),
                listLocalMicrosoftSources().catch(() => []),
            ]);
            if (!ignore) {
                setSources(sources);
                setLocalMicrosoftSources(microsoftSources);
                setLoading(false);
            }
        }
        fetchSources();

        return () => {
            ignore = true;
        };
    }, [projectId]);

    const handleImportRoot = async (rootId: string) => {
        setImportError(null);
        setImportMessage(null);
        setImportingRootId(rootId);
        try {
            const result = await importLocalKnowledgeRoot({ projectId, rootId });
            setImportMessage(`Imported ${result.docCount} documents from ${rootId}.`);
            const refreshed = await listDataSources(projectId);
            setSources(refreshed);
        } catch (error) {
            setImportError(error instanceof Error ? error.message : 'Import failed');
        } finally {
            setImportingRootId(null);
        }
    };

    const handleImportMicrosoftSource = async (source: LocalMicrosoftSource) => {
        setImportError(null);
        setImportMessage(null);
        setImportingMicrosoftSourceId(source.id);
        try {
            const result = await importLocalMicrosoftSource({ projectId, sourceId: source.id });
            setImportMessage(`Imported ${result.docCount} files from ${source.name}.`);
            const refreshed = await listDataSources(projectId);
            setSources(refreshed);
        } catch (error) {
            setImportError(error instanceof Error ? error.message : 'Import failed');
        } finally {
            setImportingMicrosoftSourceId(null);
        }
    };

    return (
        <Panel
            title={
                <div className="flex items-center gap-3">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        DATA SOURCES
                    </div>
                </div>
            }
            rightActions={
                <div className="flex items-center gap-3">
                    <Link href={`/projects/${projectId}/sources/new`}>
                        <Button
                            variant="primary"
                            size="sm"
                            className="bg-blue-50 text-blue-700 hover:bg-blue-100"
                            startContent={<PlusIcon className="w-4 h-4" />}
                        >
                            Add data source
                        </Button>
                    </Link>
                </div>
            }
        >
            <div className="h-full overflow-auto px-4 py-4">
                <div className="max-w-[1024px] mx-auto">
                    <div className="mb-6">
                        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                        Local knowledge roots
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                        Import local sources as text data sources for RAG.
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                                {LOCAL_KNOWLEDGE_ROOTS.map((root) => (
                                    <div key={root.id} className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                            {root.name}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            {root.path}
                                        </div>
                                        <div className="mt-3">
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                disabled={!!importingRootId}
                                                onClick={() => handleImportRoot(root.id)}
                                            >
                                                {importingRootId === root.id ? 'Importing...' : 'Import'}
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {importMessage && (
                                <div className="mt-3 text-xs text-green-600 dark:text-green-400">
                                    {importMessage}
                                </div>
                            )}
                            {importError && (
                                <div className="mt-3 text-xs text-red-600 dark:text-red-400">
                                    {importError}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="mb-6">
                        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                        Local Microsoft sources
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                        OneDrive folders can be imported right now. Outlook and Teams remain desktop-only until local readers are proven.
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                                {localMicrosoftSources.map((source) => {
                                    const importable = source.importStrategy === 'folder-files';
                                    return (
                                        <div key={source.id} className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                {source.name}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                {source.path}
                                            </div>
                                            <div className="mt-2 text-xs text-gray-600 dark:text-gray-300">
                                                {source.description}
                                            </div>
                                            <div className="mt-3">
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    disabled={!importable || !!importingMicrosoftSourceId}
                                                    onClick={() => handleImportMicrosoftSource(source)}
                                                >
                                                    {importingMicrosoftSourceId === source.id
                                                        ? 'Importing...'
                                                        : importable
                                                            ? 'Import files'
                                                            : 'Desktop only'}
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                                {localMicrosoftSources.length === 0 && (
                                    <div className="rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-3 text-sm text-gray-500 dark:text-gray-400">
                                        No local Microsoft app sources were discovered on this machine.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    {loading && (
                        <div className="flex items-center gap-2">
                            <Spinner size="sm" />
                            <div>Loading...</div>
                        </div>
                    )}
                    {!loading && !sources.length && (
                        <p className="mt-4 text-center">You have not added any data sources.</p>
                    )}
                    {!loading && sources.length > 0 && (
                        <>
                            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
                                <div className="flex items-start gap-3">
                                    <svg 
                                        className="w-5 h-5 text-blue-500 mt-0.5" 
                                        fill="none" 
                                        stroke="currentColor" 
                                        viewBox="0 0 24 24"
                                    >
                                        <path 
                                            strokeLinecap="round" 
                                            strokeLinejoin="round" 
                                            strokeWidth={2} 
                                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                                        />
                                    </svg>
                                    <div className="text-sm text-blue-700 dark:text-blue-300">
                                        After creating data sources, go to the RAG tab inside individual agent settings to connect them to agents.
                                    </div>
                                </div>
                            </div>
                            <div className="border rounded-lg overflow-hidden">
                                <table className="w-full">
                                    <thead className="bg-gray-50 dark:bg-gray-800/50">
                                        <tr>
                                            <th className="w-[30%] px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                Name
                                            </th>
                                            <th className="w-[20%] px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                Type
                                            </th>
                                            {sources.some(source => source.status) && (
                                                <th className="w-[35%] px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                    Status
                                                </th>
                                            )}
                                            <th className="w-[15%] px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                Active
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        {sources.map((source) => (
                                            <tr 
                                                key={source.id}
                                                className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                                            >
                                                <td className="px-6 py-4 text-left">
                                                    <Link
                                                        href={`/projects/${projectId}/sources/${source.id}`}
                                                        size="lg"
                                                        isBlock
                                                        className="text-sm text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 truncate block"
                                                    >
                                                        {source.name}
                                                    </Link>
                                                </td>
                                                <td className="px-6 py-4 text-left">
                                                    {source.data.type == 'urls' && (
                                                        <div className="flex gap-2 items-center text-sm text-gray-600 dark:text-gray-300">
                                                            <DataSourceIcon type="urls" />
                                                            <div>List URLs</div>
                                                        </div>
                                                    )}
                                                    {source.data.type == 'text' && (
                                                        <div className="flex gap-2 items-center text-sm text-gray-600 dark:text-gray-300">
                                                            <DataSourceIcon type="text" />
                                                            <div>Text</div>
                                                        </div>
                                                    )}
                                                    {source.data.type == 'files_local' && (
                                                        <div className="flex gap-2 items-center text-sm text-gray-600 dark:text-gray-300">
                                                            <DataSourceIcon type="files" />
                                                            <div>Files (Local)</div>
                                                        </div>
                                                    )}
                                                    {source.data.type == 'files_s3' && (
                                                        <div className="flex gap-2 items-center text-sm text-gray-600 dark:text-gray-300">
                                                            <DataSourceIcon type="files" />
                                                            <div>Files (S3)</div>
                                                        </div>
                                                    )}
                                                </td>
                                                {sources.some(source => source.status) && (
                                                    <td className="px-6 py-4 text-left">
                                                        <div className="text-sm">
                                                            <SelfUpdatingSourceStatus 
                                                                sourceId={source.id} 
                                                                initialStatus={source.status} 
                                                                compact={true} 
                                                            />
                                                        </div>
                                                    </td>
                                                )}
                                                <td className="px-6 py-4 text-left">
                                                    <ToggleSource 
                                                        sourceId={source.id} 
                                                        active={source.active} 
                                                        compact={true} 
                                                        className="bg-default-100" 
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </Panel>
    );
} 
