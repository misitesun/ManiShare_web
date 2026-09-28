import type { AppStorageKey } from './storage'
/** Build-only source for the pre-hydration preference read. Storage access remains in this owner. */
export function storageBootstrapRead(key: AppStorageKey): string {
    return `(() => { const raw = window.localStorage.getItem(${JSON.stringify(key)}); try { return JSON.parse(raw) } catch { return raw } })()`
}
