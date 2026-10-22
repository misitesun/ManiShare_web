'use client'

import type { ReactElement, ReactNode } from 'react'
import type { OralAssessmentDemoController } from '../model/useOralAssessmentDemo'
import {
    formatOralAssessmentTime,
    getOralAssessmentScorePresentation,
    normalizeOralAssessmentScore,
} from '../model/oral-assessment'
import type { OralAssessmentTarget } from '../model/oral-assessment'
import { OralAssessmentScore } from './OralAssessmentScore'
import { OralAssessmentActionIcon } from './OralAssessmentActionIcon'

export interface OralAssessmentContentProps {
    readonly target: OralAssessmentTarget
    readonly controller: OralAssessmentDemoController
    readonly presentation?: 'dialog' | 'page'
    readonly active?: boolean
    readonly translationVisible?: boolean
    /** 页面注入声纹，正文不横向依赖设置 feature。 */
    readonly wave?: ReactNode
}

/** 只展示评测正文；阶段与任务由同一个控制器拥有，容器负责关闭和题图。 */
export function OralAssessmentContent({
    target,
    controller,
    presentation = 'dialog',
    active = true,
    translationVisible = true,
    wave,
}: OralAssessmentContentProps): ReactElement {
    const completed = controller.stage === 'result' && controller.result !== null
    const recording = controller.stage === 'recording'
    const evaluating = controller.stage === 'evaluating'
    const page = presentation === 'page'
    const disabled = controller.blocked || !active || evaluating
    const hint = evaluating
        ? '评测中……'
        : recording
          ? page
              ? '正在录音…'
              : '结束录音·点击或字母V'
          : page
            ? '点击或按空格键开始'
            : '开始录音·点击或字母V'

    return (
        <div
            data-oral-assessment-content={presentation}
            data-oral-assessment-stage={controller.stage}
            data-oral-assessment-simulation
            aria-busy={evaluating}
            className="flex w-full min-w-0 flex-col items-center text-center text-content-strong"
        >
            {completed && controller.result !== null ? (
                <>
                    <div
                        aria-label="逐词模拟分数"
                        className={
                            page
                                ? 'mt-[30px] flex w-full min-w-0 flex-wrap justify-center gap-x-4 gap-y-3'
                                : 'flex w-full min-w-0 flex-wrap justify-center gap-x-4 gap-y-3 md:mt-[42px]'
                        }
                    >
                        {controller.result.words.map((word, index) => (
                            <div
                                key={`${index}:${word.text}`}
                                data-tone={getOralAssessmentScorePresentation(word.score).tone}
                                className="flex min-w-0 max-w-full flex-col items-center text-oral-score-low data-[tone=good]:text-oral-score-good data-[tone=excellent]:text-oral-score-excellent data-[tone=perfect]:text-oral-score-perfect"
                            >
                                <span className="text-[16px] font-normal leading-[22px]">
                                    {normalizeOralAssessmentScore(word.score)}
                                </span>
                                <span className="break-words text-[24px] font-medium leading-[42px] text-content-strong [overflow-wrap:anywhere] md:text-[30px]">
                                    {word.text}
                                </span>
                                <span
                                    aria-hidden="true"
                                    className="h-1 w-full rounded-full bg-current"
                                />
                            </div>
                        ))}
                    </div>
                    <p
                        className={
                            page
                                ? 'm-0 mt-[30px] min-h-[34px] max-w-full break-words text-[20px] font-normal leading-[34px] text-hint md:text-[24px]'
                                : 'm-0 mt-6 min-h-[34px] max-w-full break-words text-[20px] font-normal leading-[34px] text-hint md:text-[24px]'
                        }
                    >
                        {translationVisible && target.translation}
                    </p>
                    <div
                        className={
                            page
                                ? 'mt-8 flex w-full justify-center'
                                : 'mt-[30px] flex w-full justify-center'
                        }
                    >
                        <OralAssessmentScore
                            result={controller.result}
                            presentation={presentation}
                        />
                    </div>
                    <div className="mt-[27px] flex w-full justify-center gap-[68px]">
                        <button
                            type="button"
                            disabled={disabled}
                            aria-label="重新录制，字母 V"
                            onClick={controller.rerecord}
                            className="flex w-[60px] cursor-pointer flex-col items-center gap-[7px] rounded-full outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <OralAssessmentActionIcon kind="microphone" compact />
                            <span className="whitespace-nowrap text-[14px] leading-5 text-content-strong">
                                重新录制
                            </span>
                        </button>
                        <button
                            type="button"
                            disabled={disabled}
                            aria-label={
                                controller.playing
                                    ? '结束播放'
                                    : controller.replayPending
                                      ? '取消等待播放'
                                      : controller.replayError
                                        ? '朗读播放失败，点击重试'
                                        : controller.replayAudio
                                          ? '播放当前题目示例朗读'
                                          : '模拟播放录音'
                            }
                            aria-pressed={controller.playing}
                            aria-busy={controller.replayPending}
                            data-playing={controller.playing}
                            onClick={controller.replay}
                            className="flex w-[60px] cursor-pointer flex-col items-center gap-[7px] rounded-full outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <OralAssessmentActionIcon
                                kind="play"
                                compact
                                active={active && controller.playing && !controller.blocked}
                            />
                            <span className="whitespace-nowrap text-[14px] leading-5 text-content-strong">
                                {controller.playing
                                    ? '结束播放'
                                    : controller.replayPending
                                      ? '等待播放'
                                      : controller.replayError
                                        ? '播放重试'
                                        : '播放录音'}
                            </span>
                        </button>
                    </div>
                    <div
                        data-oral-assessment-playback-wave={presentation}
                        aria-hidden="true"
                        className="mt-2 h-[22px] w-full max-w-[200px] shrink-0 overflow-hidden [&_[data-audio-wave]]:origin-top [&_[data-audio-wave]]:scale-y-[0.3]"
                    >
                        {active && controller.playing && !controller.blocked ? wave : null}
                    </div>
                </>
            ) : (
                <>
                    <div
                        className={
                            page
                                ? recording || evaluating
                                    ? 'mt-[54px] flex min-h-[56px] w-full min-w-0 items-center justify-center'
                                    : 'mt-[26px] flex min-h-[56px] w-full min-w-0 items-center justify-center'
                                : 'flex min-h-[56px] w-full min-w-0 items-center justify-center md:mt-[109px]'
                        }
                    >
                        <p
                            className={
                                target.kind === 'sentence' && !page
                                    ? 'm-0 max-w-full break-words text-[24px] font-medium leading-[42px] md:text-[30px]'
                                    : 'm-0 max-w-full break-words text-[32px] font-medium leading-[56px] tracking-[0.06em] md:text-[40px]'
                            }
                        >
                            {target.text}
                        </p>
                    </div>
                    <p className="m-0 mt-3 min-h-[34px] max-w-full break-words text-[20px] font-normal leading-[34px] text-hint md:text-[24px]">
                        {translationVisible && target.translation}
                    </p>
                    <button
                        type="button"
                        disabled={disabled}
                        aria-label={
                            evaluating
                                ? '评测中，请稍候'
                                : recording
                                  ? '结束模拟录音，空格或字母 V'
                                  : '开始模拟录音，空格或字母 V'
                        }
                        data-recording={recording && !controller.blocked}
                        onClick={recording ? controller.stopAndEvaluate : controller.start}
                        className="mt-8 size-[100px] shrink-0 cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed md:mt-[47px]"
                    >
                        <OralAssessmentActionIcon
                            kind="microphone"
                            active={active && recording && !controller.blocked}
                        />
                    </button>
                    <p
                        role="status"
                        aria-live="polite"
                        className="m-0 mt-5 flex min-h-5 items-center justify-center gap-2 text-[14px] font-normal leading-5 text-oral-action"
                    >
                        {evaluating && (
                            <span
                                aria-hidden="true"
                                className="size-4 rounded-full border-2 border-current border-r-transparent motion-safe:animate-spin"
                            />
                        )}
                        {hint}
                    </p>
                    {(!page || recording) && (
                        <div
                            className={
                                page
                                    ? 'mt-5 h-[98px] w-full max-w-[370px] shrink-0'
                                    : 'mt-7 h-[98px] w-full max-w-[370px] shrink-0'
                            }
                            aria-hidden={!recording}
                        >
                            {recording && (
                                <>
                                    {wave}
                                    <p
                                        className={
                                            page
                                                ? 'm-0 text-[14px] leading-5 text-oral-action'
                                                : 'm-0 mt-2 text-[14px] leading-5 text-oral-action'
                                        }
                                    >
                                        {formatOralAssessmentTime(controller.elapsed)}
                                    </p>
                                </>
                            )}
                        </div>
                    )}
                </>
            )}
            <p className="sr-only">
                {controller.replayAudio
                    ? '录音与评分为模拟，不采集麦克风。播放按钮播放当前题目的示例朗读，不是用户录音。'
                    : '当前为模拟录音与模拟评分，不采集麦克风。播放按钮仅演示播放状态。'}
            </p>
        </div>
    )
}
