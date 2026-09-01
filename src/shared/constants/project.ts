/**
 * Stable project identifiers and public static asset paths.
 * Update this single module when a high-frequency project name or asset changes.
 */
export const projectConstants = {
  shortName: 'English Learning',
  abbreviation: 'EL',
  assets: {
    faviconPath: '/favicon.svg',
  },
} as const

export type ProjectConstant = typeof projectConstants
