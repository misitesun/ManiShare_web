'use client'

import type { ReactElement, ReactNode } from 'react'
import { TldDialog } from '../../../shared/ui/tld-dialog'
import type { TldDialogReferenceFrame } from '../../../shared/ui/tld-dialog'
import type { OralAssessmentDemoController } from '../model/useOralAssessmentDemo'
import { formatOralAssessmentTime } from '../model/oral-assessment'
import type { OralAssessmentTarget } from '../model/oral-assessment'
import { getOralScoreTone, OralAssessmentScore } from './OralAssessmentScore'
import { OralAssessmentActionIcon } from './OralAssessmentActionIcon'

const referenceFrame: TldDialogReferenceFrame = { width: 1220, offsetX: 0, offsetY: 5.5 }

export interface OralAssessmentDialogProps {
    readonly open: boolean
    readonly onOpenChange: (open: boolean) => void
    readonly target: OralAssessmentTarget
    readonly controller: OralAssessmentDemoController
    /** 由页面装配设置中的录音/朗读声纹，feature 不横向依赖设置 feature。 */
    readonly wave?: ReactNode
}

export function OralAssessmentDialog({
    open,
    onOpenChange,
    target,
    controller,
    wave,
}: OralAssessmentDialogProps): ReactElement {
    const completed = controller.stage === 'result' && controller.result !== null
    const recording = controller.stage === 'recording'
    const evaluating = controller.stage === 'evaluating'
    const disabled = controller.blocked || evaluating
    const hint = evaluating
        ? '评测中……'
        : recording
          ? '结束录音·点击或字母V'
          : '开始录音·点击或字母V'

    function close(): void {
        controller.reset()
        onOpenChange(false)
    }

    return (
        <TldDialog
            open={open}
            onOpenChange={(value): void => {
                if (!value) close()
                else onOpenChange(true)
            }}
            title="口语评测"
            closeLabel="关闭口语评测"
            referenceFrame={referenceFrame}
            size="fit-extra-wide"
            density="compact"
            showHeader={false}
            showCancelButton={false}
            showConfirmButton={false}
            closeOnBackdrop={false}
        >
            <div
                data-oral-assessment-dialog
                data-oral-assessment-stage={controller.stage}
                data-oral-assessment-simulation
                className="relative flex min-h-[540px] flex-col items-center px-5 pb-6 pt-14 text-center text-content-strong md:min-h-[639px] md:px-10 md:pb-8 md:pt-0"
            >
                {completed && controller.result !== null ? (
                    <>
                        <div
                            aria-label="逐词模拟分数"
                            className="flex w-full min-w-0 flex-wrap justify-center gap-x-4 gap-y-3 md:mt-[42px]"
                        >
                            {controller.result.words.map((word, index) => (
                                <div
                                    key={`${index}:${word.text}`}
                                    data-tone={getOralScoreTone(word.score)}
                                    className="flex min-w-0 max-w-full flex-col items-center text-danger data-[tone=good]:text-accent-orange data-[tone=excellent]:text-accent-blue data-[tone=perfect]:text-success"
                                >
                                    <span className="text-[16px] font-normal leading-[22px]">
                                        {word.score}
                                    </span>
                                    <span className="mt-1 break-words text-[24px] font-medium leading-[42px] text-content-strong [overflow-wrap:anywhere] md:text-[30px]">
                                        {word.text}
                                    </span>
                                    <span
                                        aria-hidden="true"
                                        className="mt-1 h-1 w-full rounded-full bg-current"
                                    />
                                </div>
                            ))}
                        </div>
                        <p className="m-0 mt-6 min-h-[34px] max-w-full break-words text-[20px] font-normal leading-[34px] text-hint md:text-[24px]">
                            {target.translation}
                        </p>
                        <div className="mt-[30px] flex w-full justify-center">
                            <OralAssessmentScore result={controller.result} />
                        </div>
                        <div className="mt-[27px] flex w-full justify-center gap-[68px]">
                            <button
                                type="button"
                                disabled={controller.blocked}
                                aria-label="重新录制，字母 V"
                                onClick={controller.rerecord}
                                className="flex w-[60px] cursor-pointer flex-col items-center gap-2.5 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <OralAssessmentActionIcon kind="microphone" compact />
                                <span className="whitespace-nowrap text-[14px] leading-[17px] text-content-strong">
                                    重新录制
                                </span>
                            </button>
                            <button
                                type="button"
                                disabled={controller.blocked}
                                aria-label={controller.playing ? '结束模拟播放' : '模拟播放录音'}
                                aria-pressed={controller.playing}
                                data-playing={controller.playing}
                                onClick={controller.replay}
                                className="flex w-[60px] cursor-pointer flex-col items-center gap-2.5 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <OralAssessmentActionIcon
                                    kind="play"
                                    compact
                                    active={open && controller.playing && !controller.blocked}
                                />
                                <span className="whitespace-nowrap text-[14px] leading-[17px] text-content-strong">
                                    {controller.playing ? '结束播放' : '播放录音'}
                                </span>
                            </button>
                        </div>
                        <div
                            aria-hidden="true"
                            className="mt-2 h-[22px] w-full max-w-[200px] shrink-0 overflow-hidden [&_[data-audio-wave]]:origin-top [&_[data-audio-wave]]:scale-y-[0.3]"
                        >
                            {controller.playing ? wave : null}
                        </div>
                    </>
                ) : (
                    <>
                        <div className="flex min-h-[56px] w-full min-w-0 items-center justify-center md:mt-[109px]">
                            <p
                                className={
                                    target.kind === 'sentence'
                                        ? 'm-0 max-w-full break-words text-[24px] font-medium leading-[42px] md:text-[30px]'
                                        : 'm-0 max-w-full break-words text-[32px] font-medium leading-[56px] tracking-[0.06em] md:text-[40px]'
                                }
                            >
                                {target.text}
                            </p>
                        </div>
                        <p className="m-0 mt-3 min-h-[34px] max-w-full break-words text-[20px] font-normal leading-[34px] text-hint md:text-[24px]">
                            {target.translation}
                        </p>
                        <button
                            type="button"
                            disabled={disabled}
                            aria-label={
                                evaluating
                                    ? '评测中，请稍候'
                                    : recording
                                      ? '结束模拟录音，字母 V'
                                      : '开始模拟录音，字母 V'
                            }
                            data-recording={recording && !controller.blocked}
                            onClick={recording ? controller.stopAndEvaluate : controller.start}
                            className="mt-8 size-[100px] shrink-0 cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed md:mt-[47px]"
                        >
                            <OralAssessmentActionIcon
                                kind="microphone"
                                active={open && recording && !controller.blocked}
                            />
                        </button>
                        <p
                            role="status"
                            aria-live="polite"
                            className="m-0 mt-5 min-h-[17px] text-[14px] font-normal leading-[17px] text-oral-action"
                        >
                            {hint}
                        </p>
                        <div
                            className="mt-7 h-[98px] w-full max-w-[370px] shrink-0"
                            aria-hidden={!recording}
                        >
                            {recording ? (
                                <>
                                    {wave}
                                    <p className="m-0 mt-2 text-[14px] leading-5 text-oral-action">
                                        {formatOralAssessmentTime(controller.elapsed)}
                                    </p>
                                </>
                            ) : null}
                        </div>
                    </>
                )}
                <button
                    type="button"
                    onClick={close}
                    className="absolute bottom-2.5 left-1/2 min-h-10 -translate-x-1/2 cursor-pointer rounded px-2 text-[14px] font-normal leading-5 text-hint outline-none focus-visible:ring-2 focus-visible:ring-focus"
                >
                    ESC退出
                </button>
                <p className="sr-only">
                    当前为模拟录音与模拟评分，不采集麦克风。播放按钮仅演示播放状态。
                </p>
            </div>
        </TldDialog>
    )
}
