import type { ReactElement } from 'react'
import { TldDropdownMenu } from '../../../shared/ui/tld-dropdown-menu'
import type { TldDropdownMenuItem } from '../../../shared/ui/tld-dropdown-menu'
import type { PracticeFamily } from '../model/practice-demo'
import { getPracticeNavigationActions } from '../model/practice-navigation'
import type { PracticeNavigationAction } from '../model/practice-navigation'
import answerAsset from '../assets/answer.svg'
import contentAsset from '../assets/content.svg'
import modeAsset from '../assets/mode.svg'
import pauseAsset from '../assets/pause.svg'
import resetAsset from '../assets/reset.svg'
import reportAsset from '../assets/report.svg'
import draftAsset from '../assets/draft.svg'
import settingsAsset from '../assets/settings.svg'
import fullscreenAsset from '../assets/fullscreen.svg'

interface NavigationItem {
    readonly label: string
    readonly icon: string
}

const navigationItems: Readonly<Record<PracticeNavigationAction, NavigationItem>> = {
    answer: { label: '答案', icon: answerAsset.src },
    content: { label: '内容', icon: contentAsset.src },
    mode: { label: '模式', icon: modeAsset.src },
    pause: { label: '暂停', icon: pauseAsset.src },
    reset: { label: '重置', icon: resetAsset.src },
    report: { label: '报错', icon: reportAsset.src },
    draft: { label: '草稿', icon: draftAsset.src },
    settings: { label: '设置', icon: settingsAsset.src },
    fullscreen: { label: '切换全屏', icon: fullscreenAsset.src },
}

interface PracticeNavigationProps {
    readonly draftOpen?: boolean
    readonly contentOpen?: boolean
    readonly family: PracticeFamily
    readonly onAction: (action: PracticeNavigationAction) => void
}

export function PracticeNavigation({
    family,
    onAction,
    draftOpen = false,
    contentOpen,
}: PracticeNavigationProps): ReactElement {
    const actions = getPracticeNavigationActions(family)
    const items: readonly TldDropdownMenuItem<PracticeNavigationAction>[] = actions.map(
        (action) => ({
            id: action,
            label: navigationItems[action].label,
            icon: (
                <img
                    alt=""
                    src={navigationItems[action].icon}
                    className="size-[18px] shrink-0 [filter:var(--app-filter-shell-icon)]"
                />
            ),
            ...(action === 'draft' ? { expanded: draftOpen } : {}),
            ...(action === 'content' && contentOpen !== undefined ? { expanded: contentOpen } : {}),
            ...(action === 'draft' && draftOpen ? { controls: 'practice-chapter-draft' } : {}),
        }),
    )
    return (
        <nav aria-label="练习工具" data-practice-navigation={family} className="shrink-0">
            <div className="inline-flex xl:hidden" data-practice-navigation-compact>
                <TldDropdownMenu
                    label="更多练习操作"
                    items={items}
                    onAction={onAction}
                    trigger={
                        <svg
                            aria-hidden="true"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                        >
                            <circle cx="5" cy="12" r="2" />
                            <circle cx="12" cy="12" r="2" />
                            <circle cx="19" cy="12" r="2" />
                        </svg>
                    }
                />
            </div>
            <div
                className="hidden max-w-full flex-wrap items-center gap-2 xl:flex design:gap-4"
                data-practice-navigation-wide
            >
                {actions.map((action) => {
                    const item = navigationItems[action]
                    const fullscreen = action === 'fullscreen'
                    return (
                        <button
                            key={action}
                            type="button"
                            aria-label={item.label}
                            aria-expanded={
                                action === 'draft'
                                    ? draftOpen
                                    : action === 'content'
                                      ? contentOpen
                                      : undefined
                            }
                            aria-controls={
                                action === 'draft' && draftOpen
                                    ? 'practice-chapter-draft'
                                    : undefined
                            }
                            data-practice-navigation-action={action}
                            onClick={(): void => onAction(action)}
                            className={
                                fullscreen
                                    ? 'ml-0.5 shrink-0 cursor-pointer rounded focus-visible:outline-2 focus-visible:outline-focus'
                                    : 'inline-flex min-h-8 cursor-pointer items-center justify-center gap-[5px] rounded-lg border border-primary/50 px-3 text-[14px] font-normal leading-5 text-practice-text outline-offset-2 hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-focus design:h-7 design:min-h-7 design:w-[74px] design:px-0'
                            }
                        >
                            <img
                                alt=""
                                src={item.icon}
                                className="shrink-0 [filter:var(--app-filter-shell-icon)]"
                            />
                            {!fullscreen && item.label}
                        </button>
                    )
                })}
            </div>
        </nav>
    )
}
