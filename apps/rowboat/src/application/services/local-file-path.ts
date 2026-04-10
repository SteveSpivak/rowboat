import path from 'node:path';

export function resolveStoredLocalFilePath(storedPath: string, uploadsDir: string): string {
    if (path.isAbsolute(storedPath)) {
        return storedPath;
    }

    const relativeUploadPath = storedPath.startsWith('/api/uploads/')
        ? storedPath.slice('/api/uploads/'.length)
        : storedPath.replace(/^\/+/, '');

    return path.join(uploadsDir, relativeUploadPath);
}
