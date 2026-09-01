import type { AppNavigationItem } from '../../widgets/app-layout'
import { routePaths } from './routes'

export const navigationItems = [
  { labelKey: 'navigation.foundation', to: routePaths.foundation, end: true },
] satisfies readonly AppNavigationItem[]
