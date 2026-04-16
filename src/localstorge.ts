export function saveItem<T>(key: string, item: T): void {
    localStorage.setItem(key, JSON.stringify(item));
}

export function loadItem<T>(key: string, fallback: T | null = null): T | null {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    try {
        return JSON.parse(raw) as T;
    } catch {
        return fallback;
    }
}
