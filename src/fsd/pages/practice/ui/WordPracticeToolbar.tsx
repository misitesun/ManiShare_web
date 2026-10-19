'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactElement } from 'react'
import { TldSelect } from '../../../shared/ui/tld-select'
import { TldSwitch } from '../../../shared/ui/tld-switch'
import { TldMovingHighlight } from '../../../shared/ui/tld-moving-highlight'
import {
    PracticeToolbarOptions,
    PracticeToolbarSegment,
    PracticeToolbarTimer,
} from './PracticeToolbarControls'
import { wordToolbarRows } from '../model/word-toolbar-options'
import type {
    WordToolbarMode,
    WordToolbarOptions,
    WordToolbarRow,
} from '../model/word-toolbar-options'

interface WordPracticeToolbarProps {
    readonly mode: WordToolbarMode
    readonly values: WordToolbarOptions
    readonly onChange: (values: WordToolbarOptions) => void
    readonly onNotice: (message: string) => void
}

type ToolbarMenu = 'options' | 'order' | 'language' | 'phonetics' | null

const orderOptions = [
    { value: 'sequential', label: '正序' },
    { value: 'random', label: '乱序' },
    { value: 'alphabetical', label: 'A-Z' },
] as const
const languageOptions = [
    { value: 'translate', label: '中译英' },
    { value: 'interpret', label: '英译中' },
    { value: 'bilingual', label: '中英显示' },
] as const
const phoneticOptions = [
    { value: 'original', label: '原始音标' },
    { value: 'syllables', label: '音节拆分' },
    { value: 'phonics', label: '自然拼读' },
    { value: 'none', label: '无音标' },
] as const

function getRowLabel(row: Exclude<WordToolbarRow, 'copy'>, mode: WordToolbarMode): string {
    if (row === 'cutReading') return '切读'
    if (row === 'translationVisible') return mode === 'oral' ? '中文' : '翻译'
    if (row === 'imageVisible') return '图片'
    return '音标'
}

