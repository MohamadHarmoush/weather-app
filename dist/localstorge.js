export function saveItem(key, item) {
    localStorage.setItem(key, JSON.stringify(item));
}
export function loadItem(key, fallback = null) {
    const raw = localStorage.getItem(key);
    if (raw === null)
        return fallback;
    try {
        return JSON.parse(raw);
    }
    catch {
        return fallback;
    }
}
//# sourceMappingURL=localstorge.js.map