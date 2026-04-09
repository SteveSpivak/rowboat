import fs from 'fs';
import path from 'path';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { trackBlock } from '@x/shared';
import { WorkDir } from '../../config/config.js';
import { commitAll } from '../version_history.js';
import type { ParsedTrack, TrackBlockLocation } from './types.js';

const KNOWLEDGE_DIR = path.join(WorkDir, 'knowledge');

// ---------------------------------------------------------------------------
// Block location helpers
// ---------------------------------------------------------------------------

export function findTrackBlock(lines: string[], trackId: string): TrackBlockLocation | null {
    let i = 0;
    while (i < lines.length) {
        if (lines[i].trim() === '```track') {
            const fenceStart = i;
            const contentStart = i + 1;
            i++;
            const jsonLines: string[] = [];
            while (i < lines.length && lines[i].trim() !== '```') {
                jsonLines.push(lines[i]);
                i++;
            }
            const fenceEnd = i;
            try {
                const data = parseYaml(jsonLines.join('\n'));
                if (data && typeof data === 'object' && data.trackId === trackId) {
                    return { fenceStart, contentStart, fenceEnd, data };
                }
            } catch { /* skip malformed blocks */ }
        }
        i++;
    }
    return null;
}

export function findAllTrackBlocks(lines: string[]): TrackBlockLocation[] {
    const blocks: TrackBlockLocation[] = [];
    let i = 0;
    while (i < lines.length) {
        if (lines[i].trim() === '```track') {
            const fenceStart = i;
            const contentStart = i + 1;
            i++;
            const jsonLines: string[] = [];
            while (i < lines.length && lines[i].trim() !== '```') {
                jsonLines.push(lines[i]);
                i++;
            }
            const fenceEnd = i;
            try {
                const data = parseYaml(jsonLines.join('\n'));
                if (data && typeof data === 'object') {
                    blocks.push({ fenceStart, contentStart, fenceEnd, data });
                }
            } catch { /* skip */ }
        }
        i++;
    }
    return blocks;
}

// ---------------------------------------------------------------------------
// Scanning
// ---------------------------------------------------------------------------

export function scanAllTracks(): ParsedTrack[] {
    if (!fs.existsSync(KNOWLEDGE_DIR)) return [];

    const results: ParsedTrack[] = [];
    const entries = fs.readdirSync(KNOWLEDGE_DIR, { recursive: true, withFileTypes: true });

    for (const entry of entries) {
        if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
        const filePath = path.join(entry.parentPath, entry.name);
        results.push(...extractTracks(filePath));
    }

    return results;
}

export function extractTracks(filePath: string): ParsedTrack[] {
    let content: string;
    try {
        content = fs.readFileSync(filePath, 'utf-8');
    } catch {
        return [];
    }

    const lines = content.split('\n');
    const blocks = findAllTrackBlocks(lines);

    return blocks
        .map(block => {
            const parsed = trackBlock.TrackBlockSchema.safeParse(block.data);
            if (!parsed.success) return null;
            return {
                ...parsed.data,
                filePath,
                currentContent: readTargetContent(content, parsed.data.trackId),
            };
        })
        .filter((t): t is ParsedTrack => t !== null);
}

// ---------------------------------------------------------------------------
// Target region read/write
// ---------------------------------------------------------------------------

export function readTargetContent(content: string, trackId: string): string | null {
    const openTag = `<!--track-target:${trackId}-->`;
    const closeTag = `<!--/track-target:${trackId}-->`;
    const openIdx = content.indexOf(openTag);
    const closeIdx = content.indexOf(closeTag);
    if (openIdx === -1 || closeIdx === -1 || closeIdx <= openIdx) return null;
    return content.slice(openIdx + openTag.length, closeIdx).trim();
}

export function writeTrackResult(filePath: string, trackId: string, newContent: string): void {
    let content = fs.readFileSync(filePath, 'utf-8');
    const openTag = `<!--track-target:${trackId}-->`;
    const closeTag = `<!--/track-target:${trackId}-->`;

    const openIdx = content.indexOf(openTag);
    const closeIdx = content.indexOf(closeTag);

    if (openIdx !== -1 && closeIdx !== -1 && closeIdx > openIdx) {
        // Replace existing target region content
        content = content.slice(0, openIdx + openTag.length)
            + '\n' + newContent + '\n'
            + content.slice(closeIdx);
    } else {
        // No target region — find the track's closing code fence and insert after it
        const lines = content.split('\n');
        const loc = findTrackBlock(lines, trackId);
        if (!loc) return;
        lines.splice(loc.fenceEnd + 1, 0, '', openTag, newContent, closeTag);
        content = lines.join('\n');
    }

    // Update lastRunAt in the track block JSON
    const lines = content.split('\n');
    const loc = findTrackBlock(lines, trackId);
    if (loc) {
        loc.data.lastRunAt = new Date().toISOString();
        lines.splice(loc.contentStart, loc.fenceEnd - loc.contentStart, stringifyYaml(loc.data).trimEnd());
        content = lines.join('\n');
    }

    fs.writeFileSync(filePath, content, 'utf-8');
    commitAll('Track update: ' + trackId, 'Tracks');
}