export function WordPracticeToolbar({
    mode,
    values,
    onChange,
    onNotice,
}: WordPracticeToolbarProps): ReactElement {
    const [menu, setMenu] = useState<ToolbarMenu>(null)
    const phoneticsRef = useRef<HTMLDivElement>(null)
    const optionsOpen = menu === 'options'
    const setOptionsOpen = useCallback((open: boolean): void => {
        setMenu((current) => (open ? 'options' : current === 'options' ? null : current))
    }, [])
    useEffect(() => {
        const media = window.matchMedia('(min-width: 768px)')
        function closeHiddenMenu(): void {
            if (!media.matches || menu !== 'phonetics') return
            setMenu(null)
            phoneticsRef.current?.querySelector<HTMLButtonElement>('[aria-pressed="true"]')?.focus()
        }
        media.addEventListener('change', closeHiddenMenu)
        return (): void => media.removeEventListener('change', closeHiddenMenu)
    }, [menu])
    const phonetics =
        mode === 'spell'
            ? [phoneticOptions[1], phoneticOptions[0], phoneticOptions[2], phoneticOptions[3]]
            : phoneticOptions

    return (
        <div
            data-practice-toolbar="word"
            data-word-toolbar
            role="group"
            aria-label="单词练习局部设置"
            className={
                mode === 'pronounce'
                    ? 'relative z-30 min-w-0 px-3 pt-5 text-practice-control-text design:absolute design:left-3 design:right-3 design:top-[21px] design:p-0'
                    : 'relative z-30 min-w-0 px-4 pt-5 text-practice-control-text design:absolute design:left-4 design:right-4 design:top-5 design:p-0'
            }
        >
            <div
                data-word-toolbar-scroll
                className="-my-1 flex min-w-0 flex-nowrap items-center gap-0.5 overflow-x-auto overscroll-x-contain py-1 md:gap-3"
            >
                <PracticeToolbarTimer family="word" />
                <PracticeToolbarOptions
                    family="word"
                    open={optionsOpen}
                    onOpenChange={setOptionsOpen}
                    portal
                >
                    {wordToolbarRows[mode].map((row) =>
                        row === 'copy' ? (
                            <PracticeToolbarSegment
                                key={row}
                                label="输入方式"
                                firstLabel="默写"
                                secondLabel="抄写"
                                value={values.copy}
                                onChange={(copy): void => {
                                    onChange({ ...values, copy })
                                    onNotice('输入方式已选择，抄写题面待后续精修。')
                                }}
                            />
                        ) : (
                            <div
                                key={row}
                                className="flex min-h-10 items-center justify-center px-[5px] xl:min-h-6"
                            >
                                <TldSwitch
                                    size="practice"
                                    label={getRowLabel(row, mode)}
                                    checked={values[row]}
                                    onCheckedChange={(checked): void => {
                                        onChange({ ...values, [row]: checked })
                                        if (row === 'cutReading')
                                            onNotice(checked ? '已开启切读。' : '已关闭切读。')
                                    }}
                                />
                            </div>
                        ),
                    )}
                </PracticeToolbarOptions>
                {mode === 'pronounce' && (
                    <>
                        <div className="shrink-0">
                            <TldSelect
                                size="practice"
                                layout="content"
                                menuPosition="portal"
                                label="单词排序"
                                value={values.order}
                                options={orderOptions}
                                open={menu === 'order'}
                                onOpenChange={(open): void =>
                                    setMenu((current) =>
                                        open ? 'order' : current === 'order' ? null : current,
                                    )
                                }
                                onValueChange={(value): void => {
                                    if (
                                        value !== 'sequential' &&
                                        value !== 'random' &&
                                        value !== 'alphabetical'
                                    )
                                        return
                                    onChange({ ...values, order: value })
                                    onNotice('排序为演示选择，当前本地题目顺序保持。')
                                }}
                            />
                        </div>
                        <div className="shrink-0">
                            <TldSelect
                                size="practice"
                                layout="content"
                                menuPosition="portal"
                                label="中英显示"
                                value={values.language}
                                options={languageOptions}
                                open={menu === 'language'}
                                onOpenChange={(open): void =>
                                    setMenu((current) =>
                                        open ? 'language' : current === 'language' ? null : current,
                                    )
                                }
                                onValueChange={(value): void => {
                                    if (
                                        value !== 'translate' &&
                                        value !== 'interpret' &&
                                        value !== 'bilingual'
                                    )
                                        return
                                    onChange({ ...values, language: value })
                                    onNotice('中英显示方式已选择，题面变体待后续精修。')
                                }}
                            />
                        </div>
                    </>
                )}
                {(mode === 'pronounce' || mode === 'spell') && (
                    <>
                        <div data-word-phonetics-select className="shrink-0 md:hidden">
                            <TldSelect
                                size="practice"
                                layout="content"
                                menuPosition="portal"
                                label="音标方案"
                                value={values.phonetics}
                                options={phonetics}
                                open={menu === 'phonetics'}
                                onOpenChange={(open): void =>
                                    setMenu((current) =>
                                        open
                                            ? 'phonetics'
                                            : current === 'phonetics'
                                              ? null
                                              : current,
                                    )
                                }
                                onValueChange={(value): void => {
                                    if (
                                        value !== 'original' &&
                                        value !== 'syllables' &&
                                        value !== 'phonics' &&
                                        value !== 'none'
                                    )
                                        return
                                    onChange({ ...values, phonetics: value })
                                    if (value !== 'none')
                                        onNotice('音标方案已选择，对应展示数据待后续接入。')
                                }}
                            />
                        </div>
                        <div
                            ref={phoneticsRef}
                            role="group"
                            aria-label="音标方案"
                            className="relative isolate hidden min-h-10 shrink-0 items-center gap-2 md:flex rounded-[4px] bg-practice-control-surface pl-[3px] pr-2 xl:min-h-[26px]"
                        >
                            <TldMovingHighlight
                                containerRef={phoneticsRef}
                                activeKey={values.phonetics}
                                tone="practice-outline"
                                motion="slide"
                            />
                            {phonetics.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    data-highlight-key={option.value}
                                    aria-pressed={values.phonetics === option.value}
                                    className={
                                        values.phonetics === option.value
                                            ? 'h-10 cursor-pointer whitespace-nowrap rounded-[4px] border border-transparent px-1 text-[12px] font-normal leading-[18px] text-practice-control-accent outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus xl:h-5'
                                            : 'h-10 cursor-pointer whitespace-nowrap rounded-[4px] border border-transparent px-1 text-[12px] font-normal leading-[18px] text-practice-control-text outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus xl:h-5'
                                    }
                                    onClick={(): void => {
                                        onChange({ ...values, phonetics: option.value })
                                        if (option.value !== 'none')
                                            onNotice('音标方案已选择，对应展示数据待后续接入。')
                                    }}
                                >
                                    <span className="relative z-20">{option.label}</span>
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>
            <span className="sr-only">排序、切读和音标方案仅作本轮选择，不代表正式学习功能。</span>
        </div>
    )
}
