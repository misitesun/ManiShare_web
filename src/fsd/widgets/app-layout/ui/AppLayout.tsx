'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import type { FormEvent, ReactElement, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import type { NavigationViewport } from '../model/navigation-state'
import { isHeaderQrAction } from '../model/header-qr'
import type { HeaderQrAction } from '../model/header-qr'
import { HeaderQrEntry } from './HeaderQrEntry'
import { isPathActive } from '../model/navigation-path'
import { SubmitFeedbackDialog } from '../../../features/submit-feedback'
import { projectConstants } from '../../../shared/constants'
import { TldMembershipBadge } from '../../../shared/ui/tld-membership-badge'
import { TldInput } from '../../../shared/ui/tld-input'
import { TldGradientText } from '../../../shared/ui/tld-gradient-text'
import { TldMovingHighlight } from '../../../shared/ui/tld-moving-highlight'
import { Tooltip, TooltipGroup } from '../../../shared/ui/tooltip'
import {
    getNavigationStateForViewport,
    hasCollapsedNavigationRail,
    toggleNavigationState,
} from '../model/navigation-state'
import avatarSourceAsset from '../assets/avatar.png'
import clubIconSourceAsset from '../assets/header/club.svg'
import desktopIconSourceAsset from '../assets/header/desktop.svg'
import feedbackIconSourceAsset from '../assets/header/feedback.svg'
import notificationIconSourceAsset from '../assets/header/notification.svg'
import playIconSourceAsset from '../assets/header/play.svg'
import searchIconSourceAsset from '../assets/header/search.svg'
import serviceIconSourceAsset from '../assets/header/service.svg'
import sidebarToggleIconSourceAsset from '../assets/header/sidebar-toggle.svg'
import aiCreateIconSourceAsset from '../assets/navigation/ai-create.svg'
import aiTutorIconSourceAsset from '../assets/navigation/ai-tutor.svg'
import awakeningIconSourceAsset from '../assets/navigation/awakening.svg'
import bootcampIconSourceAsset from '../assets/navigation/bootcamp.svg'
import caretIconSourceAsset from '../assets/navigation/caret.svg'
import coCreateIconSourceAsset from '../assets/navigation/co-create.svg'
import competitionIconSourceAsset from '../assets/navigation/competition.svg'
import settingsIconSourceAsset from '../assets/navigation/diamond.svg'
import guideIconSourceAsset from '../assets/navigation/guide.svg'
import homeIconSourceAsset from '../assets/navigation/home.svg'
import leaderboardIconSourceAsset from '../assets/navigation/leaderboard.svg'
import pkIconSourceAsset from '../assets/navigation/pk.svg'
import prizeCenterIconSourceAsset from '../assets/navigation/prize-center.svg'
import profileIconSourceAsset from '../assets/navigation/profile.svg'
import revenueIconSourceAsset from '../assets/navigation/revenue.svg'
import diamondIconSourceAsset from '../assets/navigation/settings.svg'
import storiesIconSourceAsset from '../assets/navigation/stories.svg'
import timerIconSourceAsset from '../assets/navigation/timer.svg'
import vipIconSourceAsset from '../assets/navigation/vip.svg'
import vocabularyIconSourceAsset from '../assets/navigation/vocabulary.svg'
import wisdomIconSourceAsset from '../assets/navigation/wisdom.svg'

const avatarSource: string = avatarSourceAsset.src
const clubIconSource: string = clubIconSourceAsset.src
const desktopIconSource: string = desktopIconSourceAsset.src
const feedbackIconSource: string = feedbackIconSourceAsset.src
const notificationIconSource: string = notificationIconSourceAsset.src
const playIconSource: string = playIconSourceAsset.src
const searchIconSource: string = searchIconSourceAsset.src
const serviceIconSource: string = serviceIconSourceAsset.src
const sidebarToggleIconSource: string = sidebarToggleIconSourceAsset.src
const aiCreateIconSource: string = aiCreateIconSourceAsset.src
const aiTutorIconSource: string = aiTutorIconSourceAsset.src
const awakeningIconSource: string = awakeningIconSourceAsset.src
const bootcampIconSource: string = bootcampIconSourceAsset.src
const caretIconSource: string = caretIconSourceAsset.src
const coCreateIconSource: string = coCreateIconSourceAsset.src
const competitionIconSource: string = competitionIconSourceAsset.src
const settingsIconSource: string = settingsIconSourceAsset.src
const guideIconSource: string = guideIconSourceAsset.src
const homeIconSource: string = homeIconSourceAsset.src
const leaderboardIconSource: string = leaderboardIconSourceAsset.src
const pkIconSource: string = pkIconSourceAsset.src
const prizeCenterIconSource: string = prizeCenterIconSourceAsset.src
const profileIconSource: string = profileIconSourceAsset.src
const revenueIconSource: string = revenueIconSourceAsset.src
const diamondIconSource: string = diamondIconSourceAsset.src
const storiesIconSource: string = storiesIconSourceAsset.src
const timerIconSource: string = timerIconSourceAsset.src
const vipIconSource: string = vipIconSourceAsset.src
const vocabularyIconSource: string = vocabularyIconSourceAsset.src
const wisdomIconSource: string = wisdomIconSourceAsset.src

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

