import fs from 'node:fs';
import path from 'node:path';
import { WorkDir } from '../config/config.js';

type MountType = 'directory' | 'selected-files';

export interface ExternalMount {
  virtualPath: string;
  sourcePath: string;
  type: MountType;
  displayName: string;
  allowedFiles?: string[];
  excludeTopLevel?: string[];
}

export interface ExternalMountMatch {
  mount: ExternalMount;
  remainder: string;
}

interface ExternalKnowledgeSourcesConfig {
  newVault?: {
    enabled?: boolean;
    sourceRoot?: string;
    excludeTopLevel?: string[];
  };
  projectCatalog?: {
    enabled?: boolean;
    roots?: string[];
    maxDepth?: number;
    docCandidates?: string[];
  };
  localFolders?: {
    enabled?: boolean;
    roots?: string[];
  };
}

interface ExternalSourceState {
  mounts: ExternalMount[];
}

const CONFIG_PATH = path.join(WorkDir, 'config', 'external-knowledge-sources.json');
const SOURCES_ROOT = 'knowledge/Sources';
const NEWVAULT_ROOT = `${SOURCES_ROOT}/NewVault`;
const PROJECTS_ROOT = `${SOURCES_ROOT}/Projects`;
const FOLDERS_ROOT = `${SOURCES_ROOT}/Folders`;
const DEFAULT_DOC_CANDIDATES = ['README.md', 'AGENTS.md', 'CLAUDE.md'];
const CACHE_TTL_MS = 30_000;
const DEFAULT_EXTERNAL_SOURCES_CONFIG: ExternalKnowledgeSourcesConfig = {
  newVault: {
    enabled: true,
    sourceRoot: '/Users/steve.spivak/NewVault',
    excludeTopLevel: [],
  },
  projectCatalog: {
    enabled: true,
    roots: ['/Users/steve.spivak/dev', '/Users/steve.spivak/agent-workspace'],
    maxDepth: 2,
    docCandidates: DEFAULT_DOC_CANDIDATES,
  },
  localFolders: {
    enabled: true,
    roots: [
      '/Users/steve.spivak/Library/CloudStorage/OneDrive-Cellebrite',
      '/Users/steve.spivak/Library/CloudStorage/OneDrive-SharedLibraries-Cellebrite',
    ],
  },
};

let cachedState: ExternalSourceState | null = null;
let cachedAt = 0;
let cachedConfigMtimeMs = -1;

function normalizeRelPath(relPath: string): string {
  return relPath.replace(/\\/g, '/').replace(/^\/+/, '').replace(/\/+$/, '');
}

function safeSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120) || 'project';
}

function normalizeConfig(raw: ExternalKnowledgeSourcesConfig | null): ExternalKnowledgeSourcesConfig {
  const next = raw ?? {};
  return {
    newVault: {
      enabled: next.newVault?.enabled ?? DEFAULT_EXTERNAL_SOURCES_CONFIG.newVault?.enabled ?? false,
      sourceRoot: next.newVault?.sourceRoot ?? DEFAULT_EXTERNAL_SOURCES_CONFIG.newVault?.sourceRoot ?? '',
      excludeTopLevel: next.newVault?.excludeTopLevel ?? DEFAULT_EXTERNAL_SOURCES_CONFIG.newVault?.excludeTopLevel ?? [],
    },
    projectCatalog: {
      enabled: next.projectCatalog?.enabled ?? DEFAULT_EXTERNAL_SOURCES_CONFIG.projectCatalog?.enabled ?? false,
      roots: next.projectCatalog?.roots ?? DEFAULT_EXTERNAL_SOURCES_CONFIG.projectCatalog?.roots ?? [],
      maxDepth: typeof next.projectCatalog?.maxDepth === 'number'
        ? next.projectCatalog.maxDepth
        : DEFAULT_EXTERNAL_SOURCES_CONFIG.projectCatalog?.maxDepth ?? 2,
      docCandidates: next.projectCatalog?.docCandidates ?? DEFAULT_EXTERNAL_SOURCES_CONFIG.projectCatalog?.docCandidates ?? DEFAULT_DOC_CANDIDATES,
    },
    localFolders: {
      enabled: next.localFolders?.enabled ?? DEFAULT_EXTERNAL_SOURCES_CONFIG.localFolders?.enabled ?? false,
      roots: next.localFolders?.roots ?? DEFAULT_EXTERNAL_SOURCES_CONFIG.localFolders?.roots ?? [],
    },
  };
}

function readConfigSync(): ExternalKnowledgeSourcesConfig {
  if (!fs.existsSync(CONFIG_PATH)) {
    return normalizeConfig(null);
  }

  try {
    return normalizeConfig(JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')) as ExternalKnowledgeSourcesConfig);
  } catch {
    return normalizeConfig(null);
  }
}

function findGitReposSync(root: string, maxDepth: number): string[] {
  const repos: string[] = [];

  function walk(currentPath: string, depth: number): void {
    if (depth > maxDepth) return;

    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(currentPath, { withFileTypes: true });
    } catch {
      return;
    }

    const hasGit = entries.some((entry) => entry.isDirectory() && entry.name === '.git');
    if (hasGit) {
      repos.push(currentPath);
      return;
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (entry.name.startsWith('.')) continue;
      walk(path.join(currentPath, entry.name), depth + 1);
    }
  }

  walk(root, 0);
  return repos.sort((a, b) => a.localeCompare(b));
}

