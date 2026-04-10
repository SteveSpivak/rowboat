export type LocalMicrosoftSourceId =
    | 'onedrive-cellebrite'
    | 'onedrive-shared-cellebrite'
    | 'outlook-main-profile'
    | 'teams-local-container';

export type LocalMicrosoftSource = {
    id: LocalMicrosoftSourceId;
    name: string;
    product: 'OneDrive' | 'Outlook' | 'Teams';
    path: string;
    description: string;
    importStrategy: 'folder-files' | 'desktop-only';
    readiness: 'ready' | 'partial' | 'provisional';
};

export const LOCAL_MICROSOFT_SOURCE_CANDIDATES: LocalMicrosoftSource[] = [
    {
        id: 'onedrive-cellebrite',
        name: 'OneDrive - Cellebrite',
        product: 'OneDrive',
        path: '/Users/steve.spivak/Library/CloudStorage/OneDrive-Cellebrite',
        description: 'Primary synced OneDrive workspace available as local files on disk.',
        importStrategy: 'folder-files',
        readiness: 'ready',
    },
    {
        id: 'onedrive-shared-cellebrite',
        name: 'OneDrive Shared Libraries - Cellebrite',
        product: 'OneDrive',
        path: '/Users/steve.spivak/Library/CloudStorage/OneDrive-SharedLibraries-Cellebrite',
        description: 'Shared SharePoint and Teams libraries synced locally through OneDrive.',
        importStrategy: 'folder-files',
        readiness: 'ready',
    },
    {
        id: 'outlook-main-profile',
        name: 'Outlook Main Profile',
        product: 'Outlook',
        path: '/Users/steve.spivak/Library/Group Containers/UBF8T346G9.Office/Outlook/Outlook 15 Profiles/Main Profile',
        description: 'Local Outlook profile store detected, but project import is not proven yet.',
        importStrategy: 'desktop-only',
        readiness: 'partial',
    },
    {
        id: 'teams-local-container',
        name: 'Teams Local Container',
        product: 'Teams',
        path: '/Users/steve.spivak/Library/Containers/com.microsoft.teams2/Data',
        description: 'Teams local app container exists, but durable chat/file ingestion is still provisional.',
        importStrategy: 'desktop-only',
        readiness: 'provisional',
    },
];
