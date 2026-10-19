'use client'

import { useId } from 'react'
import type { ReactElement } from 'react'
import { TldSegmentedTabs } from '../../../shared/ui/tld-segmented-tabs'
import {
    isSettingsTab,
    preferenceGroups,
    type SettingsTab,
    settingsTabs,
} from '../model/preferences'
import { useLearningSettings } from '../model/useLearningSettings'
import { AnswerSettings } from './AnswerSettings'
import { AppearanceThemeSettings } from './AppearanceThemeSettings'
import { AppearancePreview } from './AppearancePreview'
import { SettingControl, SettingsSection } from './SettingControls'
import { ShortcutSettings } from './ShortcutSettings'
import { SystemSettings } from './SystemSettings'
import { EffectsSettings, SpecializedSettings } from './PracticeSettingsPanels'

export interface LearningSettingsEditorProps {
    readonly activeTab: SettingsTab
    readonly onTabChange: (tab: SettingsTab) => void
    readonly presentation: 'page' | 'dialog'
}

export function LearningSettingsEditor({
    activeTab,
    onTabChange,
    presentation,
}: LearningSettingsEditorProps): ReactElement {
    const panelPrefix = useId()
    const tabItems = settingsTabs.map((tab) => ({
        ...tab,
        panelId: presentation === 'page' ? tab.panelId : `${panelPrefix}-${tab.id}`,
    }))
    const activeLabel = settingsTabs.find((tab) => tab.id === activeTab)?.label ?? '发音'
    const { values, ready, saveError, update, patch, background } = useLearningSettings()

    function changeTab(value: string): void {
        if (isSettingsTab(value)) onTabChange(value)
    }

    return (
        <section
            className={
                presentation === 'page'
                    ? 'mx-auto min-w-0 px-3 pb-10 md:px-4 xl:min-[1920px]:px-[250px]'
                    : 'min-w-0 pb-4'
            }
        >
            <div
                className={
                    presentation === 'page'
                        ? 'sticky top-16 z-20 bg-canvas pb-4 pt-3 xl:top-20'
                        : 'sticky top-0 z-20 bg-canvas pb-4 pt-3'
                }
            >
                <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <TldSegmentedTabs
                        ariaLabel="设置分类"
                        value={activeTab}
                        items={tabItems}
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
                id={
                    presentation === 'page'
                        ? `settings-${activeTab}`
                        : `${panelPrefix}-${activeTab}`
                }
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
                        ) : activeTab === 'answer' ? (
                            <AnswerSettings values={values} update={update} />
                        ) : activeTab === 'specialized' ? (
                            <SpecializedSettings values={values} update={update} />
                        ) : activeTab === 'effects' ? (
                            <EffectsSettings values={values} update={update} />
                        ) : (
                            <div
                                className={
                                    activeTab === 'appearance'
                                        ? 'grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]'
                                        : 'grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,780px)_minmax(0,1fr)]'
                                }
                            >
                                <div className="min-w-0 space-y-5">
                                    {preferenceGroups[activeTab].map((group) =>
                                        group.title === '主题相关' ? (
                                            <AppearanceThemeSettings
                                                key={group.title}
                                                group={group}
                                                values={values}
                                                update={update}
                                                patch={patch}
                                                background={background}
                                            />
                                        ) : (
                                            <SettingsSection key={group.title} title={group.title}>
                                                {group.title === '答题页面颜色' ? (
                                                    <p className="text-caption leading-relaxed text-muted">
                                                        答题颜色和练习文字颜色独立设置；自定义颜色只用于练习预览。
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
                                            </SettingsSection>
                                        ),
                                    )}
                                </div>
                                {activeTab === 'appearance' ? (
                                    <aside
                                        className={
                                            presentation === 'page'
                                                ? 'min-w-0 xl:sticky xl:top-[160px]'
                                                : 'min-w-0'
                                        }
                                        aria-label="练习外观示例"
                                    >
                                        <AppearancePreview
                                            values={values}
                                            image={background.image}
                                        />
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
