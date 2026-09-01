export const enUS = {
  navigation: {
    foundation: 'Foundation',
  },
  layout: {
    productType: 'English learning platform',
    framework: 'Multi-device application foundation',
    rendererScope: 'PC · Tablet · Mobile H5 · Electron',
    p0Status: 'P0 foundation',
    mainNavigation: 'Main navigation',
    interfaceSettings: 'Interface settings',
    openNavigation: 'Open navigation',
    closeNavigation: 'Close navigation',
    homeLabel: 'Back to {{appName}} home',
    language: 'Interface language',
    theme: 'Theme',
    loading: 'Loading the application foundation…',
  },
  theme: {
    dark: 'Dark',
    light: 'Light',
  },
  foundation: {
    eyebrow: 'P0 / FOUNDATION',
    title: 'The multi-device foundation for the English learning product is ready',
    description: 'This phase delivers only the application shell, Tailwind responsive system, dark and light themes, interface languages, and shared Electron boundary. It does not implement courses, exercises, notes, profiles, or other product pages.',
    capabilities: {
      responsive: {
        title: 'Mobile-first responsive shell',
        description: 'Phones use drawer navigation, tablets gain content density, and PC or Electron uses a persistent sidebar, all from one semantic structure.',
      },
      themes: {
        title: 'Extensible dark and light themes',
        description: 'Dark and light define the full semantic token contract. Components consume Tailwind theme utilities so more themes can follow the same boundary.',
      },
      architecture: {
        title: 'FSD and a secure desktop shell',
        description: 'Business capabilities will grow through FSD. Electron keeps isolation, sandboxing, and a narrow preload/IPC boundary outside the Web renderer.',
      },
    },
    scope: {
      title: 'Current scope',
      description: 'This is a foundation verification screen, not the final home page or product information architecture. Real page, feature, and entity slices begin only after the first learning capability is confirmed.',
    },
  },
  error: {
    eyebrow: 'Page error',
    title: 'Something went wrong',
    unknown: 'An unexpected error occurred.',
    backHome: 'Back to foundation',
  },
} as const
