'use client'

import { useEffect, useId, useRef, useState } from 'react'
import type { ReactElement } from 'react'
import { TldButton } from '../../../shared/ui/tld-button'
import { TldDialog } from '../../../shared/ui/tld-dialog'
import { getMonotonicMilliseconds } from '../../../shared/lib/time'
import type { PracticeQuestion } from '../model/practice-demo'
import type { PracticeNotes } from '../model/usePracticeNotes'
import { getPracticeNoteAge, PRACTICE_NOTE_LIMIT } from '../model/practice-notes'
import titleAsset from '../assets/notes/title.svg'
import closeAsset from '../assets/notes/close.svg'
import emptyAsset from '../assets/notes/empty.png'
import writeAsset from '../assets/notes/write.svg'
import editAsset from '../assets/notes/edit.svg'
import deleteAsset from '../assets/notes/delete.svg'
import modifierAsset from '../assets/notes/modifier.svg'
import enterAsset from '../assets/notes/enter.svg'

interface PracticeNotesPanelProps {
    readonly open: boolean
    readonly questions: readonly PracticeQuestion[]
    readonly controller: PracticeNotes
    readonly onClose: () => void
}

/** 原始章节列表提供题目身份，待练卡堆的重排或删题不参与笔记列表生命周期。 */
export function PracticeNotesPanel({
    open,
    questions,
    controller,
    onClose,
}: PracticeNotesPanelProps): ReactElement {
    const countId = useId()
    const editorId = useId()
    const editorRef = useRef<HTMLTextAreaElement>(null)
    const [now, setNow] = useState(0)
    const [notice, setNotice] = useState('')
    const editor = controller.editor
    const target = questions.find((question) => question.id === editor?.questionId)
    const count = editor?.text.length ?? 0

    useEffect(() => {
        if (!open) return
        setNotice('')
        function tick(): void {
            setNow(getMonotonicMilliseconds())
        }
        tick()
        const timer = window.setInterval(tick, 60000)
        return (): void => window.clearInterval(timer)
    }, [open])

    function save(): void {
        if (!controller.canSave) return
        controller.save()
        setNow(getMonotonicMilliseconds())
        setNotice('已保存本题笔记。')
    }

    return (
        <TldDialog
            open={open}
            placement="right"
            size="fit-extra-wide"
            referenceFrame={{ width: 544, offsetX: 0, offsetY: 0.5 }}
            title={controller.notes.length > 0 ? `笔记·${controller.notes.length}` : '笔记'}
            showHeader={false}
            showCloseButton={false}
            footer={null}
            onOpenChange={(next): void => {
                if (!next) onClose()
            }}
        >
            <section
                data-practice-notes-panel
                data-reference-node={controller.notes.length > 0 ? '546:36010' : '546:35888'}
                data-note-question={editor?.questionId}
                className="flex h-[741px] max-h-[calc(var(--dialog-available-height,100dvh)-26px)] min-h-0 flex-col overflow-y-auto overscroll-contain text-foreground md:max-h-[calc(var(--dialog-available-height,100dvh)-50px)]"
                onKeyDown={(event): void => {
                    if (
                        event.key !== 'Enter' ||
                        (!event.metaKey && !event.ctrlKey) ||
                        event.altKey ||
                        event.shiftKey ||
                        event.nativeEvent.isComposing ||
                        event.keyCode === 229
                    )
                        return
                    event.preventDefault()
                    event.stopPropagation()
                    if (!event.repeat) save()
                }}
            >
                <header className="relative h-[66px] shrink-0 border-b border-foreground/30">
                    <div
                        aria-hidden="true"
                        className={
                            controller.notes.length > 0
                                ? 'absolute left-[19px] top-5 flex items-center gap-[3px]'
                                : 'absolute left-[19px] top-[17px] flex items-center gap-[3px]'
                        }
                    >
                        <img src={titleAsset.src} alt="" className="shrink-0" />
                        <span className="text-[20px] font-medium leading-[normal]">
                            笔记{controller.notes.length > 0 ? `·${controller.notes.length}` : ''}
                        </span>
                    </div>
                    <button
                        type="button"
                        aria-label="关闭笔记"
                        className="absolute right-[11px] top-4 grid size-10 cursor-pointer place-items-center rounded-lg hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-focus"
                        onClick={onClose}
                    >
                        <img
                            src={closeAsset.src}
                            alt=""
                            className="[filter:var(--app-filter-dialog-icon)]"
                        />
                    </button>
                </header>

                <div className="min-h-[80px] flex-1 overflow-y-auto overscroll-contain px-[19px] py-5">
                    {controller.notes.length === 0 ? (
                        <div
                            data-practice-notes-empty
                            className="flex h-full min-h-[220px] flex-col items-center justify-center text-center text-hint"
                        >
                            <div className="flex max-w-full flex-col items-center md:-translate-y-12">
                                <img
                                    src={emptyAsset.src}
                                    alt=""
                                    width={156}
                                    height={104}
                                    className="shrink-0"
                                />
                                <p className="mt-3 text-[14px] font-normal leading-5">
                                    记一下你的学习笔记
                                </p>
                                <p className="mt-2.5 text-[14px] font-normal leading-5">
                                    随手记录的笔记会跟着题目一起留存
                                </p>
                            </div>
                        </div>
                    ) : (
                        <ul aria-label="本章笔记" className="space-y-3">
                            {controller.notes.map((note) => {
                                const questionIndex = questions.findIndex(
                                    (question) => question.id === note.questionId,
                                )
                                const question = questions[questionIndex]
                                if (!question) return null
                                return (
                                    <li
                                        key={note.questionId}
                                        data-practice-note={note.questionId}
                                        aria-current={
                                            editor?.questionId === note.questionId
                                                ? 'true'
                                                : undefined
                                        }
                                        className="min-w-0 rounded-xl border border-foreground/30 p-[11px]"
                                    >
                                        <div className="flex min-w-0 items-center justify-between gap-2">
                                            <div className="flex min-w-0 flex-wrap items-center gap-x-[9px] gap-y-1">
                                                <span className="flex min-w-0 items-center gap-1.5 text-[14px] font-normal leading-5 text-accent-green">
                                                    <img
                                                        src={writeAsset.src}
                                                        alt=""
                                                        className="shrink-0"
                                                    />
                                                    <span className="break-words [overflow-wrap:anywhere]">
                                                        {question.english}
                                                    </span>
                                                </span>
                                                <span className="text-caption-tight text-hint">
                                                    {getPracticeNoteAge(note.savedAt, now)}
                                                </span>
                                            </div>
                                            <div className="flex shrink-0 items-center gap-2">
                                                <button
                                                    type="button"
                                                    aria-label={`编辑第${questionIndex + 1}题的笔记`}
                                                    className="grid size-10 cursor-pointer place-items-center rounded focus-visible:outline-2 focus-visible:outline-focus md:size-[18px]"
                                                    onClick={(): void => {
                                                        controller.open(note.questionId)
                                                        setNotice('')
                                                        editorRef.current?.focus({
                                                            preventScroll: true,
                                                        })
                                                    }}
                                                >
                                                    <img src={editAsset.src} alt="" />
                                                </button>
                                                <button
                                                    type="button"
                                                    aria-label={`删除第${questionIndex + 1}题的笔记`}
                                                    className="grid size-10 cursor-pointer place-items-center rounded focus-visible:outline-2 focus-visible:outline-focus md:size-[18px]"
                                                    onClick={(): void => {
                                                        controller.remove(note.questionId)
                                                        setNotice('已删除本题笔记。')
                                                        editorRef.current?.focus({
                                                            preventScroll: true,
                                                        })
                                                    }}
                                                >
                                                    <img src={deleteAsset.src} alt="" />
                                                </button>
                                            </div>
                                        </div>
                                        <p className="mt-3 whitespace-pre-wrap break-words text-[14px] font-normal leading-5 [overflow-wrap:anywhere]">
                                            {note.text}
                                        </p>
                                    </li>
                                )
                            })}
                        </ul>
                    )}
                </div>

                <footer className="shrink-0 px-[19px] pb-[21px]">
                    <label htmlFor={editorId} className="sr-only">
                        {target ? `${target.english}的笔记` : '本题笔记'}
                    </label>
                    <div className="relative h-[100px] rounded-xl border border-accent-green/70 focus-within:border-accent-green">
                        <textarea
                            ref={editorRef}
                            id={editorId}
                            aria-describedby={countId}
                            aria-invalid={count > PRACTICE_NOTE_LIMIT || undefined}
                            data-practice-note-editor
                            value={editor?.text ?? ''}
                            maxLength={PRACTICE_NOTE_LIMIT}
                            placeholder="记一笔～"
                            className="m-0 h-full w-full cursor-text resize-none rounded-[11px] border-0 bg-transparent px-[9px] pb-8 pt-[9px] text-[16px] font-normal leading-5 text-foreground outline-none placeholder:text-hint focus-visible:outline-none md:text-caption-tight"
                            onChange={(event): void => {
                                controller.edit(event.target.value)
                                setNotice('')
                            }}
                        />
                        <span
                            id={countId}
                            className="pointer-events-none absolute bottom-[9px] right-[13px] text-[14px] font-normal leading-5 text-hint"
                        >
                            {count}/{PRACTICE_NOTE_LIMIT}
                        </span>
                    </div>
                    <div className="mt-[14px] flex items-center justify-end gap-2.5">
                        <button
                            type="button"
                            className="min-h-10 min-w-10 cursor-pointer rounded text-caption-tight text-foreground focus-visible:outline-2 focus-visible:outline-focus md:min-h-[26px] md:min-w-0"
                            onClick={(): void => {
                                controller.cancel()
                                setNotice('已取消未保存的编辑。')
                            }}
                        >
                            取消
                        </button>
                        <div className="w-[76px] shrink-0">
                            <TldButton
                                fullWidth
                                size="note-action"
                                variant="solid"
                                disabled={!controller.canSave}
                                onClick={save}
                            >
                                <span className="flex items-center gap-1">
                                    保存
                                    <span
                                        aria-hidden="true"
                                        className="hidden items-center gap-1 md:flex"
                                    >
                                        <img src={modifierAsset.src} alt="" />
                                        <img src={enterAsset.src} alt="" />
                                    </span>
                                </span>
                            </TldButton>
                        </div>
                    </div>
                    <p role="status" className="sr-only">
                        {notice}
                    </p>
                    <span className="sr-only">支持Control或Command加回车保存笔记。</span>
                </footer>
            </section>
        </TldDialog>
    )
}
