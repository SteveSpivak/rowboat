export interface ParsedTrack {
    trackId: string;
    instruction: string;
    matchCriteria: string;
    active: boolean;
    filePath: string;
    currentContent: string | null;
}

export interface TrackBlockLocation {
    fenceStart: number;
    contentStart: number;
    fenceEnd: number;
    data: Record<string, unknown>;
}
