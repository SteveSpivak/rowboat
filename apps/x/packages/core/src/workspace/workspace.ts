import fs from 'node:fs/promises';
import type { Dirent, Stats } from 'node:fs';
import path from 'node:path';
import { workspace } from '@x/shared';
import { z } from 'zod';
import { RemoveOptions, WriteFileOptions, WriteFileResult } from 'packages/shared/dist/workspace.js';
import { WorkDir } from '../config/config.js';
import { rewriteWikiLinksForRenamedKnowledgeFile } from './wiki-link-rewrite.js';
import { commitAll } from '../knowledge/version_history.js';
import {
  absExternalToRelPosix,
  getExternalVirtualEntries,
  isExternalVirtualDirectory,
  isReadOnlyExternalPath,
  matchExternalMount,
  resolveExternalSourcePath,
} from './external_sources.js';

// ============================================================================
// Path Utilities
// ============================================================================

/**
 * Assert that a relative path is safe (no traversal, no absolute paths)
 */
export function assertSafeRelPath(relPath: string): void {
  if (path.isAbsolute(relPath)) {
    throw new Error('Absolute paths are not allowed');
  }
  if (relPath.includes('..')) {
    throw new Error('Path traversal (..) is not allowed');
  }
  // Normalize and check again after normalization
  const normalized = path.normalize(relPath);
  if (normalized.includes('..') || path.isAbsolute(normalized)) {
    throw new Error('Invalid path');
  }
}

/**
 * Resolve a workspace-relative path to an absolute path
 * Ensures the resolved path stays within the workspace boundary
 * Empty string represents the root directory
 */
function resolveInternalWorkspacePath(relPath: string): string {
  // Empty string means root directory
  if (relPath === '') {
    return WorkDir;
  }
  assertSafeRelPath(relPath);
  const resolved = path.resolve(WorkDir, relPath);
  if (!resolved.startsWith(WorkDir + path.sep) && resolved !== WorkDir) {
    throw new Error('Path outside workspace boundary');
  }
  return resolved;
}

export function resolveWorkspacePath(relPath: string): string {
  if (relPath !== '') {
    assertSafeRelPath(relPath);
    const externalResolved = resolveExternalSourcePath(relPath);
    if (externalResolved) {
      return externalResolved;
    }
  }
  return resolveInternalWorkspacePath(relPath);
}

/**
 * Convert absolute path to workspace-relative POSIX path
 * Returns null if path is outside workspace boundary
 */
export function absToRelPosix(absPath: string): string | null {
  const externalRelPath = absExternalToRelPosix(absPath);
  if (externalRelPath) {
    return externalRelPath;
  }
  const normalized = path.normalize(absPath);
  if (!normalized.startsWith(WorkDir + path.sep) && normalized !== WorkDir) {
    return null;
  }
  const relPath = path.relative(WorkDir, normalized);
  return relPath.split(path.sep).join('/');
}

function isKnowledgeMarkdownRelPath(relPath: string): boolean {
  const normalized = relPath.replace(/\\/g, '/').replace(/^\/+/, '').toLowerCase();
  return normalized.startsWith('knowledge/') && normalized.endsWith('.md');
}

function assertWritablePath(relPath: string): void {
  if (isReadOnlyExternalPath(relPath)) {
    throw new Error('External knowledge sources are read-only');
  }
}

// ============================================================================
// File System Utilities
// ============================================================================

/**
 * Compute ETag from file stats: `${size}:${mtimeMs}`
 */
export function computeEtag(size: number, mtimeMs: number): string {
  return `${size}:${mtimeMs}`;
}

/**
 * Convert fs.Stats to Stat schema
 */
export function statToSchema(stats: Stats, kind: z.infer<typeof workspace.NodeKind>): z.infer<typeof workspace.Stat> {
  return {
    kind,
    size: stats.size,
    mtimeMs: stats.mtimeMs,
    ctimeMs: stats.ctimeMs,
    isSymlink: stats.isSymbolicLink() ? true : undefined,
  };
}

/**
 * Ensure workspace root exists
 */
