'use client'

import { useEffect, useId, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent, ReactElement } from 'react'
import { createPortal } from 'react-dom'
import { TldButton } from '../../../shared/ui/tld-button'
import { getDraftPanelGeometry } from '../model/practice-draft'
import type { DraftPosition, DraftViewport } from '../model/practice-draft'
import closeAsset from '../assets/draft-panel-close.svg'
import { usePracticePanelMotion } from './usePracticePanelMotion'

interface PracticeDraftPanelProps {
    readonly open: boolean
    readonly scope: string
    readonly text: string
    readonly onTextChange: (text: string) => void
    readonly onClear: () => void
    readonly onSave: () => void
    readonly onClose: () => void
}

interface DraftDrag {
    readonly pointerId: number
    readonly pointer: DraftPosition
    readonly panel: DraftPosition
}

/** 非模态章节草稿，不注册模态层、不锁背景，也不调度练习媒体。 */
export function PracticeDraftPanel({
    open,
    scope,
    text,
    onTextChange,
    onClear,
    onSave,
    onClose,
}: PracticeDraftPanelProps): ReactElement | null {
    const titleId = useId()
    const moveHintId = useId()
    const [viewport, setViewport] = useState<DraftViewport | null>(null)
    const [position, setPosition] = useState<DraftPosition>()
    const [notice, setNotice] = useState('')
    const panelRef = useRef<HTMLDivElement>(null)
    const editorRef = useRef<HTMLTextAreaElement>(null)
    const originRef = useRef<HTMLElement | null>(null)
    const dragRef = useRef<DraftDrag | null>(null)
    const ready = viewport !== null
    const geometry = getDraftPanelGeometry(viewport ?? { width: 0, height: 0 }, position)
    const present = usePracticePanelMotion(panelRef, { open, ready, direction: 'right' })

    useEffect(() => {
        function resize(): void {
            const visible = window.visualViewport
            setViewport({
                width: visible?.width ?? window.innerWidth,
                height: visible?.height ?? window.innerHeight,
                offsetX: visible?.offsetLeft ?? 0,
                offsetY: visible?.offsetTop ?? 0,
            })
        }
        resize()
        window.addEventListener('resize', resize)
        window.visualViewport?.addEventListener('resize', resize)
        window.visualViewport?.addEventListener('scroll', resize)
        return (): void => {
            window.removeEventListener('resize', resize)
            window.visualViewport?.removeEventListener('resize', resize)
            window.visualViewport?.removeEventListener('scroll', resize)
        }
    }, [])

    useEffect(() => {
        if (!open || !ready) return
        originRef.current =
            document.activeElement instanceof HTMLElement ? document.activeElement : null
        editorRef.current?.focus({ preventScroll: true })
    }, [open, ready])

    function close(): void {
        if (panelRef.current?.contains(document.activeElement)) {
            const origin = originRef.current
            if (origin?.isConnected) origin.focus({ preventScroll: true })
            else
                document
                    .querySelector<HTMLElement>('[data-practice-navigation-action="draft"]')
                    ?.focus({ preventScroll: true })
        }
        onClose()
    }

    function beginDrag(event: PointerEvent<HTMLButtonElement>): void {
        if (event.button !== 0) return
        dragRef.current = {
            pointerId: event.pointerId,
            pointer: { x: event.clientX, y: event.clientY },
            panel: { x: geometry.x, y: geometry.y },
        }
        event.currentTarget.setPointerCapture(event.pointerId)
    }

    function moveDrag(event: PointerEvent<HTMLButtonElement>): void {
        const drag = dragRef.current
        if (!viewport || !drag || event.pointerId !== drag.pointerId) return
        const next = getDraftPanelGeometry(viewport, {
            x: drag.panel.x + event.clientX - drag.pointer.x,
            y: drag.panel.y + event.clientY - drag.pointer.y,
        })
        setPosition({ x: next.x, y: next.y })
    }

    function endDrag(event: PointerEvent<HTMLButtonElement>): void {
        if (dragRef.current?.pointerId !== event.pointerId) return
        dragRef.current = null
        if (event.currentTarget.hasPointerCapture(event.pointerId))
            event.currentTarget.releasePointerCapture(event.pointerId)
    }

    function moveWithKeyboard(event: KeyboardEvent<HTMLButtonElement>): void {
        const deltas: Readonly<Record<string, DraftPosition>> = {
            ArrowLeft: { x: -10, y: 0 },
            ArrowRight: { x: 10, y: 0 },
            ArrowUp: { x: 0, y: -10 },
            ArrowDown: { x: 0, y: 10 },
        }
        const delta = deltas[event.key]
        if (!viewport || !delta) return
        event.preventDefault()
        event.stopPropagation()
        const next = getDraftPanelGeometry(viewport, {
            x: geometry.x + delta.x,
            y: geometry.y + delta.y,
        })
        setPosition({ x: next.x, y: next.y })
    }

    if (!present) return null
    return createPortal(
        <div
            id="practice-chapter-draft"
            ref={panelRef}
            role="dialog"
            aria-modal={false}
            aria-hidden={!open}
            inert={!open}
            aria-labelledby={titleId}
            data-practice-draft-panel
            data-draft-scope={scope}
            style={{
                left: geometry.x,
                top: geometry.y,
                width: geometry.width,
                height: geometry.height,
            }}
            className="fixed isolate z-40 overflow-hidden rounded-xl bg-dialog-border text-foreground"
            onKeyDown={(event): void => {
                if (event.key === 'Escape' && !event.nativeEvent.isComposing) {
                    event.stopPropagation()
                    close()
                }
            }}
        >
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-px rounded-[11px] bg-linear-to-r/srgb from-dialog-surface via-dialog-surface-accent to-dialog-surface"
            />
            <header className="absolute inset-x-0 top-0 h-[54.22px]">
                <h2
                    id={titleId}
                    className="pointer-events-none absolute left-[16.82px] top-[16.41px] m-0 bg-linear-to-b from-brand-start to-brand-end bg-clip-text text-[20px] font-medium leading-[normal] text-transparent"
                >
                    草稿纸
                </h2>
                <button
                    type="button"
                    data-practice-draft-handle
                    aria-label="移动草稿纸"
                    aria-describedby={moveHintId}
                    className="absolute inset-y-0 left-0 right-12 cursor-pointer touch-none select-none rounded-tl-xl focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-focus active:cursor-move"
                    onPointerDown={beginDrag}
                    onPointerMove={moveDrag}
                    onPointerUp={endDrag}
                    onPointerCancel={endDrag}
                    onLostPointerCapture={(): void => {
                        dragRef.current = null
                    }}
                    onKeyDown={moveWithKeyboard}
                />
                <span id={moveHintId} className="sr-only">
                    拖动标题栏调整位置，也可使用方向键移动。
                </span>
                <button
                    type="button"
                    aria-label="关闭草稿纸"
                    className="absolute right-[6.92px] top-[10.23px] grid size-10 cursor-pointer place-items-center rounded-lg hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-focus"
                    onClick={close}
                >
                    <img
                        alt=""
                        src={closeAsset.src}
                        className="[filter:var(--app-filter-dialog-icon)]"
                    />
                </button>
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -left-[0.19px] top-[54.22px] w-[calc(100%+0.19px)] border-t border-foreground/30"
                />
            </header>
            <textarea
                ref={editorRef}
                aria-label="章节草稿"
                placeholder="请输入～"
                value={text}
                onChange={(event): void => {
                    onTextChange(event.target.value)
                    setNotice('')
                }}
                className="absolute bottom-20 left-[16.82px] right-[16.39px] top-[63.93px] m-0 cursor-text resize-none border-0 bg-transparent p-0 text-[14px] font-normal leading-[normal] text-foreground outline-none placeholder:text-hint"
            />
            {notice && (
                <p
                    role="status"
                    data-practice-draft-feedback
                    className="pointer-events-none absolute bottom-[65px] left-[16.82px] right-[16.39px] m-0 text-[12px] leading-4 text-hint"
                >
                    {notice}
                </p>
            )}
            <footer className="absolute bottom-[19px] left-[16.61px] right-[16.39px] grid grid-cols-[minmax(0,153fr)_minmax(0,154fr)] gap-[34px]">
                <TldButton
                    fullWidth
                    size="panel-action"
                    variant="soft"
                    onClick={(): void => {
                        onClear()
                        setNotice('已清空编辑内容，保存可确认本章空草稿。')
                    }}
                >
                    清空
                </TldButton>
                <TldButton
                    fullWidth
                    size="panel-action"
                    onClick={(): void => {
                        onSave()
                        setNotice('已保存本章草稿，仅本轮有效，刷新或退出后清除。')
                    }}
                >
                    保存
                </TldButton>
            </footer>
        </div>,
        document.body,
    )
}
