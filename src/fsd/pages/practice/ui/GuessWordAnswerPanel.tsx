'use client'

import { useEffect, useRef, useState } from 'react'
import type { ReactElement, RefObject } from 'react'
import { createPortal } from 'react-dom'
import { TldMovingHighlight } from '../../../shared/ui/tld-moving-highlight'
import type { PracticeQuestion } from '../model/practice-demo'
import type { WordCardExample } from '../model/word-card-analysis'
import type { WordPhoneticMode } from '../model/word-phonetics'
import { getGuessAnswerGeometry } from '../model/guess-word'
import type { DraftPanelGeometry } from '../model/practice-draft'
import { WordPronunciationCard } from './WordPronunciationCard'
import { usePracticePanelMotion } from './usePracticePanelMotion'
import type { PracticeReadingView } from './PracticeReadingOverlay'

interface GuessWordAnswerPanelProps {
    readonly id: string
    readonly open: boolean
    readonly blocked: boolean
    readonly anchor: RefObject<HTMLElement | null>
    readonly question: PracticeQuestion
    readonly reading?: PracticeReadingView | undefined
    readonly onClose: () => void
    readonly onPlay: () => void
    readonly onExamplePlay: (example: WordCardExample) => void
    readonly onNotice: (message: string) => void
    readonly portalRoot?: RefObject<HTMLElement | null>
}

const phoneticOptions = [
    { value: 'original', label: '原始音标' },
    { value: 'syllables', label: '音节拆分' },
    { value: 'phonics', label: '自然拼读' },
    { value: 'none', label: '无音标' },
] as const

/** 只负责非模态答案容器；草稿与这里使用同一240ms右侧滑入动画。 */
export function GuessWordAnswerPanel({
    id,
    open,
    blocked,
    anchor,
    question,
    reading,
    onClose,
    onPlay,
    onExamplePlay,
    onNotice,
    portalRoot,
}: GuessWordAnswerPanelProps): ReactElement | null {
    const panel = useRef<HTMLDivElement>(null)
    const tabs = useRef<HTMLDivElement>(null)
    const [geometry, setGeometry] = useState<DraftPanelGeometry | null>(null)
    const [phonetics, setPhonetics] = useState<WordPhoneticMode>('original')
    const [analysis, setAnalysis] = useState(false)
    const expanded = open && !blocked
    const ready = geometry !== null
    const present = usePracticePanelMotion(panel, { open: expanded, ready, direction: 'right' })

    useEffect(() => {
        if (!expanded) return
        function updateGeometry(): void {
            const visible = window.visualViewport
            const next = getGuessAnswerGeometry({
                width: visible?.width ?? window.innerWidth,
                height: visible?.height ?? window.innerHeight,
                offsetX: visible?.offsetLeft ?? 0,
                offsetY: visible?.offsetTop ?? 0,
            })
            setGeometry((previous) =>
                previous &&
                previous.x === next.x &&
                previous.y === next.y &&
                previous.width === next.width &&
                previous.height === next.height
                    ? previous
                    : next,
            )
        }
        updateGeometry()
        window.addEventListener('resize', updateGeometry)
        window.visualViewport?.addEventListener('resize', updateGeometry)
        window.visualViewport?.addEventListener('scroll', updateGeometry)
        return (): void => {
            window.removeEventListener('resize', updateGeometry)
            window.visualViewport?.removeEventListener('resize', updateGeometry)
            window.visualViewport?.removeEventListener('scroll', updateGeometry)
        }
    }, [expanded])

    useEffect(() => {
        if (!expanded) return
        function closeOutside(event: PointerEvent): void {
            const target = event.target
            if (
                !(target instanceof Node) ||
                panel.current?.contains(target) ||
                anchor.current?.contains(target) ||
                // 顶栏答案本身是toggle，不能先被外点关闭再由click重新打开。
                (target instanceof Element &&
                    target.closest(
                        '[data-practice-navigation-action="answer"],[data-practice-command="practice.panel.toggle"]',
                    ))
            )
                return
            onClose()
        }
        document.addEventListener('pointerdown', closeOutside, true)
        return (): void => document.removeEventListener('pointerdown', closeOutside, true)
    }, [expanded, anchor, onClose])

    useEffect(() => {
        if (!expanded || !ready) return
        panel.current?.focus({ preventScroll: true })
    }, [expanded, ready])

    function close(): void {
        if (panel.current?.contains(document.activeElement))
            anchor.current?.focus({ preventScroll: true })
        onClose()
    }

    if (!present || !geometry) return null
    return createPortal(
        <div
            ref={panel}
            id={id}
            role="dialog"
            aria-modal={false}
            aria-label={`${question.english} 的答案`}
            aria-hidden={!expanded}
            inert={!expanded}
            tabIndex={-1}
            data-guess-answer-panel
            style={{
                left: geometry.x,
                top: geometry.y,
                width: geometry.width,
            }}
            className="fixed isolate z-40 text-foreground outline-none"
            onKeyDownCapture={(event): void => {
                if (event.key !== 'Escape' || event.nativeEvent.isComposing) return
                event.preventDefault()
                event.stopPropagation()
                if (analysis) setAnalysis(false)
                else close()
            }}
        >
            <WordPronunciationCard
                layout="guess"
                cardHeight={geometry.height}
                question={question}
                showImage
                showTranslation
                imageSource={question.guess?.image}
                imageAlt={
                    question.english === 'hand' ? '手掌，hand设计示例插图' : '单词共用演示插图'
                }
                phoneticMode={phonetics}
                analysisOpen={analysis}
                disabled={!expanded}
                onPlay={onPlay}
                onAnalysis={(): void => setAnalysis(true)}
                onAnalysisClose={(): void => setAnalysis(false)}
                onExamplePlay={onExamplePlay}
                onAdd={(): void => onNotice('不熟单词保存尚未接入，当前仅演示入口。')}
                reading={reading}
                phoneticControls={
                    <div
                        ref={tabs}
                        role="group"
                        aria-label="答案音标方案"
                        className="relative isolate flex flex-wrap items-center justify-center rounded-[4px] bg-practice-control-surface p-[3px]"
                    >
                        <TldMovingHighlight
                            containerRef={tabs}
                            activeKey={phonetics}
                            tone="practice-outline"
                            motion="slide"
                        />
                        {phoneticOptions.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                data-highlight-key={option.value}
                                aria-pressed={phonetics === option.value}
                                disabled={!expanded}
                                onClick={(): void => setPhonetics(option.value)}
                                className="relative z-20 min-h-10 cursor-pointer whitespace-nowrap rounded-[4px] border border-transparent px-1 text-[12px] font-normal leading-[18px] text-practice-control-text outline-none hover:text-foreground aria-pressed:text-practice-control-accent focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-default xl:min-h-5 xl:text-[10px]"
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                }
            />
        </div>,
        portalRoot?.current ?? document.body,
    )
}
