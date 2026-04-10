export type BuiltinSkillCatalogEntry = {
    id: string;
    title: string;
    summary: string;
};

export const BUILTIN_SKILL_CATALOG: BuiltinSkillCatalogEntry[] = [
    {
        id: 'create-presentations',
        title: 'Create Presentations',
        summary: 'Create PDF presentations and slide decks from natural language requests using knowledge base context.',
    },
    {
        id: 'doc-collab',
        title: 'Document Collaboration',
        summary: 'Create, edit, and refine notes and documents in the knowledge base.',
    },
    {
        id: 'draft-emails',
        title: 'Draft Emails',
        summary: 'Draft email responses using inbox, calendar, and knowledge context.',
    },
    {
        id: 'meeting-prep',
        title: 'Meeting Prep',
        summary: 'Prepare meeting briefs by gathering context about attendees from the knowledge base.',
    },
    {
        id: 'organize-files',
        title: 'Organize Files',
        summary: 'Find, move, and organize files on the user machine with explicit file-management guidance.',
    },
    {
        id: 'background-agents',
        title: 'Background Agents',
        summary: 'Create, edit, and schedule background agents and multi-agent workflows.',
    },
    {
        id: 'builtin-tools',
        title: 'Builtin Tools Reference',
        summary: 'Use workspace, shell, file, and tool-execution builtins safely and correctly.',
    },
    {
        id: 'mcp-integration',
        title: 'MCP Integration Guidance',
        summary: 'Discover, evaluate, and execute MCP tools and external capabilities.',
    },
    {
        id: 'composio-integration',
        title: 'Composio Integration',
        summary: 'Connect and use third-party services through Composio-backed actions.',
    },
    {
        id: 'deletion-guardrails',
        title: 'Deletion Guardrails',
        summary: 'Apply the required confirmation flow before removing workflows or agents.',
    },
    {
        id: 'app-navigation',
        title: 'App Navigation',
        summary: 'Navigate the app UI, bases, graph views, and saved views.',
    },
];
