'use server';

import fs from 'node:fs/promises';
import path from 'node:path';
import { addDocsToDataSource, createDataSource } from './data-source.actions';
import { LOCAL_MICROSOFT_SOURCE_CANDIDATES, LocalMicrosoftSource, LocalMicrosoftSourceId } from '../lib/local-microsoft-sources';

const MAX_FILES = 40;
const MAX_DEPTH = 5;
const SUPPORTED_EXTENSIONS = new Set(['.txt', '.md', '.docx', '.pptx', '.xlsx', '.csv']);
const ZIP_OFFICE_EXTENSIONS = new Set(['.docx', '.pptx', '.xlsx']);
const SKIP_DIRS = new Set([
    '.git',
    '.next',
    'node_modules',
    '.Trash',
]);

function mimeTypeForFile(filePath: string): string {
    const extension = path.extname(filePath).toLowerCase();
    switch (extension) {
        case '.txt':
        case '.md':
            return 'text/plain';
        case '.csv':
            return 'text/csv';
        case '.docx':
            return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        case '.pptx':
            return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
        case '.xlsx':
            return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        default:
            return 'application/octet-stream';
    }
}

async function exists(filePath: string): Promise<boolean> {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

async function hasZipSignature(filePath: string): Promise<boolean> {
    let handle: Awaited<ReturnType<typeof fs.open>> | null = null;

    try {
        handle = await fs.open(filePath, 'r');
        const buffer = Buffer.alloc(4);
        const { bytesRead } = await handle.read(buffer, 0, 4, 0);
        if (bytesRead < 4) {
            return false;
        }

        const signature = buffer.toString('binary');
        return signature === 'PK\u0003\u0004'
            || signature === 'PK\u0005\u0006'
            || signature === 'PK\u0007\u0008';
    } catch {
        return false;
    } finally {
        await handle?.close();
    }
}

async function collectSupportedFiles(rootPath: string, limit: number) {
    const files: Array<{ name: string; path: string; size: number; mtimeMs: number }> = [];
    const queue: Array<{ dir: string; depth: number }> = [{ dir: rootPath, depth: 0 }];

    while (queue.length > 0 && files.length < limit * 4) {
        const current = queue.shift();
        if (!current) break;
        if (current.depth > MAX_DEPTH) continue;

        let entries: Awaited<ReturnType<typeof fs.readdir>>;
        try {
            entries = await fs.readdir(current.dir, { withFileTypes: true });
        } catch {
            continue;
        }

        for (const entry of entries) {
            if (entry.name.startsWith('.')) continue;

            const entryPath = path.join(current.dir, entry.name);
            if (entry.isDirectory()) {
                if (SKIP_DIRS.has(entry.name)) continue;
                queue.push({ dir: entryPath, depth: current.depth + 1 });
                continue;
            }

            if (!entry.isFile()) continue;
            const extension = path.extname(entry.name).toLowerCase();
            if (!SUPPORTED_EXTENSIONS.has(extension)) continue;
            if (ZIP_OFFICE_EXTENSIONS.has(extension) && !(await hasZipSignature(entryPath))) continue;

            try {
                const stat = await fs.stat(entryPath);
                files.push({
                    name: path.relative(rootPath, entryPath),
                    path: entryPath,
                    size: stat.size,
                    mtimeMs: stat.mtimeMs,
                });
            } catch {
                continue;
            }
        }
    }

    return files
        .sort((left, right) => right.mtimeMs - left.mtimeMs)
        .slice(0, limit);
}

export async function listLocalMicrosoftSources(): Promise<LocalMicrosoftSource[]> {
    const entries = await Promise.all(
        LOCAL_MICROSOFT_SOURCE_CANDIDATES.map(async (source) => ({
            source,
            available: await exists(source.path),
        }))
    );

    return entries.filter((entry) => entry.available).map((entry) => entry.source);
}

export async function importLocalMicrosoftSource({
    projectId,
    sourceId,
}: {
    projectId: string;
    sourceId: LocalMicrosoftSourceId;
}) {
    const source = LOCAL_MICROSOFT_SOURCE_CANDIDATES.find((entry) => entry.id === sourceId);
    if (!source) {
        throw new Error(`Unknown Microsoft local source: ${sourceId}`);
    }
    if (source.importStrategy !== 'folder-files') {
        throw new Error(`${source.name} is not importable as a project file source yet.`);
    }
    if (!(await exists(source.path))) {
        throw new Error(`${source.name} is not available on this machine.`);
    }

    const files = await collectSupportedFiles(source.path, MAX_FILES);
    if (files.length === 0) {
        throw new Error(`No supported files found under ${source.path}`);
    }

    const dataSource = await createDataSource({
        projectId,
        name: `${source.name} (Local)`,
        description: `${source.description} Imported from ${source.path}.`,
        data: {
            type: 'files_local',
        },
    });

    await addDocsToDataSource({
        sourceId: dataSource.id,
        docData: files.map((file) => ({
            name: file.name,
            data: {
                type: 'file_local',
                name: file.name,
                size: file.size,
                mimeType: mimeTypeForFile(file.path),
                path: file.path,
            },
        })),
    });

    return {
        sourceId: dataSource.id,
        docCount: files.length,
    };
}
