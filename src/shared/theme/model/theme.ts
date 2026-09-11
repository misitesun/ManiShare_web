import { defaultTheme, isSupportedTheme, sharedConfig, type AppTheme } from '../../config'
import { storage } from '../../lib/storage'

export function getInitialTheme(): AppTheme {
    const savedTheme = storage.get(sharedConfig.storageKeys.theme)
    return isSupportedTheme(savedTheme) ? savedTheme : defaultTheme
}

export function applyTheme(theme: AppTheme): void {
    if (typeof document === 'undefined') return
    const rootElement = document.documentElement
    rootElement.dataset.theme = theme

    const themeColor = window
        .getComputedStyle(rootElement)
        .getPropertyValue('--app-color-canvas')
        .trim()
    document
        .querySelector<HTMLMetaElement>('meta[name="theme-color"]')
        ?.setAttribute('content', themeColor)
}

export function initializeTheme(): void {
    applyTheme(getInitialTheme())
}
