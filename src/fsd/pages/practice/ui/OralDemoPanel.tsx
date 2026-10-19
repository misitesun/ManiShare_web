'use client'

import type { ReactElement } from 'react'
import { LearningAudioWave } from '../../../features/learning-settings'
import { TldButton } from '../../../shared/ui/tld-button'
import { formatPracticeMediaTime } from '../model/media-controller'
import type { OralDemoController } from '../model/useOralDemo'

export interface OralDemoPanelProps {
    readonly controller: OralDemoController
    readonly text?: string
    readonly translation?: string
    readonly onClose?: () => void
    readonly waveStyle?: string
}

const stageLabels = {
    idle: '待录音（演示）',
    recording: '录音中（演示）',
    evaluating: '评测中（演示）',
    result: '评测结果（演示）',
    error: '评测失败（演示）',
} as const

export function OralDemoPanel({
    controller,
    text,
    translation,
    onClose,
    waveStyle = '默认竖条',
}: OralDemoPanelProps): ReactElement {
    const { stage, elapsed, blocked } = controller

    return (
        <section aria-label="口语评测演示" className="w-full min-w-0 space-y-4 text-center">
            <div className="flex flex-wrap items-center justify-center gap-2">
                <h2 className="text-card-title font-medium text-practice-text">口语评测</h2>
                <span className="rounded-full border border-brand/40 px-2 py-0.5 text-caption text-brand">
                    演示
                </span>
            </div>
            {text && <p className="break-words text-section-title text-practice-text">{text}</p>}
            {translation && <p className="text-body text-secondary">{translation}</p>}
            <div className="rounded-xl border border-strong bg-surface/70 p-4">
                <p role="status" aria-live="polite" className="text-body text-practice-text">
                    {stageLabels[stage]}
                </p>
                <div className="my-4">
                    <LearningAudioWave
                        style={waveStyle}
                        active={stage === 'recording' && !blocked}
                    />
                </div>
                <p className="text-caption tabular-nums text-secondary">
                    演示计时 {formatPracticeMediaTime(elapsed)}
                </p>
                {stage === 'result' && (
                    <div className="mt-4 space-y-2">
                        <p className="text-section-title font-semibold text-brand">
                            86 <span className="text-caption">分（样例）</span>
                        </p>
                        <p className="text-body text-practice-text">表现优秀，细节加分</p>
                        <p className="text-caption text-secondary">
                            此分数为固定演示数据，不代表你的发音评分。
                        </p>
                    </div>
                )}
                {stage === 'error' && (
                    <p role="alert" className="mt-4 text-body text-danger">
                        演示评测失败，可返回待录状态重试。
                    </p>
                )}
            </div>
            <div className="flex flex-wrap justify-center gap-3">
                {stage === 'idle' && (
                    <TldButton size="compact" disabled={blocked} onClick={controller.start}>
                        开始录音演示
                    </TldButton>
                )}
                {stage === 'recording' && (
                    <TldButton
                        size="compact"
                        disabled={blocked}
                        onClick={controller.stopAndEvaluate}
                    >
                        结束录音演示
                    </TldButton>
                )}
                {stage === 'evaluating' && (
                    <>
                        <TldButton
                            size="compact"
                            disabled={blocked}
                            onClick={controller.showResult}
                        >
                            展示示例结果
                        </TldButton>
                        <TldButton
                            size="compact"
                            variant="secondary"
                            disabled={blocked}
                            onClick={controller.showError}
                        >
                            展示失败状态
                        </TldButton>
                    </>
                )}
                {stage !== 'idle' && (
                    <TldButton
                        size="compact"
                        variant="secondary"
                        disabled={blocked}
                        onClick={controller.reset}
                    >
                        重新演示
                    </TldButton>
                )}
                {onClose && (
                    <TldButton
                        size="compact"
                        variant="secondary"
                        onClick={(): void => {
                            controller.reset()
                            onClose()
                        }}
                    >
                        关闭
                    </TldButton>
                )}
            </div>
            <p className="text-caption text-secondary">
                仅演示界面、声纹和流程；不使用麦克风、不生成录音、不上传或评分。
            </p>
        </section>
    )
}
