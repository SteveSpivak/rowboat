import { generateObject } from 'ai';
import { trackBlock } from '@x/shared';
import type { KnowledgeEvent } from '@x/shared/dist/track-block.js';
import container from '../../di/container.js';
import type { IModelConfigRepo } from '../../models/repo.js';
import { createProvider } from '../../models/models.js';
import { isSignedIn } from '../../account/account.js';
import { getGatewayProvider } from '../../models/gateway.js';
import type { ParsedTrack } from './types.js';

const BATCH_SIZE = 20;

const ROUTING_SYSTEM_PROMPT = `You are a routing classifier for a knowledge management system.

You will receive an event (something that happened — an email, meeting, message, etc.) and a list of track blocks. Each track block has:
- trackId: a unique identifier
- matchCriteria: a description of what kinds of signals are relevant to this track

Your job is to identify which track blocks MIGHT be relevant to this event.

Rules:
- Be LIBERAL in your selections. Include any track that is even moderately relevant.
- Prefer false positives over false negatives. It is much better to include a track that turns out to be irrelevant than to miss one that was relevant.
- Only exclude tracks that are CLEARLY and OBVIOUSLY irrelevant to the event.
- Do not attempt to judge whether the event contains enough information to update the track. That is handled by a later stage.
- Return an empty list only if no tracks are relevant at all.`;

async function resolveModel() {
    const repo = container.resolve<IModelConfigRepo>('modelConfigRepo');
    const config = await repo.getConfig();
    const signedIn = await isSignedIn();
    const provider = signedIn
        ? await getGatewayProvider()
        : createProvider(config.provider);
    const modelId = config.knowledgeGraphModel
        || (signedIn ? 'gpt-5.4' : config.model);
    return provider.languageModel(modelId);
}

function buildRoutingPrompt(event: KnowledgeEvent, batch: ParsedTrack[]): string {
    const trackList = batch
        .map((t, i) => `${i + 1}. trackId: ${t.trackId}\n   matchCriteria: ${t.matchCriteria}`)
        .join('\n\n');

    return `## Event

Source: ${event.source}
Type: ${event.type}
Time: ${event.createdAt}

${event.payload}

## Track Blocks

${trackList}`;
}

export async function findCandidates(
    event: KnowledgeEvent,
    allTracks: ParsedTrack[],
): Promise<ParsedTrack[]> {
    // Short-circuit for targeted re-runs — skip LLM routing entirely
    if (event.targetTrackId) {
        const target = allTracks.find(t => t.trackId === event.targetTrackId);
        return target ? [target] : [];
    }

    const filtered = allTracks.filter(t =>
        t.active && t.instruction && t.matchCriteria
    );
    if (filtered.length === 0) return [];

    const model = await resolveModel();
    const candidateIds = new Set<string>();

    for (let i = 0; i < filtered.length; i += BATCH_SIZE) {
        const batch = filtered.slice(i, i + BATCH_SIZE);
        const { object } = await generateObject({
            model,
            system: ROUTING_SYSTEM_PROMPT,
            prompt: buildRoutingPrompt(event, batch),
            schema: trackBlock.Pass1OutputSchema,
        });
        object.candidateTrackIds.forEach(id => candidateIds.add(id));
    }

    return filtered.filter(t => candidateIds.has(t.trackId));
}
