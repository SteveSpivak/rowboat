'use server';

import fs from 'node:fs/promises';
import path from 'node:path';
import { LOCAL_KNOWLEDGE_ROOTS } from '../lib/local-knowledge-roots';
import { createDataSource, addDocsToDataSource } from './data-source.actions';

const MAX_NEWVAULT_DOCS = 120;
const MAX_REPO_DOCS = 40;
const MAX_TEXT_LENGTH = 20000;
const MAX_DEPTH = 5;

const SKIP_DIRS = new Set([
    'node_modules',
    '.git',
    '.next',
    'dist',
    'build',
    'coverage',
    '__pycache__',
    '.venv',
    'venv',
]);

type MarkdownDoc = {
    name: string;
    content: string;
};

function truncate(text: string): string {
    if (text.length <= MAX_TEXT_LENGTH) return text;
    return `${text.slice(0, MAX_TEXT_LENGTH)}\n\n[truncated]`;
}

async function collectMarkdownFiles(rootPath: string, limit: number): Promise<MarkdownDoc[]> {
    const docs: MarkdownDoc[] = [];
    const queue: Array<{ dir: string; depth: number }> = [{ dir: rootPath, depth: 0 }];

    while (queue.length > 0 && docs.length < limit) {
        const current = queue.shift();
        if (!current) break;
        if (current.depth > MAX_DEPTH) continue;

        let entries;
        try {
            entries = await fs.readdir(current.dir, { withFileTypes: true });
        } catch {
            continue;
        }

        for (const entry of entries) {
            if (docs.length >= limit) break;
            if (entry.name.startsWith('.') && entry.name !== '.env') {
                continue;
            }
            if (entry.isDirectory()) {
                if (SKIP_DIRS.has(entry.name)) continue;
                queue.push({ dir: path.join(current.dir, entry.name), depth: current.depth + 1 });
                continue;
            }
            if (!entry.isFile()) continue;
            if (!entry.name.toLowerCase().endsWith('.md')) continue;
            const filePath = path.join(current.dir, entry.name);
            try {
                const content = await fs.readFile(filePath, 'utf8');
                docs.push({
                    name: path.relative(rootPath, filePath),
                    content: truncate(content),
                });
            } catch {
                continue;
            }
        }
    }

    return docs;
}

async function findGitRepos(rootPath: string, limit: number): Promise<string[]> {
    const repos: string[] = [];
    const queue: Array<{ dir: string; depth: number }> = [{ dir: rootPath, depth: 0 }];

    while (queue.length > 0 && repos.length < limit) {
        const current = queue.shift();
        if (!current) break;
        if (current.depth > MAX_DEPTH) continue;

        let entries;
        try {
            entries = await fs.readdir(current.dir, { withFileTypes: true });
        } catch {
            continue;
        }

        const hasGit = entries.some((entry) => entry.isDirectory() && entry.name === '.git');
        if (hasGit) {
            repos.push(current.dir);
            continue;
        }

        for (const entry of entries) {
            if (repos.length >= limit) break;
            if (!entry.isDirectory()) continue;
            if (entry.name.startsWith('.') || SKIP_DIRS.has(entry.name)) continue;
            queue.push({ dir: path.join(current.dir, entry.name), depth: current.depth + 1 });
        }
    }

    return repos;
}

async function buildRepoDocs(rootPath: string): Promise<MarkdownDoc[]> {
    const repos = await findGitRepos(rootPath, MAX_REPO_DOCS);
    const docs: MarkdownDoc[] = [];

    for (const repoPath of repos) {
        const repoName = path.basename(repoPath);
        const readmeCandidates = ['README.md', 'readme.md', 'README.mdx', 'readme.mdx'];
        let content = '';
        let readmePath = '';

        for (const candidate of readmeCandidates) {
            const candidatePath = path.join(repoPath, candidate);
            try {
                content = await fs.readFile(candidatePath, 'utf8');
                readmePath = candidate;
                break;
            } catch {
                continue;
            }
        }

        if (!content) {
            content = `# ${repoName}\n\nPath: ${repoPath}\n\nREADME not found.`;
        }

        docs.push({
            name: path.relative(rootPath, repoPath) + (readmePath ? `/${readmePath}` : '/README'),
            content: truncate(content),
        });
    }

    return docs;
}

export async function importLocalKnowledgeRoot({
    projectId,
    rootId,
}: {
    projectId: string;
    rootId: string;
}) {
    const root = LOCAL_KNOWLEDGE_ROOTS.find((item) => item.id === rootId);
    if (!root) {
        throw new Error(`Unknown knowledge root: ${rootId}`);
    }

    const dataSource = await createDataSource({
        projectId,
        name: `${root.name} (Local)`,
        description: root.description,
        data: {
            type: 'text',
        },
        status: 'ready',
    });

    let docs: MarkdownDoc[] = [];
    if (root.importMode === 'vault-markdown') {
        docs = await collectMarkdownFiles(root.path, MAX_NEWVAULT_DOCS);
    } else {
        docs = await buildRepoDocs(root.path);
    }

    if (docs.length === 0) {
        throw new Error(`No readable documents found under ${root.path}`);
    }

    await addDocsToDataSource({
        sourceId: dataSource.id,
        docData: docs.map((doc) => ({
            name: doc.name,
            data: {
                type: 'text',
                content: doc.content,
            },
        })),
    });

    return {
        sourceId: dataSource.id,
        docCount: docs.length,
    };
}
