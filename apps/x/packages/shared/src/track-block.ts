import z from 'zod';

export const TrackBlockSchema = z.object({
    trackId: z.string(),
    instruction: z.string(),
    matchCriteria: z.string(),
    active: z.boolean().default(true),
    lastRunAt: z.string().optional(),
});

export const TrackResultSchema = z.object({
    trackId: z.string(),
    action: z.enum(['no_update', 'replace']),
    contentBefore: z.string().nullable(),
    contentAfter: z.string().nullable(),
    summary: z.string().optional(),
    error: z.string().optional(),
});

export const KnowledgeEventSchema = z.object({
    id: z.string(),
    source: z.enum(['gmail', 'slack', 'calendar', 'meeting', 'voice', 'timer']),
    type: z.string(),
    createdAt: z.string(),
    payload: z.string(),
    metadata: z.record(z.string(), z.unknown()).optional(),
    targetTrackId: z.string().optional(),
    targetFilePath: z.string().optional(),
    candidateTrackIds: z.array(z.string()).optional(),
    trackResults: z.array(TrackResultSchema).optional(),
    error: z.string().optional(),
});

export const Pass1OutputSchema = z.object({
    candidateTrackIds: z.array(z.string()),
});

export const Pass2OutputSchema = z.object({
    action: z.enum(['no_update', 'replace']),
    content: z.string().nullable(),
});

export type TrackBlock = z.infer<typeof TrackBlockSchema>;
export type TrackResult = z.infer<typeof TrackResultSchema>;
export type KnowledgeEvent = z.infer<typeof KnowledgeEventSchema>;
export type Pass1Output = z.infer<typeof Pass1OutputSchema>;
export type Pass2Output = z.infer<typeof Pass2OutputSchema>;
