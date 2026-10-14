import { projectConstants } from '../constants'
import applicationManifest from '../../../../package.json'

const DEFAULT_API_TIMEOUT = 15_000
const DEFAULT_TIME_ZONE = 'Asia/Shanghai'
const supportedLanguages = ['zh-CN'] as const

function getPositiveInteger(value: string | undefined, fallback: number): number {
    const parsedValue = Number(value)
    return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : fallback
}

export const sharedConfig = {
    application: {
        version: applicationManifest.version,
        name: process.env.NEXT_PUBLIC_APP_NAME ?? projectConstants.shortName,
        mode: process.env.NEXT_PUBLIC_DEPLOY_ENV,
        environment: process.env.NEXT_PUBLIC_DEPLOY_ENV ?? 'development',
    },
    api: {
        baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? '/api',
        timeout: getPositiveInteger(process.env.NEXT_PUBLIC_API_TIMEOUT, DEFAULT_API_TIMEOUT),
    },
    locale: {
        defaultLanguage: 'zh-CN',
        supportedLanguages,
    },
    time: {
        // Global display fallback. Content- or user-specific views may pass another IANA timezone.
        defaultTimeZone: DEFAULT_TIME_ZONE,
    },
    pagination: {
        defaultPage: 1,
        defaultPageSize: 20,
        maxPageSize: 100,
    },
    storageKeys: {
        dailyCheckin: 'english-learning-daily-checkin-v1',
        homeClubPrompt: 'english-learning-home-club-prompt-v1',
        learningPreferences: 'english-learning-preferences-v1',
        language: 'english-learning-language',
        theme: 'english-learning-theme',
        pwaInstalled: 'english-learning-pwa-installed',
        accessToken: 'english-learning-access-token',
        locationPromptConfirmed: 'english-learning-location-prompt-confirmed',
    },
} as const