export async function ensureWorkspaceRoot(): Promise<void> {
  await fs.mkdir(WorkDir, { recursive: true });
}

// ============================================================================
// Workspace Operations
// ============================================================================

export async function getRoot(): Promise<{ root: string }> {
  await ensureWorkspaceRoot();
  return { root: WorkDir };
}

export async function exists(relPath: string): Promise<{ exists: boolean }> {
  if (isExternalVirtualDirectory(relPath)) {
    return { exists: true };
  }
  const filePath = resolveWorkspacePath(relPath);
  try {
    await fs.access(filePath);
    return { exists: true };
  } catch {
    return { exists: false };
  }
}

export async function stat(relPath: string): Promise<z.infer<typeof workspace.Stat>> {
  if (isExternalVirtualDirectory(relPath)) {
    return {
      kind: 'dir',
      size: 0,
      mtimeMs: 0,
      ctimeMs: 0,
    };
  }
  const filePath = resolveWorkspacePath(relPath);
  const stats = await fs.lstat(filePath);
  const kind = stats.isDirectory() ? 'dir' : 'file';
  return statToSchema(stats, kind);
}

export async function readdir(
  relPath: string,
  opts?: z.infer<typeof workspace.ReaddirOptions>,
): Promise<Array<z.infer<typeof workspace.DirEntry>>> {
  const entries: Array<z.infer<typeof workspace.DirEntry>> = [];
  const seenPaths = new Set<string>();

  function shouldIncludeName(name: string): boolean {
    if (!opts?.includeHidden && name.startsWith('.')) {
      return false;
    }
    if (opts?.allowedExtensions && opts.allowedExtensions.length > 0) {
      const ext = path.extname(name);
      if (!opts.allowedExtensions.includes(ext)) {
        return false;
      }
    }
    return true;
  }

  async function pushEntry(name: string, entryPath: string, kind: z.infer<typeof workspace.NodeKind>, absPath?: string): Promise<void> {
    if (seenPaths.has(entryPath)) {
      return;
    }
    seenPaths.add(entryPath);

    let itemStat: { size: number; mtimeMs: number } | undefined;
    if (opts?.includeStats && absPath) {
      const stats = await fs.lstat(absPath);
      itemStat = { size: stats.size, mtimeMs: stats.mtimeMs };
    }

    entries.push({ name, path: entryPath, kind, stat: itemStat });
  }

  async function readDir(currentRelPath: string): Promise<void> {
    for (const virtualEntry of getExternalVirtualEntries(currentRelPath)) {
      await pushEntry(virtualEntry.name, virtualEntry.path, 'dir');
      if (opts?.recursive) {
        await readDir(virtualEntry.path);
      }
    }

    const externalMatch = matchExternalMount(currentRelPath);
    if (externalMatch?.mount.type === 'selected-files' && externalMatch.remainder === '') {
      for (const fileName of externalMatch.mount.allowedFiles ?? []) {
        if (!shouldIncludeName(fileName)) {
          continue;
        }
        const absPath = path.join(externalMatch.mount.sourcePath, fileName);
        try {
          const stats = await fs.lstat(absPath);
          if (!stats.isFile()) {
            continue;
          }
        } catch {
          continue;
        }
        await pushEntry(fileName, path.posix.join(currentRelPath, fileName), 'file', absPath);
      }
      return;
    }

    let currentPath: string;
    try {
      currentPath = externalMatch ? resolveWorkspacePath(currentRelPath) : resolveInternalWorkspacePath(currentRelPath);
    } catch (error) {
      if (seenPaths.size > 0 || getExternalVirtualEntries(currentRelPath).length > 0) {
        return;
      }
      throw error;
    }

    let items: Dirent[];
    try {
      items = await fs.readdir(currentPath, { withFileTypes: true });
    } catch (error) {
      if (getExternalVirtualEntries(currentRelPath).length > 0) {
        return;
      }
      throw error;
    }

    for (const item of items) {
      if (
        externalMatch?.mount.type === 'directory'
        && externalMatch.remainder === ''
        && externalMatch.mount.excludeTopLevel?.includes(item.name)
      ) {
        continue;
      }

      const itemPath = path.join(currentPath, item.name);
      const itemRelPath = path.posix.join(currentRelPath, item.name);

      let itemKind: z.infer<typeof workspace.NodeKind>;

      if (item.isDirectory()) {
        if (!opts?.includeHidden && item.name.startsWith('.')) {
          continue;
        }
        itemKind = 'dir';
        await pushEntry(item.name, itemRelPath, itemKind, itemPath);

        // Recurse if recursive is true
        if (opts?.recursive) {
          await readDir(itemRelPath);
        }
      } else if (item.isFile()) {
        if (!shouldIncludeName(item.name)) {
          continue;
        }
        itemKind = 'file';
        await pushEntry(item.name, itemRelPath, itemKind, itemPath);
      }
    }
  }

  await readDir(relPath);

  // Sort: directories first, then by name (localeCompare)
  entries.sort((a, b) => {
    if (a.kind !== b.kind) {
      return a.kind === 'dir' ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });

  return entries;
}

export async function readFile(
  relPath: string,
  encoding: z.infer<typeof workspace.Encoding> = 'utf8'
): Promise<z.infer<typeof workspace.ReadFileResult>> {
  const filePath = resolveWorkspacePath(relPath);
  const stats = await fs.lstat(filePath);

  let data: string;
  if (encoding === 'utf8') {
    data = await fs.readFile(filePath, 'utf8');
  } else if (encoding === 'base64') {
    const buffer = await fs.readFile(filePath);
    data = buffer.toString('base64');
  } else {
    // binary: return as base64-encoded binary data
    const buffer = await fs.readFile(filePath);
    data = buffer.toString('base64');
  }

  const stat = statToSchema(stats, 'file');
  const etag = computeEtag(stats.size, stats.mtimeMs);

  return {
    path: relPath,
    encoding,
    data,
    stat,
    etag,
  };
}

// Debounced commit for knowledge file edits
let knowledgeCommitTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleKnowledgeCommit(filename: string): void {
  if (knowledgeCommitTimer) {
    clearTimeout(knowledgeCommitTimer);
  }
  knowledgeCommitTimer = setTimeout(() => {
    knowledgeCommitTimer = null;
    commitAll(`Edit ${filename}`, 'You').catch(err => {
      console.error('[VersionHistory] Failed to commit after edit:', err);
    });
  }, 3 * 60 * 1000);
}

export async function writeFile(
  relPath: string,
  data: string,
  opts?: z.infer<typeof WriteFileOptions>
): Promise<z.infer<typeof WriteFileResult>> {
  assertWritablePath(relPath);
  const filePath = resolveWorkspacePath(relPath);
  const encoding = opts?.encoding || 'utf8';
  const atomic = opts?.atomic !== false; // default true
  const mkdirp = opts?.mkdirp !== false; // default true

  // Create parent directory if needed
  if (mkdirp) {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
  }

  // Check expectedEtag if provided (conflict detection)
  if (opts?.expectedEtag) {
    const existingStats = await fs.lstat(filePath);
    const existingEtag = computeEtag(existingStats.size, existingStats.mtimeMs);
    if (existingEtag !== opts.expectedEtag) {
      throw new Error('File was modified (ETag mismatch)');
    }
  }

  // Convert data to buffer based on encoding
  let buffer: Buffer;
  if (encoding === 'utf8') {
    buffer = Buffer.from(data, 'utf8');
  } else if (encoding === 'base64') {
    buffer = Buffer.from(data, 'base64');
  } else {
    // binary: assume data is base64-encoded
    buffer = Buffer.from(data, 'base64');
  }

  if (atomic) {
    // Atomic write: write to temp file, then rename
    const tempPath = filePath + '.tmp.' + Date.now() + Math.random().toString(36).slice(2);
    await fs.writeFile(tempPath, buffer);
    await fs.rename(tempPath, filePath);
  } else {
    await fs.writeFile(filePath, buffer);
  }

  const stats = await fs.lstat(filePath);
  const stat = statToSchema(stats, 'file');
  const etag = computeEtag(stats.size, stats.mtimeMs);

  // Schedule a debounced version history commit for knowledge files
  if (relPath.startsWith('knowledge/') && relPath.endsWith('.md')) {
    scheduleKnowledgeCommit(path.basename(relPath));
  }

  return {
    path: relPath,
    stat,
    etag,
  };
}

export async function mkdir(
  relPath: string,
  recursive: boolean = true
): Promise<{ ok: true }> {
  assertWritablePath(relPath);
  const dirPath = resolveWorkspacePath(relPath);
  await fs.mkdir(dirPath, { recursive });
  return { ok: true as const };
}

export async function rename(
  from: string,
  to: string,
  overwrite: boolean = false
): Promise<{ ok: true }> {
  assertWritablePath(from);
  assertWritablePath(to);
  const fromPath = resolveWorkspacePath(from);
  const toPath = resolveWorkspacePath(to);

  // Check if source exists
  await fs.access(fromPath);
  const fromStats = await fs.lstat(fromPath);

  // Check if destination exists (only if overwrite is false)
  if (!overwrite) {
    try {
      await fs.access(toPath);
      // If we get here, destination exists
      throw new Error('Destination already exists');
    } catch (err: unknown) {
      // ENOENT means destination doesn't exist, which is what we want
      if (err && typeof err === 'object' && 'code' in err && err.code !== 'ENOENT') {
        throw err;
      }
      // If it's "Destination already exists", re-throw it
      if (err instanceof Error && err.message === 'Destination already exists') {
        throw err;
      }
    }
  }

  // Create parent directory for destination
  await fs.mkdir(path.dirname(toPath), { recursive: true });

  await fs.rename(fromPath, toPath);

  if (
    fromStats.isFile()
    && isKnowledgeMarkdownRelPath(from)
    && isKnowledgeMarkdownRelPath(to)
  ) {
    try {
      await rewriteWikiLinksForRenamedKnowledgeFile(WorkDir, from, to);
    } catch (error) {
      console.error('Failed to rewrite wiki backlinks after file rename:', error);
    }
  }

  return { ok: true as const };
}

export async function copy(
  from: string,
  to: string,
  overwrite: boolean = false
): Promise<{ ok: true }> {
  assertWritablePath(to);
  const fromPath = resolveWorkspacePath(from);
  const toPath = resolveWorkspacePath(to);

  // Check if source is a file (no recursive dir copy)
  const fromStats = await fs.lstat(fromPath);
  if (fromStats.isDirectory()) {
    throw new Error('Copying directories is not supported');
  }

  // Check if destination exists
  if (!overwrite) {
    await fs.access(toPath);
  }

  // Create parent directory for destination
  await fs.mkdir(path.dirname(toPath), { recursive: true });

  await fs.copyFile(fromPath, toPath);
  return { ok: true as const };
}

export async function remove(
  relPath: string,
  opts?: z.infer<typeof RemoveOptions>
): Promise<{ ok: true }> {
  assertWritablePath(relPath);
  const filePath = resolveWorkspacePath(relPath);
  const trash = opts?.trash !== false; // default true

  const stats = await fs.lstat(filePath);

  if (trash) {
    // Move to trash: ~/.workspace/.trash/<timestamp>-<name>
    const trashDir = path.join(WorkDir, '.trash');
    await fs.mkdir(trashDir, { recursive: true });

    const timestamp = Date.now();
    const basename = path.basename(filePath);
    const trashPath = path.join(trashDir, `${timestamp}-${basename}`);

    // Handle name conflicts in trash
    let finalTrashPath = trashPath;
    let counter = 1;
    while (true) {
      try {
        await fs.access(finalTrashPath);
        finalTrashPath = path.join(trashDir, `${timestamp}-${counter}-${basename}`);
        counter++;
      } catch {
        break;
      }
    }

    await fs.rename(filePath, finalTrashPath);
  } else {
    // Permanent delete
    if (stats.isDirectory()) {
      if (!opts?.recursive) {
        throw new Error('Cannot remove directory without recursive=true');
      }
      await fs.rm(filePath, { recursive: true });
    } else {
      await fs.unlink(filePath);
    }
  }

  return { ok: true as const };
}