export type AppNavigationAccent = 'default' | 'vip' | 'brand'

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
export type AppUtilityAction = 'feedback' | HeaderQrAction

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
    readonly children: ReactNode
    readonly footerNavigationItem: AppFooterNavigationItem
    readonly navigationItems: readonly AppNavigationItem[]
    readonly utilityItems: readonly AppUtilityItem[]
    readonly searchPath: string
    readonly settingsPath: string
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
                                    <Link
                                        scroll={false}
                                        key={child.to}
                                        tabIndex={isExpanded && !isCompact ? undefined : -1}
                                        className={
                                            isChildActive
                                                ? 'relative flex h-8 cursor-pointer items-center text-label font-medium text-brand transition-colors duration-200 ease-out motion-reduce:transition-none'
                                                : 'relative flex h-8 cursor-pointer items-center text-label text-secondary transition-colors duration-200 ease-out hover:text-primary motion-reduce:transition-none'
                                        }
                                        aria-current={isChildActive ? 'page' : undefined}
                                        href={child.to}
                                        onClick={onNavigate}
                                    >
                                        <span
                                            aria-hidden="true"
                                            data-highlight-key={child.labelKey}
                                            className="pointer-events-none absolute -left-6 top-2 h-4 w-px opacity-0"
                                        />
                                        <span className="relative z-20">{childLabel}</span>
                                    </Link>
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
        <Link
            scroll={false}
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
            aria-current={isActive ? 'page' : undefined}
            href={item.to}
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
                {item.accent === 'brand' && !isActive ? (
                    <TldGradientText>{itemLabel}</TldGradientText>
                ) : (
                    itemLabel
                )}
            </span>
        </Link>,
    )
}

