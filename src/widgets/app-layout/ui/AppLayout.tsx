import { useCallback, useEffect, useId, useRef, useState } from 'react'
import type { FormEvent, ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { SubmitFeedbackDialog } from '../../../features/submit-feedback'
import { projectConstants } from '../../../shared/constants'
import { LanguageSwitcher } from '../../../shared/ui/language-switcher'
import { TldMembershipBadge } from '../../../shared/ui/tld-membership-badge'
import { TldInput } from '../../../shared/ui/tld-input'
import { TldMovingHighlight } from '../../../shared/ui/tld-moving-highlight'
import { ThemeSwitcher } from '../../../shared/ui/theme-switcher'
import { Tooltip, TooltipGroup } from '../../../shared/ui/tooltip'
import {
    getNavigationStateForViewport,
    hasCollapsedNavigationRail,
    toggleNavigationState,
} from '../model/navigation-state'
import type { NavigationViewport } from '../model/navigation-state'
import avatarSource from '../assets/avatar.png'
import clubIconSource from '../assets/header/club.svg'
import desktopIconSource from '../assets/header/desktop.svg'
import feedbackIconSource from '../assets/header/feedback.svg'
import notificationIconSource from '../assets/header/notification.svg'
import playIconSource from '../assets/header/play.svg'
import searchIconSource from '../assets/header/search.svg'
import serviceIconSource from '../assets/header/service.svg'
import sidebarToggleIconSource from '../assets/header/sidebar-toggle.svg'
import aiCreateIconSource from '../assets/navigation/ai-create.svg'
import aiTutorIconSource from '../assets/navigation/ai-tutor.svg'
import awakeningIconSource from '../assets/navigation/awakening.svg'
import bootcampIconSource from '../assets/navigation/bootcamp.svg'
import caretIconSource from '../assets/navigation/caret.svg'
import coCreateIconSource from '../assets/navigation/co-create.svg'
import competitionIconSource from '../assets/navigation/competition.svg'
import settingsIconSource from '../assets/navigation/diamond.svg'
import guideIconSource from '../assets/navigation/guide.svg'
import homeIconSource from '../assets/navigation/home.svg'
import leaderboardIconSource from '../assets/navigation/leaderboard.svg'
import pkIconSource from '../assets/navigation/pk.svg'
import prizeCenterIconSource from '../assets/navigation/prize-center.svg'
import profileIconSource from '../assets/navigation/profile.svg'
import revenueIconSource from '../assets/navigation/revenue.svg'
import diamondIconSource from '../assets/navigation/settings.svg'
import storiesIconSource from '../assets/navigation/stories.svg'
import timerIconSource from '../assets/navigation/timer.svg'
import vipIconSource from '../assets/navigation/vip.svg'
import vocabularyIconSource from '../assets/navigation/vocabulary.svg'
import wisdomIconSource from '../assets/navigation/wisdom.svg'

export type AppNavigationIcon =
    | 'ai-create'
    | 'ai-tutor'
    | 'awakening'
    | 'bootcamp'
    | 'co-create'
    | 'competition'
    | 'guide'
    | 'home'
    | 'leaderboard'
    | 'pk'
    | 'profile'
    | 'prize-center'
    | 'revenue'
    | 'stories'
    | 'vip'
    | 'vocabulary'
    | 'wisdom'

export type AppNavigationAccent = 'default' | 'vip'

export interface AppNavigationChildItem {
    readonly label?: string
    readonly labelKey: string
    readonly pageLabel?: string
    readonly pageLabelKey?: string
    readonly to?: string
    readonly end?: boolean
}

export interface AppNavigationItem {
    readonly label?: string
    readonly labelKey: string
    readonly pageLabel?: string
    readonly pageLabelKey?: string
    readonly icon: AppNavigationIcon
    readonly to?: string
    readonly end?: boolean
    readonly accent?: AppNavigationAccent
    readonly children?: readonly AppNavigationChildItem[]
}

export type AppUtilityIcon = 'club' | 'desktop' | 'feedback' | 'notification' | 'play' | 'service'
export type AppUtilityAction = 'feedback'

export interface AppUtilityItem {
    readonly labelKey: string
    readonly icon: AppUtilityIcon
    readonly action?: AppUtilityAction
}

export interface AppFooterNavigationItem {
    readonly label: string
    readonly pageLabel?: string
    readonly to: string
}

export interface AppLayoutProps {
    readonly footerNavigationItem: AppFooterNavigationItem
    readonly navigationItems: readonly AppNavigationItem[]
    readonly utilityItems: readonly AppUtilityItem[]
    readonly searchPath: string
}

interface NavigationEntryProps {
    readonly isCompact: boolean
    readonly item: AppNavigationItem
    readonly onExpandNavigation: () => void
    readonly pathname: string
    readonly onNavigate: () => void
}

const navigationIconSources: Record<AppNavigationIcon, string> = {
    'ai-create': aiCreateIconSource,
    'ai-tutor': aiTutorIconSource,
    awakening: awakeningIconSource,
    bootcamp: bootcampIconSource,
    'co-create': coCreateIconSource,
    competition: competitionIconSource,
    guide: guideIconSource,
    home: homeIconSource,
    leaderboard: leaderboardIconSource,
    pk: pkIconSource,
    profile: profileIconSource,
    'prize-center': prizeCenterIconSource,
    revenue: revenueIconSource,
    stories: storiesIconSource,
    vip: vipIconSource,
    vocabulary: vocabularyIconSource,
    wisdom: wisdomIconSource,
}

const utilityIconSources: Record<AppUtilityIcon, string> = {
    club: clubIconSource,
    desktop: desktopIconSource,
    feedback: feedbackIconSource,
    notification: notificationIconSource,
    play: playIconSource,
    service: serviceIconSource,
}

const tabletNavigationMediaQuery = '(min-width: 48rem)'
const desktopNavigationMediaQuery = '(min-width: 80rem)'

function getCurrentNavigationViewport(): NavigationViewport {
    if (typeof window === 'undefined') return 'mobile'
    if (window.matchMedia(desktopNavigationMediaQuery).matches) return 'desktop'
    if (window.matchMedia(tabletNavigationMediaQuery).matches) return 'tablet'
    return 'mobile'
}

function isPathActive(pathname: string, to: string | undefined, end = false): boolean {
    if (to === undefined) return false
    if (end) return pathname === to
    return pathname === to || pathname.startsWith(`${to}/`)
}

function getActivePageLabelSource(
    items: readonly AppNavigationItem[],
    pathname: string,
): AppNavigationChildItem | AppNavigationItem | undefined {
    for (const item of items) {
        if (isPathActive(pathname, item.to, item.end)) return item

        const activeChild = item.children?.find((child) =>
            isPathActive(pathname, child.to, child.end),
        )
        if (activeChild !== undefined) return activeChild
    }

    return undefined
}

function NavigationEntry({
    isCompact,
    item,
    onExpandNavigation,
    pathname,
    onNavigate,
}: NavigationEntryProps): ReactElement {
    const { t } = useTranslation()
    const childNavigationId = useId()
    const childNavigationRef = useRef<HTMLDivElement>(null)
    const childItems = item.children ?? []
    const itemLabel = item.label ?? t(item.labelKey)
    const hasChildren = childItems.length > 0
    const activeChild = childItems.find((child) => isPathActive(pathname, child.to, child.end))
    const hasActiveChild = activeChild !== undefined
    const isActive = isPathActive(pathname, item.to, item.end) || hasActiveChild
    const [isExpanded, setIsExpanded] = useState(false)

    const icon = (
        <img
            alt=""
            aria-hidden="true"
            className={
                isActive || item.accent !== undefined
                    ? 'size-6 shrink-0'
                    : 'size-6 shrink-0 [filter:var(--app-filter-shell-icon)]'
            }
            src={navigationIconSources[item.icon]}
        />
    )

    const withCompactTooltip = (element: ReactElement): ReactElement => {
        if (!isCompact) return element
        return (
            <Tooltip content={itemLabel} fullWidth placement="right">
                {element}
            </Tooltip>
        )
    }

    if (hasChildren) {
        const navigationButton = (
            <button
                type="button"
                aria-label={itemLabel}
                aria-controls={childNavigationId}
                aria-expanded={isCompact ? false : isExpanded}
                className={
                    isCompact
                        ? isActive
                            ? 'flex h-10 w-full cursor-pointer items-center justify-start rounded-lg bg-linear-to-r from-brand-start to-brand-end px-2 text-inverse'
                            : 'flex h-10 w-full cursor-pointer items-center justify-start rounded-lg px-2 text-primary transition-colors hover:bg-surface-hover hover:text-primary'
                        : isActive
                          ? 'flex h-10 w-full cursor-pointer items-center gap-3 rounded-lg bg-linear-to-r from-brand-start to-brand-end px-2.5 text-left text-body font-semibold text-inverse'
                          : 'flex h-10 w-full cursor-pointer items-center gap-3 rounded-lg px-2.5 text-left text-body font-medium text-primary transition-colors hover:bg-surface-hover hover:text-primary'
                }
                onClick={(): void => {
                    if (isCompact) {
                        onExpandNavigation()
                        return
                    }
                    setIsExpanded((currentValue) => !currentValue)
                }}
            >
                {icon}
                <span
                    className={
                        isCompact
                            ? 'invisible max-w-0 overflow-hidden opacity-0 transition-none'
                            : 'visible min-w-0 max-w-[9rem] flex-1 truncate opacity-100 transition-[max-width,opacity] duration-100 md:delay-300 md:motion-reduce:delay-0 motion-reduce:transition-none'
                    }
                >
                    {itemLabel}
                </span>
                <img
                    alt=""
                    aria-hidden="true"
                    className={
                        isCompact
                            ? 'hidden'
                            : isActive
                              ? isExpanded
                                  ? 'size-[18px] shrink-0 rotate-0 transition-transform duration-200 motion-reduce:transition-none'
                                  : 'size-[18px] shrink-0 rotate-180 transition-transform duration-200 motion-reduce:transition-none'
                              : isExpanded
                                ? 'size-[18px] shrink-0 rotate-0 transition-transform duration-200 motion-reduce:transition-none [filter:var(--app-filter-shell-icon)]'
                                : 'size-[18px] shrink-0 rotate-180 transition-transform duration-200 motion-reduce:transition-none [filter:var(--app-filter-shell-icon)]'
                    }
                    src={caretIconSource}
                />
            </button>
        )

        return (
            <div>
                {withCompactTooltip(navigationButton)}

                <div
                    id={childNavigationId}
                    aria-hidden={isCompact || !isExpanded}
                    className={
                        isCompact
                            ? 'invisible grid grid-rows-[0fr] opacity-0 transition-none'
                            : isExpanded
                              ? 'visible grid grid-rows-[1fr] opacity-100 transition-[grid-template-rows,opacity,visibility] duration-200 motion-reduce:transition-none'
                              : 'invisible grid grid-rows-[0fr] opacity-0 transition-[grid-template-rows,opacity,visibility] duration-200 motion-reduce:transition-none'
                    }
                >
                    <div className="overflow-hidden">
                        <div
                            ref={childNavigationRef}
                            className="relative isolate ml-[22px] border-l border-subtle py-1 pl-[23px]"
                        >
                            <TldMovingHighlight
                                activeKey={activeChild?.labelKey ?? null}
                                axis="vertical"
                                containerRef={childNavigationRef}
                                motion="rubber"
                                tone="brand"
                            />
                            {childItems.map((child) => {
                                const isChildActive = isPathActive(pathname, child.to, child.end)
                                const childLabel = child.label ?? t(child.labelKey)
                                if (child.to === undefined) {
                                    return (
                                        <span
                                            key={child.labelKey}
                                            aria-disabled="true"
                                            className="flex h-8 items-center text-label text-muted"
                                        >
                                            {childLabel}
                                        </span>
                                    )
                                }

                                return (
                                    <NavLink
                                        key={child.to}
                                        tabIndex={isExpanded && !isCompact ? undefined : -1}
                                        className={
                                            isChildActive
                                                ? 'relative flex h-8 cursor-pointer items-center text-label font-medium text-brand transition-colors duration-200 ease-out motion-reduce:transition-none'
                                                : 'relative flex h-8 cursor-pointer items-center text-label text-secondary transition-colors duration-200 ease-out hover:text-primary motion-reduce:transition-none'
                                        }
                                        end={child.end ?? false}
                                        to={child.to}
                                        onClick={onNavigate}
                                    >
                                        <span
                                            aria-hidden="true"
                                            data-highlight-key={child.labelKey}
                                            className="pointer-events-none absolute -left-6 top-2 h-4 w-px opacity-0"
                                        />
                                        <span className="relative z-20">{childLabel}</span>
                                    </NavLink>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (item.to === undefined) {
        return withCompactTooltip(
            <span
                aria-disabled="true"
                className={
                    isCompact
                        ? item.accent === 'vip'
                            ? 'flex h-10 w-full items-center justify-start rounded-lg px-2 text-warning'
                            : 'flex h-10 w-full items-center justify-start rounded-lg px-2 text-primary'
                        : item.accent === 'vip'
                          ? 'flex h-10 items-center gap-3 rounded-lg px-2.5 text-body font-medium text-warning'
                          : 'flex h-10 items-center gap-3 rounded-lg px-2.5 text-body font-medium text-primary'
                }
            >
                {icon}
                <span
                    className={
                        isCompact
                            ? 'invisible max-w-0 overflow-hidden opacity-0 transition-none'
                            : 'visible min-w-0 max-w-[9rem] flex-1 truncate opacity-100 transition-[max-width,opacity] duration-100 md:delay-300 md:motion-reduce:delay-0 motion-reduce:transition-none'
                    }
                >
                    {itemLabel}
                </span>
            </span>,
        )
    }

    return withCompactTooltip(
        <NavLink
            aria-label={itemLabel}
            className={
                isCompact
                    ? isActive
                        ? 'flex h-10 w-full cursor-pointer items-center justify-start rounded-lg bg-linear-to-r from-brand-start to-brand-end px-2 text-inverse'
                        : 'flex h-10 w-full cursor-pointer items-center justify-start rounded-lg px-2 text-primary transition-colors hover:bg-surface-hover hover:text-primary'
                    : isActive
                      ? 'flex h-10 cursor-pointer items-center gap-3 rounded-lg bg-linear-to-r from-brand-start to-brand-end px-2.5 text-body font-semibold text-inverse'
                      : 'flex h-10 cursor-pointer items-center gap-3 rounded-lg px-2.5 text-body font-medium text-primary transition-colors hover:bg-surface-hover hover:text-primary'
            }
            end={item.end ?? false}
            to={item.to}
            onClick={onNavigate}
        >
            {icon}
            <span
                className={
                    isCompact
                        ? 'invisible max-w-0 overflow-hidden opacity-0 transition-none'
                        : 'visible min-w-0 max-w-[9rem] flex-1 truncate opacity-100 transition-[max-width,opacity] duration-100 md:delay-300 md:motion-reduce:delay-0 motion-reduce:transition-none'
                }
            >
                {itemLabel}
            </span>
        </NavLink>,
    )
}

export function AppLayout({
    footerNavigationItem,
    navigationItems,
    utilityItems,
    searchPath,
}: AppLayoutProps): ReactElement {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { pathname } = useLocation()
    const navigationId = useId()
    const [searchQuery, setSearchQuery] = useState('')
    const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false)
    const activePageLabelSource = getActivePageLabelSource(navigationItems, pathname)
    const isFooterNavigationActive = isPathActive(pathname, footerNavigationItem.to, true)
    const activePageLabel = isFooterNavigationActive
        ? (footerNavigationItem.pageLabel ?? footerNavigationItem.label)
        : activePageLabelSource === undefined
          ? undefined
          : (activePageLabelSource.pageLabel ??
            activePageLabelSource.label ??
            t(activePageLabelSource.pageLabelKey ?? activePageLabelSource.labelKey))
    const [navigationState, setNavigationState] = useState(() =>
        getNavigationStateForViewport(getCurrentNavigationViewport()),
    )
    const { isNavigationOpen, viewport } = navigationState
    const isMobileViewport = viewport === 'mobile'
    const isCompactNavigation = hasCollapsedNavigationRail(navigationState)
    const isNavigationFullyHidden = !isNavigationOpen && !isCompactNavigation
    const closeButtonRef = useRef<HTMLButtonElement>(null)
    const triggerButtonRef = useRef<HTMLButtonElement>(null)
    const closeNavigation = useCallback((): void => {
        triggerButtonRef.current?.focus()
        setNavigationState((currentState) => ({ ...currentState, isNavigationOpen: false }))
    }, [])
    const closeOverlayNavigation = useCallback((): void => {
        if (isMobileViewport) closeNavigation()
    }, [closeNavigation, isMobileViewport])
    const openNavigation = useCallback((): void => {
        setNavigationState((currentState) => ({ ...currentState, isNavigationOpen: true }))
    }, [])
    const isOverlayNavigationOpen = isNavigationOpen && isMobileViewport

    useEffect(() => {
        const tabletMediaQuery = window.matchMedia(tabletNavigationMediaQuery)
        const desktopMediaQuery = window.matchMedia(desktopNavigationMediaQuery)

        const synchronizeNavigation = (): void => {
            const nextViewport: NavigationViewport = desktopMediaQuery.matches
                ? 'desktop'
                : tabletMediaQuery.matches
                  ? 'tablet'
                  : 'mobile'
            setNavigationState(getNavigationStateForViewport(nextViewport))
        }

        synchronizeNavigation()
        tabletMediaQuery.addEventListener('change', synchronizeNavigation)
        desktopMediaQuery.addEventListener('change', synchronizeNavigation)
        return (): void => {
            tabletMediaQuery.removeEventListener('change', synchronizeNavigation)
            desktopMediaQuery.removeEventListener('change', synchronizeNavigation)
        }
    }, [])

    useEffect(() => {
        if (!isOverlayNavigationOpen) return undefined

        const closeOnEscape = (event: KeyboardEvent): void => {
            if (event.key === 'Escape') closeNavigation()
        }

        const focusFrame = window.requestAnimationFrame((): void => closeButtonRef.current?.focus())
        window.addEventListener('keydown', closeOnEscape)
        return (): void => {
            window.cancelAnimationFrame(focusFrame)
            window.removeEventListener('keydown', closeOnEscape)
        }
    }, [closeNavigation, isOverlayNavigationOpen])

    function submitCourseSearch(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault()
        const query = searchQuery.trim()
        navigate({
            pathname: searchPath,
            search: query.length > 0 ? `?q=${encodeURIComponent(query)}` : '',
        })
        closeOverlayNavigation()
    }

    const shellClassName = isNavigationOpen
        ? 'min-h-dvh overflow-x-clip bg-canvas text-primary md:grid md:grid-cols-[200px_minmax(0,1fr)] md:transition-[grid-template-columns] md:duration-300 md:ease-out md:motion-reduce:transition-none'
        : 'min-h-dvh overflow-x-clip bg-canvas text-primary md:grid md:grid-cols-[64px_minmax(0,1fr)] md:transition-[grid-template-columns] md:delay-100 md:duration-300 md:ease-out md:motion-reduce:delay-0 md:motion-reduce:transition-none'
    const navigationClassName = isNavigationOpen
        ? 'pointer-events-auto fixed inset-y-0 left-0 z-50 flex h-dvh w-[50vw] translate-x-0 flex-col overflow-hidden border-r border-subtle bg-canvas shadow-drawer transition-[translate,width] duration-300 ease-out motion-reduce:transition-none md:sticky md:top-0 md:z-20 md:w-[200px] md:shadow-none'
        : 'pointer-events-none fixed inset-y-0 left-0 z-50 flex h-dvh w-[50vw] -translate-x-full flex-col overflow-hidden border-r border-subtle bg-canvas shadow-drawer transition-[translate,width] duration-300 ease-out motion-reduce:transition-none md:pointer-events-auto md:sticky md:top-0 md:z-20 md:w-16 md:translate-x-0 md:delay-100 md:shadow-none md:motion-reduce:delay-0'
    const branchCompanyControl = (
        <NavLink
            aria-label={footerNavigationItem.label}
            className={
                isFooterNavigationActive
                    ? 'grid h-10 w-full cursor-pointer place-items-center rounded-lg border border-brand bg-surface-hover transition-colors'
                    : 'grid h-10 w-full cursor-pointer place-items-center rounded-lg border border-subtle transition-colors hover:bg-surface-hover'
            }
            end
            to={footerNavigationItem.to}
            onClick={closeOverlayNavigation}
        >
            <img alt="" aria-hidden="true" className="size-5" src={diamondIconSource} />
        </NavLink>
    )
    const settingsControl = (
        <details className="group relative">
            <summary
                aria-label={t('layout.interfaceSettings')}
                className="grid h-10 cursor-pointer list-none place-items-center rounded-lg border border-subtle transition-colors hover:bg-surface-hover"
            >
                <img
                    alt=""
                    aria-hidden="true"
                    className="size-5 [filter:var(--app-filter-shell-icon)]"
                    src={settingsIconSource}
                />
            </summary>
            <div className="absolute bottom-12 left-0 z-10 flex w-44 flex-col gap-2 rounded-lg border border-subtle bg-surface p-2 shadow-panel">
                <ThemeSwitcher />
                <LanguageSwitcher />
            </div>
        </details>
    )

    return (
        <div className={shellClassName}>
            <button
                type="button"
                tabIndex={-1}
                aria-hidden={!isOverlayNavigationOpen}
                aria-label={t('layout.closeNavigation')}
                className={
                    isOverlayNavigationOpen
                        ? 'fixed inset-0 z-40 cursor-pointer bg-overlay opacity-100 transition-opacity duration-300 ease-out motion-reduce:transition-none md:hidden'
                        : 'pointer-events-none fixed inset-0 z-40 cursor-pointer bg-overlay opacity-0 transition-opacity duration-300 ease-out motion-reduce:transition-none md:hidden'
                }
                onClick={closeNavigation}
            />

            <aside
                id={navigationId}
                aria-hidden={isNavigationFullyHidden}
                aria-label={t('layout.mainNavigation')}
                className={navigationClassName}
                inert={isNavigationFullyHidden ? true : undefined}
            >
                <div className="relative h-[98px] shrink-0 px-[11px] pt-[22px]">
                    <div className="flex min-w-0 items-start">
                        <img
                            alt=""
                            aria-hidden="true"
                            className="size-[42px] max-w-none shrink-0 rounded-full object-cover"
                            src={avatarSource}
                        />
                        <div
                            className={
                                isCompactNavigation
                                    ? 'invisible absolute left-[63px] right-4 top-[23px] min-w-0 overflow-hidden opacity-0 transition-none'
                                    : 'visible absolute left-[63px] right-4 top-[23px] min-w-0 overflow-hidden opacity-100 transition-opacity duration-100 md:delay-300 md:motion-reduce:delay-0 motion-reduce:transition-none'
                            }
                        >
                            <p
                                title={t('layout.userName')}
                                className="truncate text-label font-normal text-primary"
                            >
                                {t('layout.userName')}
                            </p>
                            <div className="mt-0.5 flex flex-wrap items-center gap-x-1 gap-y-0.5">
                                <span className="shrink-0 whitespace-nowrap text-caption font-semibold text-danger">
                                    {t('layout.userLevel')}
                                </span>
                                <span className="shrink-0">
                                    <TldMembershipBadge
                                        label={t('layout.vipStatus')}
                                        size="compact"
                                        tone="gold"
                                    />
                                </span>
                            </div>
                        </div>
                    </div>

                    <div
                        aria-hidden={isCompactNavigation}
                        className="pointer-events-none absolute bottom-[9px] left-2.5 h-5"
                    >
                        <span
                            className={
                                isCompactNavigation
                                    ? 'invisible inline-flex h-5 items-center gap-1 rounded-full border border-strong px-1.5 text-[10px] text-primary opacity-0 transition-none'
                                    : 'visible inline-flex h-5 items-center gap-1 rounded-full border border-strong px-1.5 text-[10px] text-primary opacity-100 transition-opacity duration-100 md:delay-300 md:motion-reduce:delay-0 motion-reduce:transition-none'
                            }
                        >
                            <img
                                alt=""
                                aria-hidden="true"
                                className="size-3.5 [filter:var(--app-filter-shell-icon)]"
                                src={timerIconSource}
                            />
                            {t('layout.studyTime')}
                        </span>
                    </div>

                    <button
                        ref={closeButtonRef}
                        type="button"
                        aria-label={t('layout.closeNavigation')}
                        className="absolute right-3 top-4 grid size-9 cursor-pointer place-items-center rounded-lg border border-subtle text-xl text-secondary transition-colors hover:bg-surface-hover hover:text-primary md:hidden"
                        onClick={closeNavigation}
                    >
                        <span aria-hidden="true">×</span>
                    </button>
                </div>

                <TooltipGroup>
                    <nav className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-3 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        {navigationItems.map((item) => (
                            <NavigationEntry
                                key={item.labelKey}
                                isCompact={isCompactNavigation}
                                item={item}
                                pathname={pathname}
                                onExpandNavigation={openNavigation}
                                onNavigate={closeOverlayNavigation}
                            />
                        ))}
                    </nav>

                    <div className="shrink-0 space-y-2.5 border-t border-subtle bg-canvas px-3 py-2.5 [padding-bottom:max(0.625rem,env(safe-area-inset-bottom))]">
                        {isCompactNavigation ? (
                            <Tooltip
                                content={footerNavigationItem.label}
                                fullWidth
                                placement="right"
                            >
                                {branchCompanyControl}
                            </Tooltip>
                        ) : (
                            branchCompanyControl
                        )}
                        {isCompactNavigation ? (
                            <Tooltip
                                content={t('layout.interfaceSettings')}
                                fullWidth
                                placement="right"
                            >
                                {settingsControl}
                            </Tooltip>
                        ) : (
                            settingsControl
                        )}
                    </div>
                </TooltipGroup>
            </aside>

            <div className="h-dvh min-w-0 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:col-start-2">
                <header className="sticky top-0 z-30 flex h-16 items-center gap-2 bg-canvas px-3 md:gap-3 md:px-4 xl:h-20">
                    <div className="flex shrink-0 items-center gap-1">
                        <button
                            ref={triggerButtonRef}
                            type="button"
                            aria-controls={navigationId}
                            aria-expanded={isNavigationOpen}
                            aria-label={
                                isNavigationOpen
                                    ? t('layout.closeNavigation')
                                    : t('layout.openNavigation')
                            }
                            className="grid size-7 shrink-0 cursor-pointer place-items-center rounded-md transition-colors hover:bg-surface-hover"
                            onClick={(): void => setNavigationState(toggleNavigationState)}
                        >
                            <img
                                alt=""
                                aria-hidden="true"
                                className={
                                    isNavigationOpen
                                        ? 'size-5 rotate-0 transition-transform duration-300 ease-out motion-reduce:transition-none [filter:var(--app-filter-shell-icon)]'
                                        : 'size-5 rotate-180 transition-transform duration-300 ease-out motion-reduce:transition-none [filter:var(--app-filter-shell-icon)]'
                                }
                                src={sidebarToggleIconSource}
                            />
                        </button>
                        {activePageLabel === undefined ? null : (
                            <span className="hidden whitespace-nowrap text-body font-medium text-primary xl:block">
                                {activePageLabel}
                            </span>
                        )}
                    </div>

                    <form
                        className={
                            activePageLabel === undefined
                                ? 'w-7 shrink-0 md:w-1/2 md:min-w-20 md:max-w-[468px] xl:w-auto xl:flex-1'
                                : 'w-7 shrink-0 md:w-1/2 md:min-w-20 md:max-w-[468px] xl:ml-2 xl:w-auto xl:flex-1'
                        }
                        role="search"
                        onSubmit={submitCourseSearch}
                    >
                        <div className="hidden min-w-0 md:block">
                            <TldInput
                                label={t('layout.searchLabel')}
                                size="large"
                                id="global-course-search"
                                placeholder={t('layout.searchPlaceholder')}
                                type="search"
                                value={searchQuery}
                                onChange={(event): void => setSearchQuery(event.target.value)}
                                trailingAction={
                                    <button
                                        type="submit"
                                        aria-label={t('layout.searchAction')}
                                        className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-lg text-primary outline-offset-2 transition-colors hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-focus motion-reduce:transition-none"
                                    >
                                        <img
                                            alt=""
                                            aria-hidden="true"
                                            className="size-[18px] md:size-[22px]"
                                            src={searchIconSource}
                                        />
                                    </button>
                                }
                            />
                        </div>
                        <button
                            type="submit"
                            aria-label={t('layout.searchAction')}
                            className="grid size-7 shrink-0 cursor-pointer place-items-center rounded-lg border border-strong text-primary outline-offset-2 transition-colors hover:border-brand hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-focus motion-reduce:transition-none md:hidden"
                        >
                            <img
                                alt=""
                                aria-hidden="true"
                                className="size-[18px]"
                                src={searchIconSource}
                            />
                        </button>
                    </form>

                    <div className="ml-auto flex shrink-0 items-center gap-1 md:gap-2">
                        {utilityItems.map((item) => (
                            <button
                                key={item.labelKey}
                                type="button"
                                aria-label={t(item.labelKey)}
                                className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center gap-1 rounded-lg border border-strong text-primary transition-colors hover:bg-surface-hover md:h-8 md:w-8 min-[1800px]:min-w-max min-[1800px]:px-[11px]"
                                onClick={
                                    item.action === 'feedback'
                                        ? (): void => setIsFeedbackDialogOpen(true)
                                        : undefined
                                }
                            >
                                <img
                                    alt=""
                                    aria-hidden="true"
                                    className="size-[18px] [filter:var(--app-filter-shell-icon)] min-[1800px]:size-6"
                                    src={utilityIconSources[item.icon]}
                                />
                                <span className="hidden whitespace-nowrap text-body font-medium min-[1800px]:inline">
                                    {t(item.labelKey)}
                                </span>
                            </button>
                        ))}
                        <img
                            alt=""
                            aria-hidden="true"
                            className="size-7 shrink-0 object-cover md:size-8 xl:size-10 min-[1800px]:size-[52px]!"
                            src={projectConstants.assets.mascotSource}
                        />
                    </div>
                </header>

                <main className="min-h-[calc(100dvh-4rem)] min-w-0 xl:min-h-[calc(100dvh-5rem)]">
                    <Outlet />
                </main>

                <SubmitFeedbackDialog
                    open={isFeedbackDialogOpen}
                    onOpenChange={setIsFeedbackDialogOpen}
                />
            </div>
        </div>
    )
}
