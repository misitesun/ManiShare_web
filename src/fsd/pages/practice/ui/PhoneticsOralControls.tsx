'use client'

import type { ReactElement } from 'react'
import { OralAssessmentScoreRing } from '../../../features/oral-assessment'
import type { OralAssessmentDemoController } from '../../../features/oral-assessment'
import { LearningAudioWave } from '../../../features/learning-settings'
import { formatPracticeMediaTime } from '../model/media-controller'
import microphone from '../assets/phonetics-note.svg'
import play from '../assets/video-listening/play.svg'
import pause from '../assets/video-listening/pause.svg'

export interface PhoneticsOralControlsProps {
    readonly controller?: OralAssessmentDemoController | undefined
    readonly disabled: boolean
    readonly recordingWave: string
    readonly readingWave: string
}

/** 只组合句子评测控制器，不创建第二份录制、评测或回放计时。 */
export function PhoneticsOralControls({
    controller,
    disabled,
    recordingWave,
    readingWave,
}: PhoneticsOralControlsProps): ReactElement {
    const stage = controller?.stage ?? 'idle'
    const recording = stage === 'recording'
    const evaluating = stage === 'evaluating'
    const result = stage === 'result' ? controller?.result : null
    const blocked = disabled || !controller || controller.blocked
    const playing = controller?.playing === true && !blocked
    const label = evaluating
        ? '评测中，请稍候'
        : recording
          ? '结束录制'
          : result
            ? '重新录制'
            : '开始口语评测'
    return (
        <section
            data-phonetics-oral-stage={stage}
            aria-label="卡内口语评测（演示）"
            aria-busy={evaluating}
            className="relative flex min-h-[88px] w-full min-w-0 flex-wrap items-start gap-4"
        >
            <button
                type="button"
                disabled={blocked || evaluating}
                aria-label={label}
                data-expanded={stage !== 'idle'}
                onClick={(): void => {
                    if (recording) controller?.stopAndEvaluate()
                    else if (result) controller?.rerecord()
                    else controller?.start()
                }}
                className="relative left-[calc(50%-32px)] flex w-16 shrink-0 cursor-pointer flex-col items-center gap-1 rounded-lg outline-none transition-[left] duration-300 ease-out focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-default disabled:opacity-60 data-[expanded=true]:left-0 motion-reduce:transition-none"
            >
                <span className="relative block size-[58px]">
                    <img
                        src={microphone.src}
                        alt=""
                        width={58}
                        height={58}
                        draggable={false}
                        className="block size-full"
                    />
                    {recording && (
                        <span
                            aria-hidden="true"
                            className="absolute inset-[16px] flex items-center justify-center rounded-full bg-oral-record"
                        >
                            <span className="size-3 rounded-[2px] bg-media-foreground" />
                        </span>
                    )}
                </span>
                <span
                    className={
                        result
                            ? 'whitespace-nowrap text-[12px] leading-5 text-practice-muted'
                            : 'sr-only'
                    }
                >
                    {label}
                </span>
            </button>
            {(recording || evaluating) && (
                <div className="min-w-[120px] flex-1 pt-1">
                    <p
                        role="status"
                        aria-live="polite"
                        data-recording={recording}
                        className="m-0 flex items-center gap-2 text-[14px] leading-5 text-practice-control-text data-[recording=true]:justify-center"
                    >
                        {evaluating && (
                            <span
                                aria-hidden="true"
                                className="size-4 rounded-full border-2 border-oral-action border-r-transparent motion-safe:animate-spin"
                            />
                        )}
                        {recording ? '录制中' : '评测中'}
                        {recording && (
                            <span className="tabular-nums text-practice-muted">
                                {formatPracticeMediaTime(controller?.elapsed ?? 0)}
                            </span>
                        )}
                    </p>
                    {recording ? (
                        <div className="mt-1 h-7 overflow-hidden [&>div]:origin-top [&>div]:scale-y-[0.4]">
                            <LearningAudioWave
                                style={recordingWave}
                                active={!blocked}
                                label="录制声纹"
                            />
                        </div>
                    ) : (
                        <p className="m-0 mt-1 text-[12px] leading-5 text-practice-muted">
                            正在生成本次得分
                        </p>
                    )}
                </div>
            )}
            {result && (
                <>
                    <button
                        type="button"
                        disabled={blocked}
                        aria-label={
                            playing
                                ? '停止示例回放'
                                : controller?.replayPending
                                  ? '取消等待播放'
                                  : controller?.replayError
                                    ? '播放失败，点击重试'
                                    : '播放当前单词示例（非用户录音）'
                        }
                        aria-pressed={playing}
                        aria-busy={controller?.replayPending === true}
                        onClick={controller?.replay}
                        className="flex w-16 shrink-0 cursor-pointer flex-col items-center gap-1 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-default disabled:opacity-60"
                    >
                        <span className="flex size-[58px] items-center justify-center rounded-full bg-practice-control-surface">
                            <img
                                src={playing ? pause.src : play.src}
                                width={28}
                                height={28}
                                alt=""
                                draggable={false}
                                className="[filter:var(--app-filter-practice-icon)]"
                            />
                        </span>
                        <span className="whitespace-nowrap text-[12px] leading-5 text-practice-muted">
                            {playing
                                ? '停止播放'
                                : controller?.replayPending
                                  ? '等待播放'
                                  : controller?.replayError
                                    ? '播放重试'
                                    : '播放'}
                        </span>
                    </button>
                    <div className="ml-auto">
                        <OralAssessmentScoreRing
                            score={result.score}
                            compact
                            animate
                            active={!blocked}
                        />
                    </div>
                    {playing && (
                        <div className="h-7 w-full max-w-[180px] basis-full overflow-hidden md:absolute md:left-[176px] md:top-5 [&>div]:origin-top [&>div]:scale-y-[0.4]">
                            <LearningAudioWave style={readingWave} active label="示例回放声纹" />
                        </div>
                    )}
                </>
            )}
        </section>
    )
}
