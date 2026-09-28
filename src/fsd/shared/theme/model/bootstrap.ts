import { sharedConfig } from '../../config'
import { storageBootstrapRead } from '../../lib/storage'
export function getThemeBootstrapScript(): string {
    return `(() => { try { const theme = ${storageBootstrapRead(sharedConfig.storageKeys.theme)}; if (theme === 'dark' || theme === 'light') document.documentElement.dataset.theme = theme } catch {} })()`
}
