'use client'

import { useRef } from 'react'
import type { ReactElement } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { TldSegmentedTabs } from '../../../shared/ui/tld-segmented-tabs'
import { TldButton } from '../../../shared/ui/tld-button'
import { TldSelection } from '../../../shared/ui/tld-selection'
import { useAppTheme, useThemeTransition } from '../../../shared/theme'
import {
    isSettingsTab,
    preferenceGroups,
    resetPreferenceColors,
    settingsTabs,
} from '../model/preferences'
import { useLearningPreferences } from '../model/useLearningPreferences'
import { AppearancePreview } from './AppearancePreview'
import { SettingControl, SettingsSection } from './SettingControls'
import { ShortcutSettings } from './ShortcutSettings'
import { SystemSettings } from './SystemSettings'

export function SettingsPage(): ReactElement {
    const searchParams = useSearchParams()
    const router = useRouter()
    const pathname = usePathname()
    const tabParameter = searchParams.get('tab')
    const activeTab = isSettingsTab(tabParameter) ? tabParameter : 'pronunciation'
    const activeLabel = settingsTabs.find((tab) => tab.id === activeTab)?.label ?? '发音'
    const { values, ready, saveError, update, replace } = useLearningPreferences()
    const { theme } = useAppTheme()
    const themeOrigin = useRef<HTMLDivElement>(null)
    const transitionTheme = useThemeTransition({ originRef: themeOrigin })

    function changeTab(value: string): void {
        if (!isSettingsTab(value)) return
        const query = new URLSearchParams(searchParams.toString())
        query.set('tab', value)
        router.replace(`${pathname}?${query}`, { scroll: false })
    }

    return (
        <section className="mx-auto min-w-0 px-3 pb-10 md:px-4 xl:min-[1920px]:px-[250px]">
            <div className="sticky top-16 z-20 bg-canvas pb-4 pt-3 xl:top-20">
                <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <TldSegmentedTabs
                        ariaLabel="设置分类"
                        value={activeTab}
                        items={settingsTabs}
                        onValueChange={changeTab}
                        variant="underline"
                        activeTextTone="brand"
                        indicatorTone="brand"
                        indicatorWidth="item"
                        baselineTone="subtle"
                        gap="wide"
                    />
                </div>
            </div>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
                <p className="text-caption text-muted">
                    更改自动保存到本机，主题和外观预览即时生效。
                </p>
                <p
                    role="status"
                    className={saveError ? 'text-caption text-danger' : 'text-caption text-muted'}
                >
                    {!ready
                        ? '正在恢复设置…'
                        : saveError
                          ? '本机存储不可用，刷新后无法恢复修改'
                          : '本机设置已就绪'}
                </p>
            </div>
            <div
                id={`settings-${activeTab}`}
                role="tabpanel"
                aria-label={activeLabel}
                className="min-w-0 focus-visible:outline-2 focus-visible:outline-focus"
                tabIndex={0}
            >
                {activeTab === 'system' ? (
                    <SystemSettings />
                ) : (
                    <fieldset
                        disabled={!ready}
                        className="min-w-0 [&_:disabled]:cursor-not-allowed"
                    >
                        {activeTab === 'shortcuts' ? (
                            <ShortcutSettings values={values} update={update} />
                        ) : (
                            <div
                                className={
                                    activeTab === 'appearance'
                                        ? 'grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]'
                                        : 'grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,780px)_minmax(0,1fr)]'
                                }
                            >
                                <div className="min-w-0 space-y-5">
                                    {activeTab === 'appearance' ? (
                                        <SettingsSection title="主题切换">
                                            <div
                                                ref={themeOrigin}
                                                role="radiogroup"
                                                aria-label="主题切换"
                                                className="grid grid-cols-2 gap-6"
                                            >
                                                <TldSelection
                                                    type="radio"
                                                    layout="inline"
                                                    name="settings-theme"
                                                    value="light"
                                                    label="白天模式"
                                                    checked={theme === 'light'}
                                                    onCheckedChange={(checked): void => {
                                                        if (checked) transitionTheme('light')
                                                    }}
                                                >
                                                    白天模式
                                                </TldSelection>
                                                <TldSelection
                                                    type="radio"
                                                    layout="inline"
                                                    name="settings-theme"
                                                    value="dark"
                                                    label="夜间模式"
                                                    checked={theme === 'dark'}
                                                    onCheckedChange={(checked): void => {
                                                        if (checked) transitionTheme('dark')
                                                    }}
                                                >
                                                    夜间模式
                                                </TldSelection>
                                            </div>
                                        </SettingsSection>
                                    ) : null}
                                    {preferenceGroups[activeTab].map((group) => (
                                        <SettingsSection key={group.title} title={group.title}>
                                            {group.title === '答题页面颜色' ? (
                                                <p className="text-caption leading-relaxed text-muted">
                                                    为避免看不清内容，请不要使用接近黑色或者白色的颜色！自定义颜色只用于练习外观。
                                                </p>
                                            ) : null}
                                            {group.fields.map((field) => (
                                                <SettingControl
                                                    key={field.key}
                                                    field={field}
                                                    values={values}
                                                    update={update}
                                                />
                                            ))}
                                            {group.title === '答题页面颜色' ? (
                                                <TldButton
                                                    variant="secondary"
                                                    onClick={(): void =>
                                                        replace(resetPreferenceColors(values))
                                                    }
                                                >
                                                    重置为默认方案
                                                </TldButton>
                                            ) : null}
                                        </SettingsSection>
                                    ))}
                                    {activeTab === 'pronunciation' || activeTab === 'sound' ? (
                                        <div className="rounded-xl border border-subtle p-4">
                                            <button
                                                type="button"
                                                disabled
                                                className="cursor-not-allowed rounded-lg border border-subtle px-4 py-2 text-label text-muted"
                                            >
                                                试听暂未接入
                                            </button>
                                            <p className="mt-2 text-caption leading-relaxed text-muted">
                                                参数可保存；发音与音效播放随课程音源接入。
                                            </p>
                                        </div>
                                    ) : null}
                                </div>
                                {activeTab === 'appearance' ? (
                                    <aside
                                        className="min-w-0 xl:sticky xl:top-[160px]"
                                        aria-label="练习外观示例"
                                    >
                                        <AppearancePreview values={values} />
                                    </aside>
                                ) : null}
                            </div>
                        )}
                    </fieldset>
                )}
            </div>
        </section>
    )
}