export function AppLayout({
    footerNavigationItem,
    navigationItems,
    utilityItems,
    searchPath,
    settingsPath,
    children,
}: AppLayoutProps): ReactElement {
    const { t } = useTranslation()
    const router = useRouter()
    const pathname = usePathname()
    const navigationId = useId()
    const [searchQuery, setSearchQuery] = useState('')
    const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false)
    const [openHeaderQr, setOpenHeaderQr] = useState<HeaderQrAction | null>(null)
    const activePageLabelSource = getActivePageLabelSource(navigationItems, pathname)
    const isFooterNavigationActive = isPathActive(pathname, footerNavigationItem.to, true)
    const activePageLabel = isPathActive(pathname, settingsPath, true)
        ? '设置'
        : isFooterNavigationActive
          ? (footerNavigationItem.pageLabel ?? footerNavigationItem.label)
          : activePageLabelSource === undefined
            ? undefined
            : (activePageLabelSource.pageLabel ??
              activePageLabelSource.label ??
              t(activePageLabelSource.pageLabelKey ?? activePageLabelSource.labelKey))
    const [navigationState, setNavigationState] = useState(() =>
        getNavigationStateForViewport('mobile'),
    )
    const [isViewportReady, setViewportReady] = useState(false)
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
            setViewportReady(true)
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
        router.push(
            query.length > 0 ? `${searchPath}?q=${encodeURIComponent(query)}` : searchPath,
            { scroll: false },
        )
        closeOverlayNavigation()
    }

    const shellClassName = !isViewportReady
        ? 'min-h-dvh overflow-x-clip bg-canvas text-primary md:grid md:grid-cols-[64px_minmax(0,1fr)] xl:grid-cols-[200px_minmax(0,1fr)]'
        : isNavigationOpen
          ? 'min-h-dvh overflow-x-clip bg-canvas text-primary md:grid md:grid-cols-[200px_minmax(0,1fr)] md:transition-[grid-template-columns] md:duration-300 md:ease-out md:motion-reduce:transition-none'
          : 'min-h-dvh overflow-x-clip bg-canvas text-primary md:grid md:grid-cols-[64px_minmax(0,1fr)] md:transition-[grid-template-columns] md:delay-100 md:duration-300 md:ease-out md:motion-reduce:delay-0 md:motion-reduce:transition-none'
    const navigationClassName = !isViewportReady
        ? 'pointer-events-none fixed inset-y-0 left-0 z-50 flex h-dvh w-[50vw] -translate-x-full flex-col overflow-hidden border-r border-subtle bg-canvas shadow-drawer md:pointer-events-auto md:sticky md:top-0 md:z-20 md:w-16 md:translate-x-0 md:shadow-none xl:w-[200px]'
        : isNavigationOpen
          ? 'pointer-events-auto fixed inset-y-0 left-0 z-50 flex h-dvh w-[50vw] translate-x-0 flex-col overflow-hidden border-r border-subtle bg-canvas shadow-drawer transition-[translate,width] duration-300 ease-out motion-reduce:transition-none md:sticky md:top-0 md:z-20 md:w-[200px] md:shadow-none'
          : 'pointer-events-none fixed inset-y-0 left-0 z-50 flex h-dvh w-[50vw] -translate-x-full flex-col overflow-hidden border-r border-subtle bg-canvas shadow-drawer transition-[translate,width] duration-300 ease-out motion-reduce:transition-none md:pointer-events-auto md:sticky md:top-0 md:z-20 md:w-16 md:translate-x-0 md:delay-100 md:shadow-none md:motion-reduce:delay-0'
    const branchCompanyControl = (
        <Link
            scroll={false}
            aria-label={footerNavigationItem.label}
            className={
                isFooterNavigationActive
                    ? 'grid h-10 w-full cursor-pointer place-items-center rounded-lg border border-brand bg-surface-hover transition-colors'
                    : 'grid h-10 w-full cursor-pointer place-items-center rounded-lg border border-subtle transition-colors hover:bg-surface-hover'
            }
            aria-current={isFooterNavigationActive ? 'page' : undefined}
            href={footerNavigationItem.to}
            onClick={closeOverlayNavigation}
        >
            <img alt="" aria-hidden="true" className="size-5" src={diamondIconSource} />
        </Link>
    )
    const settingsControl = (
        <Link
            href={settingsPath}
            scroll={false}
            onClick={closeOverlayNavigation}
            aria-label="设置"
            aria-current={isPathActive(pathname, settingsPath, true) ? 'page' : undefined}
            className="grid h-10 cursor-pointer place-items-center rounded-lg border border-subtle transition-colors hover:bg-surface-hover aria-[current=page]:border-brand aria-[current=page]:bg-surface-hover"
        >
            <img
                alt=""
                aria-hidden="true"
                className="size-5 [filter:var(--app-filter-shell-icon)]"
                src={settingsIconSource}
            />
        </Link>
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

                    <div className="ml-auto flex shrink-0 items-center gap-1 md:gap-2 xl:min-[1800px]:gap-5">
                        {utilityItems.map((item) => {
                            const action = item.action
                            return isHeaderQrAction(action) ? (
                                <HeaderQrEntry
                                    key={item.labelKey}
                                    action={action}
                                    open={openHeaderQr === action}
                                    onOpenChange={(open): void => {
                                        setOpenHeaderQr((current) =>
                                            open ? action : current === action ? null : current,
                                        )
                                    }}
                                />
                            ) : (
                                <button
                                    key={item.labelKey}
                                    type="button"
                                    aria-label={t(item.labelKey)}
                                    className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center gap-[5px] rounded-lg border border-strong text-primary transition-colors hover:bg-surface-hover md:h-8 md:w-8 xl:min-[1800px]:w-[115px]"
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
                                    <span className="hidden whitespace-nowrap text-body-tight font-medium min-[1800px]:inline">
                                        {t(item.labelKey)}
                                    </span>
                                </button>
                            )
                        })}
                        <img
                            alt=""
                            aria-hidden="true"
                            className="size-7 shrink-0 object-cover md:size-8 xl:size-10 xl:min-[1800px]:-ml-2 min-[1800px]:size-[52px]!"
                            src={projectConstants.assets.mascotSource}
                        />
                    </div>
                </header>

                <main className="min-h-[calc(100dvh-4rem)] min-w-0 xl:min-h-[calc(100dvh-5rem)]">
                    {children}
                </main>

                <SubmitFeedbackDialog
                    open={isFeedbackDialogOpen}
                    onOpenChange={setIsFeedbackDialogOpen}
                />
            </div>
        </div>
    )
}
