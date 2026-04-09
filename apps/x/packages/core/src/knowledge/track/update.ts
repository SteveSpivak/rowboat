import { createRun, createMessage } from '../../runs/runs.js';
import type { ParsedTrack } from './types.js';
import { extractAgentResponse, waitForRunCompletion } from '../../agents/utils.js';

function buildMessage(track: ParsedTrack, context?: string): string {
    const now = new Date();
    const localNow = now.toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'long' });
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const workspaceRelPath = track.filePath.replace(/^.*\.rowboat\//, '');

    let msg = `# Track Block Update Task

You are updating a track block's target region in a knowledge note.

## Current Time

Local: ${localNow}
Timezone: ${tz}
UTC: ${now.toISOString()}

## Track Details

**File:** ${track.filePath}
**Track ID:** ${track.trackId}
**Instruction:** ${track.instruction}

## Current Target Region Content

${track.currentContent || '(empty — no content yet)'}`;

    if (context) {
        msg += `

## Context

${context}`;
    }

    msg += `

## What To Do

1. Follow the track instruction above to produce or update the content
2. Use the \`update-track-content\` tool to write the result:
   - \`filePath\`: \`${workspaceRelPath}\`
   - \`trackId\`: \`${track.trackId}\`
   - \`content\`: your updated content as a string
3. Preserve existing content that's still relevant — merge new information in
4. You may use workspace tools to search the knowledge graph for additional context
5. Write in a clear, concise style appropriate for personal notes
6. Do NOT use workspace-edit or workspace-writeFile to modify the note — always use \`update-track-content\`

## After You're Done

End your response with a brief summary of what you did (1-2 sentences).`;

    return msg;
}

/**
 * Run the copilot-background agent to evaluate and update a track block.
 * Returns the agent's summary response text.
 */
export async function evaluateAndEdit(
    track: ParsedTrack,
    context?: string,
): Promise<string | null> {
    const run = await createRun({ agentId: 'copilot-background' });
    const message = buildMessage(track, context);
    await createMessage(run.id, message);
    await waitForRunCompletion(run.id);
    return extractAgentResponse(run.id);
}
