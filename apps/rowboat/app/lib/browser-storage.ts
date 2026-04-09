export function getBrowserStorage(): Storage | null {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        const storage = window.localStorage;
        if (
            typeof storage?.getItem !== 'function' ||
            typeof storage?.setItem !== 'function' ||
            typeof storage?.removeItem !== 'function'
        ) {
            return null;
        }

        return storage;
    } catch {
        return null;
    }
}

export function storageGetItem(key: string): string | null {
    try {
        return getBrowserStorage()?.getItem(key) ?? null;
    } catch {
        return null;
    }
}

export function storageSetItem(key: string, value: string): void {
    try {
        getBrowserStorage()?.setItem(key, value);
    } catch {}
}

export function storageRemoveItem(key: string): void {
    try {
        getBrowserStorage()?.removeItem(key);
    } catch {}
}
