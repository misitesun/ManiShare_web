'use client'

import { useState } from 'react'
import type { ReactElement, ReactNode } from 'react'
import { TldSwitch } from '../../../shared/ui/tld-switch'
import type { PracticeFamily } from '../model/practice-demo'
import { getPracticeToolbarDescription } from '../model/practice-toolbar-description'
import type { PracticeModeToolbarRow } from '../model/practice-toolbar-description'
import {
    PracticeToolbarOptions,
    PracticeToolbarSegment,
    PracticeToolbarTimer,
} from './PracticeToolbarControls'

type ModeToolbarRow = PracticeModeToolbarRow

type ModeToolbarFamily = Exclude<PracticeFamily, 'word'>

const toolbarLabels: Readonly<Record<ModeToolbarFamily, string>> = {
    sentence: '句子练习局部设置',
    audio: '音频练习局部设置',
    video: '视频练习局部设置',
    picture: '看图学词局部设置',
    guess: '猜词练习局部设置',
    typing: '独立指法局部设置',
    phonetics: '音标练习局部设置',
    'audio-reader': '纯音频阅读局部设置',
    'video-reader': '纯视频阅读局部设置',
    'picture-reader': '纯图片阅读局部设置',
    'text-reader': '文章阅读局部设置',
}

interface PracticeModeToolbarProps<TRow extends ModeToolbarRow> {
    readonly family: ModeToolbarFamily
    readonly reference?: 'default' | 'listening'
    readonly rows: readonly TRow[]
    readonly values: Readonly<Record<TRow, boolean>>
    readonly onValueChange: (row: TRow, checked: boolean) => void
    readonly onNotice: (message: string) => void
    readonly inlineControl?: ReactNode
}

function getRowLabel(row: ModeToolbarRow): string {
    if (row === 'imageVisible') return '图片'
    if (row === 'translationVisible') return '翻译'
    if (row === 'keyboardVisible') return '键盘'
    if (row === 'sentenceAnalysisVisible') return '拆句'
    return '切读'
}

/** 只复用相同的行渲染；可用项与初值由各内容族的配置提供。 */
export function PracticeModeToolbar<TRow extends ModeToolbarRow>({
    family,
    reference = 'default',
    rows,
    values,
    onValueChange,
    onNotice,
    inlineControl,
}: PracticeModeToolbarProps<TRow>): ReactElement {
    const [optionsOpen, setOptionsOpen] = useState(false)
    return (
        <div
            data-practice-toolbar={family}
            data-sentence-toolbar={family === 'sentence' ? '' : undefined}
            data-audio-toolbar={family === 'audio' ? '' : undefined}
            role="group"
            aria-label={toolbarLabels[family]}
            className={
                reference === 'listening'
                    ? 'relative z-30 flex min-w-0 flex-wrap items-center gap-3 px-4 pt-5 text-practice-control-text design:absolute design:left-[29px] design:right-4 design:top-[17px] design:p-0'
                    : family === 'phonetics'
                      ? 'relative z-30 flex min-w-0 flex-wrap items-center gap-[10px] px-4 pt-5 text-practice-control-text design:absolute design:left-4 design:right-4 design:top-5 design:p-0'
                      : 'relative z-30 flex min-w-0 flex-wrap items-center gap-3 px-4 pt-5 text-practice-control-text design:absolute design:left-4 design:right-4 design:top-5 design:p-0'
            }
        >
            <PracticeToolbarTimer family={family} />
            {inlineControl}
            {rows.length > 0 && (
                <PracticeToolbarOptions
                    family={family}
                    open={optionsOpen}
                    onOpenChange={setOptionsOpen}
                >
                    {rows.map((row) =>
                        row === 'split' || row === 'copy' ? (
                            <PracticeToolbarSegment
                                key={row}
                                label={row === 'split' ? '句子显示方式' : '输入方式'}
                                firstLabel={row === 'split' ? '完整' : '默写'}
                                secondLabel={row === 'split' ? '拆分' : '抄写'}
                                value={values[row]}
                                onChange={(checked): void => {
                                    onValueChange(row, checked)
                                    onNotice(
                                        family === 'audio' && row === 'copy'
                                            ? ''
                                            : row === 'split'
                                              ? '句子显示方式已选择，拆分题面待后续精修。'
                                              : '输入方式已选择，抄写题面待后续精修。',
                                    )
                                }}
                            />
                        ) : (
                            <div
                                key={row}
                                className="flex min-h-10 items-center justify-center px-[5px] xl:min-h-6"
                            >
                                <TldSwitch
                                    size="practice"
                                    label={getRowLabel(row)}
                                    checked={values[row]}
                                    onCheckedChange={(checked): void => {
                                        onValueChange(row, checked)
                                        if (row === 'cutReading')
                                            onNotice(checked ? '已开启切读。' : '已关闭切读。')
                                    }}
                                />
                            </div>
                        ),
                    )}
                </PracticeToolbarOptions>
            )}
            <span className="sr-only">{getPracticeToolbarDescription(family, rows)}</span>
        </div>
    )
}
