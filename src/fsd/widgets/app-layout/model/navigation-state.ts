export type NavigationViewport = 'mobile' | 'tablet' | 'desktop'

export interface NavigationState {
    readonly viewport: NavigationViewport
    readonly isNavigationOpen: boolean
}

export function getNavigationStateForViewport(viewport: NavigationViewport): NavigationState {
    return {
        viewport,
        isNavigationOpen: viewport === 'desktop',
    }
}

export function hasCollapsedNavigationRail(currentState: NavigationState): boolean {
    return !currentState.isNavigationOpen && currentState.viewport !== 'mobile'
}

export function toggleNavigationState(currentState: NavigationState): NavigationState {
    return {
        ...currentState,
        isNavigationOpen: !currentState.isNavigationOpen,
    }
}