function buildProjectMounts(config: ExternalKnowledgeSourcesConfig['projectCatalog']): ExternalMount[] {
  if (!config?.enabled) {
    return [];
  }

  const roots = (config.roots ?? []).filter((root): root is string => typeof root === 'string' && root.length > 0);
  const maxDepth = typeof config.maxDepth === 'number' ? config.maxDepth : 2;
  const docCandidates = (config.docCandidates ?? DEFAULT_DOC_CANDIDATES)
    .filter((name): name is string => typeof name === 'string' && name.length > 0);

  const repoRootPairs = roots.flatMap((root) => findGitReposSync(root, maxDepth).map((repoPath) => ({ root, repoPath })));
  const nameCounts = new Map<string, number>();
  for (const { repoPath } of repoRootPairs) {
    const baseName = path.basename(repoPath);
    nameCounts.set(baseName, (nameCounts.get(baseName) ?? 0) + 1);
  }

  return repoRootPairs.map(({ root, repoPath }) => {
    const baseName = path.basename(repoPath);
    const slug = safeSlug(`${path.basename(root)}-${path.relative(root, repoPath)}`);
    const duplicateCount = nameCounts.get(baseName) ?? 0;
    const relativeName = path.relative(root, repoPath).split(path.sep).join('/');
    const displayName = duplicateCount > 1 ? `${path.basename(root)}/${relativeName}` : baseName;

    return {
      virtualPath: `${PROJECTS_ROOT}/${slug}`,
      sourcePath: repoPath,
      type: 'selected-files',
      displayName,
      allowedFiles: docCandidates,
    };
  });
}

function buildLocalFolderMounts(config: ExternalKnowledgeSourcesConfig['localFolders']): ExternalMount[] {
  if (!config?.enabled) {
    return [];
  }

  const roots = (config.roots ?? [])
    .filter((root): root is string => typeof root === 'string' && root.length > 0)
    .filter((root) => fs.existsSync(root));
  const nameCounts = new Map<string, number>();

  for (const root of roots) {
    const baseName = path.basename(root);
    nameCounts.set(baseName, (nameCounts.get(baseName) ?? 0) + 1);
  }

  return roots.map((root, index) => {
    const baseName = path.basename(root);
    const duplicateCount = nameCounts.get(baseName) ?? 0;
    const displayName = duplicateCount > 1 ? `${baseName}-${index + 1}` : baseName;

    return {
      virtualPath: `${FOLDERS_ROOT}/${safeSlug(displayName)}`,
      sourcePath: root,
      type: 'directory',
      displayName,
    };
  });
}

function loadStateSync(): ExternalSourceState {
  let configMtimeMs = -1;
  try {
    configMtimeMs = fs.statSync(CONFIG_PATH).mtimeMs;
  } catch {
    configMtimeMs = -1;
  }

  const now = Date.now();
  if (cachedState && cachedConfigMtimeMs === configMtimeMs && now - cachedAt < CACHE_TTL_MS) {
    return cachedState;
  }

  const config = readConfigSync();
  const mounts: ExternalMount[] = [];

  const newVaultRoot = config.newVault?.enabled ? config.newVault.sourceRoot : undefined;
  if (typeof newVaultRoot === 'string' && newVaultRoot.length > 0 && fs.existsSync(newVaultRoot)) {
    mounts.push({
      virtualPath: NEWVAULT_ROOT,
      sourcePath: newVaultRoot,
      type: 'directory',
      displayName: 'NewVault',
      excludeTopLevel: config.newVault?.excludeTopLevel?.filter((name): name is string => typeof name === 'string' && name.length > 0),
    });
  }

  mounts.push(...buildProjectMounts(config.projectCatalog));
  mounts.push(...buildLocalFolderMounts(config.localFolders));

  cachedState = { mounts };
  cachedAt = now;
  cachedConfigMtimeMs = configMtimeMs;
  return cachedState;
}

function resolveUnderRoot(root: string, relPath: string): string {
  const resolved = relPath ? path.resolve(root, relPath) : root;
  if (!resolved.startsWith(root + path.sep) && resolved !== root) {
    throw new Error('Path outside external source boundary');
  }
  return resolved;
}

export function listExternalMounts(): ExternalMount[] {
  return loadStateSync().mounts;
}

export function hasExternalSources(): boolean {
  return listExternalMounts().length > 0;
}

