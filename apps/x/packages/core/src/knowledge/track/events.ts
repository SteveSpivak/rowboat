import fs from 'fs';
import path from 'path';
import { WorkDir } from '../../config/config.js';
import container from '../../di/container.js';
import type { IMonotonicallyIncreasingIdGenerator } from '../../application/lib/id-gen.js';
import type { KnowledgeEvent } from '@x/shared/dist/track-block.js';

const PENDING_DIR = path.join(WorkDir, 'events', 'pending');

/**
 * Write a KnowledgeEvent to the events/pending/ directory.
 * Filename is a monotonically increasing ID so events sort by creation order.
 * Call this function in chronological order (oldest event first) within a sync batch
 * to ensure correct ordering.
 */
export async function writeEventFile(event: Omit<KnowledgeEvent, 'id'>): Promise<void> {
    fs.mkdirSync(PENDING_DIR, { recursive: true });

    const idGen = container.resolve<IMonotonicallyIncreasingIdGenerator>('idGenerator');
    const id = await idGen.next();

    const fullEvent: KnowledgeEvent = { id, ...event };
    const filePath = path.join(PENDING_DIR, `${id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(fullEvent, null, 2), 'utf-8');
}

/**
 * Create a synthetic re-run event targeting a specific track block.
 * This bypasses Pass 1 routing and goes straight to Pass 2 for the target track.
 */
export async function createRerunEvent(trackId: string, filePath: string): Promise<void> {
    await writeEventFile({
        source: 'timer',
        type: 'manual.rerun',
        createdAt: new Date().toISOString(),
        payload: `Manual re-run triggered for track ${trackId}`,
        targetTrackId: trackId,
        targetFilePath: filePath,
    });
}
