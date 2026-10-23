'use client'

import type { CSSProperties, ReactElement, ReactNode } from 'react'
import { getSentenceGameLabel } from '../model/sentence-game-family'
import type { SentenceGameFamily } from '../model/sentence-game-family'
import { getPreviewAppearance } from '../../../features/learning-settings'
import type { LearningPreferences } from '../../../features/learning-settings'
import { Tooltip } from '../../../shared/ui/tooltip'
import type { PracticeQuestion, PracticeSession, PracticeToken } from '../model/practice-demo'
import { getSentenceBlockCandidates, usesReadingBlockReference } from '../model/sentence-blocks'
import type { SentenceBlockEdit } from '../model/sentence-blocks'
import { PracticeReadingOverlay } from './PracticeReadingOverlay'
import type { PracticeReadingView } from './PracticeReadingOverlay'
import scene from '../assets/reading-scene.png'
import undoIcon from '../assets/sentence-blocks-undo.svg'
import clearIcon from '../assets/sentence-blocks-clear.svg'

interface SentenceBlockStyle extends CSSProperties {
    '--sentence-block-width'?: string
}

interface SentenceBlocksExerciseProps {
    readonly family?: SentenceGameFamily | 'video'
    readonly question: PracticeQuestion
    readonly session: PracticeSession
    readonly values: LearningPreferences
    readonly imageVisible: boolean
    readonly translationVisible: boolean
    readonly blocked: boolean
    readonly onEdit: (edit: SentenceBlockEdit) => void
    readonly reading?: PracticeReadingView | undefined
    readonly media?: ReactNode
}

interface BlockProps {
    readonly token: PracticeToken
    readonly values: LearningPreferences
    readonly selected: boolean
    readonly disabled: boolean
    readonly incorrect?: boolean
    readonly referenceWidth?: number | undefined
    readonly onEdit: (edit: SentenceBlockEdit) => void
}

const referenceWidths: Readonly<Record<string, number>> = {
    we: 78,
    read: 100,
    books: 132,
    together: 154,
}

function Block({
    token,
    values,
    selected,
    disabled,
    incorrect = false,
    referenceWidth,
    onEdit,
}: BlockProps): ReactElement {
    const appearance = getPreviewAppearance(values)
    const style: SentenceBlockStyle = {
        ...(referenceWidth !== undefined && values.fontSize === '默认'
            ? { '--sentence-block-width': `${referenceWidth}px` }
            : {}),
        ...(values.fontSize !== '默认' ? { fontSize: appearance.fontSize } : {}),
        borderStyle: appearance.borderStyle,
    }
    return (
        <button
            type="button"
            data-sentence-block={token.id}
            data-sentence-block-selected={selected}
            data-sentence-block-tone={incorrect ? 'incorrect' : selected ? 'selected' : 'default'}
            data-sentence-block-reference={
                referenceWidth !== undefined && values.fontSize === '默认'
            }
            aria-label={selected ? `撤回 ${token.text}` : `选择 ${token.text}`}
            aria-invalid={incorrect || undefined}
            disabled={disabled}
            onClick={(): void => onEdit({ type: 'toggle', id: token.id })}
            style={style}
            className="inline-flex min-h-12 max-w-full shrink-0 cursor-pointer items-center justify-center break-words rounded-lg border border-sentence-block-border bg-sentence-block pb-1 pl-[14px] pr-[15px] pt-[5px] text-[26px] font-normal leading-[38px] outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-default data-[sentence-block-selected=true]:border-sentence-block-selected-border data-[sentence-block-selected=true]:bg-sentence-block-selected data-[sentence-block-selected=true]:shadow-[var(--app-shadow-sentence-block-selected)] data-[sentence-block-tone=default]:text-practice-answer/80 data-[sentence-block-tone=incorrect]:text-danger data-[sentence-block-tone=selected]:text-practice-answer data-[sentence-block-selected=false]:disabled:border-sentence-block-disabled-border data-[sentence-block-selected=false]:disabled:bg-sentence-block-disabled data-[sentence-block-selected=false]:disabled:text-practice-answer/15 md:min-h-16 md:text-[32px] md:leading-[45px] design:min-h-[64px] design:text-[38px] design:leading-[53px] design:data-[sentence-block-reference=true]:w-[var(--sentence-block-width)]"
        >
            {token.text}
        </button>
    )
}

