export type LocalKnowledgeRootId = 'newvault' | 'agent-workspace' | 'dev';

export type LocalKnowledgeRoot = {
    id: LocalKnowledgeRootId;
    name: string;
    path: string;
    description: string;
    importMode: 'vault-markdown' | 'repo-knowledge';
};

export const LOCAL_KNOWLEDGE_ROOTS: LocalKnowledgeRoot[] = [
    {
        id: 'newvault',
        name: 'NewVault',
        path: '/Users/steve.spivak/NewVault',
        description: 'Primary markdown brain and note corpus.',
        importMode: 'vault-markdown',
    },
    {
        id: 'agent-workspace',
        name: 'agent-workspace',
        path: '/Users/steve.spivak/agent-workspace',
        description: 'Active repositories, specs, plans, and working notes.',
        importMode: 'repo-knowledge',
    },
    {
        id: 'dev',
        name: 'dev',
        path: '/Users/steve.spivak/dev',
        description: 'Additional development repositories and local project knowledge.',
        importMode: 'repo-knowledge',
    },
];
