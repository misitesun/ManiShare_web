import mascotSource from './assets/mascot.png'

/**
 * Stable project identifiers and public static asset paths.
 * Update this single module when a high-frequency project name or asset changes.
 */
export const projectConstants = {
    brandName: '漫奇说',
    shortName: 'English Learning',
    abbreviation: 'EL',
    assets: {
        faviconPath: '/favicon.svg',
        mascotSource,
    },
} as const

export type ProjectConstant = typeof projectConstants