export function getExternalVirtualEntries(parentRelPath: string): Array<{ name: string; path: string; kind: 'dir' }> {
  const normalized = normalizeRelPath(parentRelPath);
  const mounts = listExternalMounts();

  if (mounts.length === 0) {
    return [];
  }

  if (normalized === 'knowledge') {
    return [{ name: 'Sources', path: SOURCES_ROOT, kind: 'dir' }];
  }

  if (normalized === SOURCES_ROOT) {
    const entries: Array<{ name: string; path: string; kind: 'dir' }> = [];
    if (mounts.some((mount) => mount.virtualPath === NEWVAULT_ROOT)) {
      entries.push({ name: 'NewVault', path: NEWVAULT_ROOT, kind: 'dir' });
    }
    if (mounts.some((mount) => mount.virtualPath.startsWith(`${PROJECTS_ROOT}/`))) {
      entries.push({ name: 'Projects', path: PROJECTS_ROOT, kind: 'dir' });
    }
    if (mounts.some((mount) => mount.virtualPath.startsWith(`${FOLDERS_ROOT}/`))) {
      entries.push({ name: 'Folders', path: FOLDERS_ROOT, kind: 'dir' });
    }
    return entries;
  }

  if (normalized === PROJECTS_ROOT) {
    return mounts
      .filter((mount) => mount.virtualPath.startsWith(`${PROJECTS_ROOT}/`))
      .map((mount) => ({
        name: mount.displayName,
        path: mount.virtualPath,
        kind: 'dir' as const,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  if (normalized === FOLDERS_ROOT) {
    return mounts
      .filter((mount) => mount.virtualPath.startsWith(`${FOLDERS_ROOT}/`))
      .map((mount) => ({
        name: mount.displayName,
        path: mount.virtualPath,
        kind: 'dir' as const,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  return [];
}

export function isExternalVirtualDirectory(relPath: string): boolean {
  const normalized = normalizeRelPath(relPath);
  if (normalized === SOURCES_ROOT || normalized === PROJECTS_ROOT || normalized === FOLDERS_ROOT) {
    return hasExternalSources();
  }
  return listExternalMounts().some((mount) => mount.virtualPath === normalized);
}

export function resolveExternalSourcePath(relPath: string): string | null {
  const normalized = normalizeRelPath(relPath);

  const match = matchExternalMount(normalized);
  if (!match) {
    return null;
  }

  const { mount, remainder } = match;

  if (mount.type === 'directory') {
    return resolveUnderRoot(mount.sourcePath, remainder);
  }

  if (!remainder) {
    return mount.sourcePath;
  }

  const remainderParts = remainder.split('/');
  if (remainderParts.length !== 1) {
    return null;
  }

  if (!mount.allowedFiles?.includes(remainderParts[0]!)) {
    return null;
  }

  return resolveUnderRoot(mount.sourcePath, remainder);
}

export function absExternalToRelPosix(absPath: string): string | null {
  const normalizedAbs = path.normalize(absPath);

  for (const mount of listExternalMounts()) {
    const normalizedSource = path.normalize(mount.sourcePath);
    if (!normalizedAbs.startsWith(normalizedSource + path.sep) && normalizedAbs !== normalizedSource) {
      continue;
    }

    const relWithinMount = path.relative(normalizedSource, normalizedAbs).split(path.sep).join('/');
    if (mount.type === 'selected-files') {
      if (!relWithinMount) {
        return mount.virtualPath;
      }
      if (!mount.allowedFiles?.includes(relWithinMount)) {
        return null;
      }
    }

    return relWithinMount ? `${mount.virtualPath}/${relWithinMount}` : mount.virtualPath;
  }

  return null;
}

export function isReadOnlyExternalPath(relPath: string): boolean {
  return resolveExternalSourcePath(relPath) !== null || isExternalVirtualDirectory(relPath);
}

export function matchExternalMount(relPath: string): ExternalMountMatch | null {
  const normalized = normalizeRelPath(relPath);
  for (const mount of listExternalMounts()) {
    if (normalized !== mount.virtualPath && !normalized.startsWith(`${mount.virtualPath}/`)) {
      continue;
    }

    const remainder = normalized === mount.virtualPath ? '' : normalized.slice(mount.virtualPath.length + 1);
    return { mount, remainder };
  }
  return null;
}

export function listMountedMarkdownFiles(): string[] {
  const files: string[] = [];

  function walkDirectory(dirPath: string, isRoot: boolean, excludeTopLevel: Set<string>): void {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dirPath, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (entry.name.startsWith('.')) {
        continue;
      }
      if (isRoot && excludeTopLevel.has(entry.name)) {
        continue;
      }

      const entryPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        walkDirectory(entryPath, false, excludeTopLevel);
        continue;
      }

      if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(entryPath);
      }
    }
  }

  for (const mount of listExternalMounts()) {
    if (mount.type === 'directory') {
      walkDirectory(mount.sourcePath, true, new Set(mount.excludeTopLevel ?? []));
      continue;
    }

    for (const fileName of mount.allowedFiles ?? []) {
      if (!fileName.endsWith('.md')) continue;
      const filePath = path.join(mount.sourcePath, fileName);
      if (fs.existsSync(filePath)) {
        files.push(filePath);
      }
    }
  }

  return files.sort((a, b) => a.localeCompare(b));
}