/** 拼块独占题面；题序、判题、音频与正确结果由原练习会话装配。 */
export function SentenceBlocksExercise({
    family = 'sentence',
    question,
    session,
    values,
    imageVisible,
    translationVisible,
    blocked,
    onEdit,
    reading,
    media,
}: SentenceBlocksExerciseProps): ReactElement {
    const appearance = getPreviewAppearance(values)
    const mediaVisible = media !== undefined || imageVisible
    const selectedTokens = session.blocks.flatMap((id) => {
        const token = question.tokens.find((item) => item.id === id)
        return token ? [token] : []
    })
    const candidates = getSentenceBlockCandidates(question)
    const controls = [
        { type: 'undo', label: '撤回上一个词块', icon: undoIcon.src },
        { type: 'clear', label: '全部清除', icon: clearIcon.src },
    ] as const
    return (
        <section
            aria-label={`${getSentenceGameLabel(family)}选词拼块`}
            data-practice-blocks-family={family}
            data-audio-blocks={family === 'audio' || undefined}
            data-video-blocks={family === 'video' || undefined}
            data-sentence-blocks
            data-reference-node={family === 'video' ? undefined : '546:34436'}
            className={
                family === 'video'
                    ? 'mx-auto flex w-full min-w-0 shrink-0 flex-col items-center px-4 pb-12 pt-16 md:px-6 design:pb-8 design:pt-[85px]'
                    : 'mx-auto flex w-full min-w-0 shrink-0 flex-col items-center px-4 pb-12 pt-16 md:px-6 design:pb-[99px] design:pt-[82px]'
            }
        >
            {media ??
                (imageVisible && (
                    <div
                        data-practice-reading-surface
                        className="relative w-full max-w-[430px] overflow-hidden rounded-[20px]"
                    >
                        <img
                            data-practice-media
                            src={scene.src}
                            alt={`${getSentenceGameLabel(family)}练习共用示意插图`}
                            width={430}
                            height={242}
                            className="block aspect-[430/242] h-auto w-full object-cover"
                        />
                        <PracticeReadingOverlay reading={reading} />
                    </div>
                ))}
            {translationVisible && (
                <p
                    data-practice-translation
                    className={
                        mediaVisible
                            ? 'mt-8 max-w-full break-words text-center text-[24px] font-normal leading-[34px] text-practice-text md:text-[32px] md:leading-[45px] design:mt-[50px] design:text-[40px] design:leading-[56px]'
                            : 'max-w-full break-words text-center text-[24px] font-normal leading-[34px] text-practice-text md:text-[32px] md:leading-[45px] design:text-[40px] design:leading-[56px]'
                    }
                    style={
                        values.fontSize === '默认' ? undefined : { fontSize: appearance.fontSize }
                    }
                >
                    {question.translation}
                </p>
            )}
            <div
                data-sentence-blocks-tray
                aria-label="已选择的词块，点击撤回"
                className={
                    family === 'video'
                        ? 'relative mt-8 flex min-h-[163px] w-full max-w-[794px] flex-col items-center justify-center rounded-xl px-4 pb-[49px] pt-[50px] design:mt-10'
                        : 'relative mt-8 flex min-h-[163px] w-full max-w-[794px] flex-col items-center justify-center rounded-xl px-4 pb-[49px] pt-[50px] design:mt-[60px]'
                }
            >
                <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 rounded-xl p-px"
                    style={{
                        background: 'var(--app-gradient-sentence-tray)',
                        mask: 'linear-gradient(var(--app-color-text-primary) 0 0) content-box, linear-gradient(var(--app-color-text-primary) 0 0)',
                        maskComposite: 'exclude',
                        WebkitMask:
                            'linear-gradient(var(--app-color-text-primary) 0 0) content-box, linear-gradient(var(--app-color-text-primary) 0 0)',
                        WebkitMaskComposite: 'xor',
                    }}
                />
                <div
                    className="absolute right-3 top-3 flex gap-[10px]"
                    role="group"
                    aria-label="拼块操作"
                >
                    {controls.map((control) => (
                        <Tooltip key={control.type} content={control.label} placement="top">
                            <button
                                type="button"
                                data-sentence-blocks-action={control.type}
                                aria-label={control.label}
                                disabled={blocked || selectedTokens.length === 0}
                                onClick={(): void => onEdit({ type: control.type })}
                                className="grid size-10 shrink-0 cursor-pointer place-items-center rounded outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-default disabled:opacity-40 design:size-[30px]"
                            >
                                <img
                                    src={control.icon}
                                    alt=""
                                    width={30}
                                    height={30}
                                    className="shrink-0 [filter:var(--app-filter-dialog-icon)]"
                                />
                            </button>
                        </Tooltip>
                    ))}
                </div>
                {selectedTokens.length > 0 && (
                    <div className="flex w-full min-w-0 flex-wrap items-center justify-center gap-3 md:gap-5 design:gap-[30px]">
                        {selectedTokens.map((token, index) => (
                            <Block
                                key={token.id}
                                token={token}
                                values={values}
                                selected
                                disabled={blocked}
                                incorrect={
                                    session.phase === 'incorrect' &&
                                    token.text !== question.tokens[index]?.text
                                }
                                referenceWidth={
                                    usesReadingBlockReference(question) && token.text !== 'together'
                                        ? referenceWidths[token.text]
                                        : undefined
                                }
                                onEdit={onEdit}
                            />
                        ))}
                    </div>
                )}
            </div>
            <div
                data-sentence-blocks-candidates
                role="group"
                aria-label="候选词块"
                className={
                    family === 'video'
                        ? 'mt-10 flex w-full max-w-[794px] flex-wrap items-center justify-center gap-3 md:gap-5 design:mt-[60px] design:gap-[40px]'
                        : 'mt-10 flex w-full max-w-[794px] flex-wrap items-center justify-center gap-3 md:gap-5 design:mt-[89px] design:gap-[40px]'
                }
            >
                {candidates.map((token) => (
                    <Block
                        key={token.id}
                        token={token}
                        values={values}
                        selected={false}
                        disabled={blocked || session.blocks.includes(token.id)}
                        referenceWidth={
                            usesReadingBlockReference(question)
                                ? referenceWidths[token.text]
                                : undefined
                        }
                        onEdit={onEdit}
                    />
                ))}
            </div>
        </section>
    )
}
