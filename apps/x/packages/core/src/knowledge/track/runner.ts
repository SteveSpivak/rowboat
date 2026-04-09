import fs from 'fs';
import { extractTracks, readTargetContent } from './scanner.js';
import { evaluateAndEdit } from './update.js';

export interface TrackUpdateResult {
    trackId: string;
    action: 'replace' | 'no_update';
    contentBefore: string | null;
    contentAfter: string | null;
    summary: string | null;
    error?: string;
}

/**
 * Core entry point: trigger an update for a specific track block.
 * Can be called by any trigger system (manual, cron, event matching).
 */
export async function triggerTrackUpdate(
    trackId: string,
    filePath: string,
    context?: string,
): Promise<TrackUpdateResult> {
    const tracks = extractTracks(filePath);
    const track = tracks.find(t => t.trackId === trackId);
    if (!track) {
        return { trackId, action: 'no_update', contentBefore: null, contentAfter: null, summary: null, error: 'Track not found' };
    }

    const contentBefore = track.currentContent;

    try {
        const summary = await evaluateAndEdit(track, context);

        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const contentAfter = readTargetContent(fileContent, trackId);
        const didUpdate = contentAfter !== contentBefore;

        return {
            trackId,
            action: didUpdate ? 'replace' : 'no_update',
            contentBefore: contentBefore ?? null,
            contentAfter: didUpdate ? contentAfter : null,
            summary,
        };
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { trackId, action: 'no_update', contentBefore: contentBefore ?? null, contentAfter: null, summary: null, error: msg };
    }
}
