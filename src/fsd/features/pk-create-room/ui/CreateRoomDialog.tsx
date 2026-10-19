'use client'

import { useId, useState } from 'react'
import type { ReactElement, ReactNode } from 'react'
import { TldDialog } from '../../../shared/ui/tld-dialog'
import { TldButton } from '../../../shared/ui/tld-button'
import { TldSelection } from '../../../shared/ui/tld-selection'
import { TldMembershipBadge } from '../../../shared/ui/tld-membership-badge'
import { TldTiltedCover } from '../../../shared/ui/tld-tilted-cover'
import {
    availableChapters,
    initialRoomDraft,
    resolveRoomCreation,
    updateRoomDraft,
} from '../model/room-configuration'
import type {
    RoomCourseOption,
    RoomCreation,
    RoomDraftAction,
    RoomAccess,
} from '../model/room-configuration'

interface CreateRoomDialogProps {
    readonly courses: readonly RoomCourseOption[]
    readonly onClose: () => void
    readonly onCreate: (configuration: RoomCreation) => void
}

function OptionTile({
    label,
    name,
    checked,
    disabled = false,
    onSelect,
}: {
    readonly label: string
    readonly name: string
    readonly checked: boolean
    readonly disabled?: boolean
    readonly onSelect: () => void
}): ReactElement {
    return (
        <label
            className={
                disabled
                    ? 'relative inline-flex h-9 w-[118px] shrink-0 cursor-not-allowed opacity-50'
                    : 'relative inline-flex h-9 w-[118px] shrink-0 cursor-pointer'
            }
        >
            <input
                type="radio"
                name={name}
                aria-label={label}
                checked={checked}
                disabled={disabled}
                onChange={onSelect}
                className="peer absolute inset-0 size-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
            />
            <span
                className={
                    checked
                        ? 'pointer-events-none flex size-full items-center justify-center rounded-lg border border-brand bg-brand/5 text-label text-brand peer-focus-visible:ring-2 peer-focus-visible:ring-focus'
                        : 'pointer-events-none flex size-full items-center justify-center rounded-lg border border-strong text-label text-primary peer-focus-visible:ring-2 peer-focus-visible:ring-focus'
                }
            >
                {label}
            </span>
        </label>
    )
}

function InlineChoice({
    label,
    name,
    checked,
    onSelect,
}: {
    readonly label: string
    readonly name: string
    readonly checked: boolean
    readonly onSelect: () => void
}): ReactElement {
    return (
        <div className="w-fit">
            <TldSelection
                type="radio"
                layout="inline"
                label={label}
                name={name}
                checked={checked}
                onCheckedChange={(selected): void => {
                    if (selected) onSelect()
                }}
            >
                <span className="text-label">{label}</span>
            </TldSelection>
        </div>
    )
}

function AccessBadge({ access }: { readonly access: RoomAccess }): ReactElement {
    return (
        <TldMembershipBadge
            size="micro"
            tone={access === 'free' ? 'trial' : access}
            label={access === 'free' ? '免费' : access === 'gold' ? '黄金VIP' : '终身VIP'}
        />
    )
}

function FieldGroup({
    title,
    children,
    extra,
}: {
    readonly title: string
    readonly children: ReactNode
    readonly extra?: ReactNode
}): ReactElement {
    return (
        <fieldset className="min-w-0">
            <legend className="mb-2 w-full text-card-title font-medium text-primary">
                <span className="flex items-center justify-between gap-2">
                    {title}
                    {extra}
                </span>
            </legend>
            {children}
        </fieldset>
    )
}

export function CreateRoomDialog({
    courses,
    onClose,
    onCreate,
}: CreateRoomDialogProps): ReactElement {
    const groupId = useId()
    const [draft, setDraft] = useState(() => initialRoomDraft(courses))
    const [showCourses, setShowCourses] = useState(false)
    const [showChapters, setShowChapters] = useState(false)
    const chapters = availableChapters(courses, draft)
    const creation = resolveRoomCreation(courses, draft)
    const selectedCount = chapters.filter(({ id }) => draft.chapterIds.includes(id)).length

    function change(action: RoomDraftAction): void {
        setDraft((previous) => updateRoomDraft(previous, action, courses))
        if (action.type === 'game' || action.type === 'course') setShowChapters(false)
    }

    function submit(): void {
        if (creation !== null) onCreate(creation)
    }

    return (
        <TldDialog
            open
            title="创建房间"
            titleAlignment="center"
            size="extra-large"
            closeLabel="关闭创建房间"
            onOpenChange={(open): void => {
                if (!open) onClose()
            }}
            footer={
                <div className="w-full max-w-[518px]">
                    <TldButton fullWidth size="large" disabled={creation === null} onClick={submit}>
                        立即创建
                    </TldButton>
                </div>
            }
        >
            <div className="space-y-3">
                <FieldGroup title="对战类型：">
                    <div className="space-y-2">
                        <OptionTile
                            name={`${groupId}-battle`}
                            label="真人对战"
                            checked={draft.battle === 'human'}
                            onSelect={(): void => change({ type: 'battle', value: 'human' })}
                        />
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <OptionTile
                                name={`${groupId}-battle`}
                                label="人机对战"
                                checked={draft.battle === 'bot'}
                                onSelect={(): void => change({ type: 'battle', value: 'bot' })}
                            />
                            <div role="group" aria-label="人机难度" className="flex gap-3">
                                <InlineChoice
                                    name={`${groupId}-difficulty`}
                                    label="困难"
                                    checked={draft.difficulty === 'hard'}
                                    onSelect={(): void =>
                                        change({ type: 'difficulty', value: 'hard' })
                                    }
                                />
                                <InlineChoice
                                    name={`${groupId}-difficulty`}
                                    label="容易"
                                    checked={draft.difficulty === 'easy'}
                                    onSelect={(): void =>
                                        change({ type: 'difficulty', value: 'easy' })
                                    }
                                />
                            </div>
                        </div>
                    </div>
                </FieldGroup>
                <FieldGroup title="游戏类型：">
                    <div className="flex flex-wrap gap-x-8 gap-y-1">
                        <InlineChoice
                            name={`${groupId}-game`}
                            label="句子游戏"
                            checked={draft.game === 'sentence'}
                            onSelect={(): void => change({ type: 'game', value: 'sentence' })}
                        />
                        <InlineChoice
                            name={`${groupId}-game`}
                            label="单词游戏"
                            checked={draft.game === 'word'}
                            onSelect={(): void => change({ type: 'game', value: 'word' })}
                        />
                    </div>
                </FieldGroup>
                <FieldGroup
                    title="选择课程："
                    extra={
                        <button
                            type="button"
                            aria-label="更多课程"
                            aria-expanded={showCourses}
                            aria-controls={`${groupId}-courses`}
                            onClick={(): void => setShowCourses((previous) => !previous)}
                            className="cursor-pointer rounded px-1 py-1 text-caption font-normal text-muted hover:text-brand focus-visible:outline-2 focus-visible:outline-focus"
                        >
                            {showCourses ? '收起' : '更多'} ›
                        </button>
                    }
                >
                    <div
                        id={`${groupId}-courses`}
                        className="grid min-w-0 grid-cols-2 gap-3 md:grid-cols-4"
                    >
                        {(showCourses ? courses : courses.slice(0, 4)).map((course, index) => (
                            <div
                                key={course.id}
                                className={
                                    draft.courseId === course.id
                                        ? 'min-w-0 overflow-hidden rounded-lg bg-surface-raised ring-1 ring-brand'
                                        : 'min-w-0 overflow-hidden rounded-lg bg-surface-raised'
                                }
                            >
                                <TldSelection
                                    type="radio"
                                    layout="card"
                                    indicatorPlacement="top"
                                    name={`${groupId}-course`}
                                    label={`选择课程 ${index + 1}：${course.title}`}
                                    checked={draft.courseId === course.id}
                                    onCheckedChange={(selected): void => {
                                        if (selected) change({ type: 'course', value: course.id })
                                    }}
                                >
                                    <span className="block min-w-0 pb-2">
                                        <span className="block aspect-[3/2] w-full">
                                            <TldTiltedCover src={course.imageSource} alt="" />
                                        </span>
                                        <span className="block space-y-1 px-1.5 pt-1">
                                            <span className="flex items-center justify-between gap-1">
                                                <span className="flex gap-1 text-[9px] text-muted">
                                                    <span className="rounded border border-subtle px-1">
                                                        标签
                                                    </span>
                                                    <span className="rounded border border-subtle px-1">
                                                        标签
                                                    </span>
                                                </span>
                                                <AccessBadge access={course.access} />
                                            </span>
                                            <span className="line-clamp-2 text-caption leading-snug text-primary">
                                                {course.title}
                                            </span>
                                        </span>
                                    </span>
                                </TldSelection>
                            </div>
                        ))}
                    </div>
                    {courses.length === 0 ? (
                        <p className="text-label text-muted">暂无可选课程</p>
                    ) : null}
                </FieldGroup>
                <FieldGroup
                    title="选择章节："
                    extra={
                        <span className="flex min-w-0 flex-1 items-center justify-between gap-1">
                            <span className="text-caption font-normal text-secondary">
                                （可多选 |{' '}
                                <span className="text-danger" aria-live="polite">
                                    已选{selectedCount}
                                </span>
                                ）
                            </span>
                            <button
                                type="button"
                                aria-label="更多章节"
                                aria-expanded={showChapters}
                                aria-controls={`${groupId}-chapters`}
                                onClick={(): void => setShowChapters((previous) => !previous)}
                                className="cursor-pointer rounded px-1 py-1 text-caption font-normal text-muted hover:text-brand focus-visible:outline-2 focus-visible:outline-focus"
                            >
                                {showChapters ? '收起' : '更多'} ›
                            </button>
                        </span>
                    }
                >
                    <div
                        id={`${groupId}-chapters`}
                        className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-3"
                    >
                        {(showChapters ? chapters : chapters.slice(0, 3)).map((chapter, index) => (
                            <div
                                key={chapter.id}
                                className={
                                    draft.chapterIds.includes(chapter.id)
                                        ? 'min-w-0 rounded-lg bg-surface-raised ring-1 ring-brand'
                                        : 'min-w-0 rounded-lg bg-surface-raised'
                                }
                            >
                                <TldSelection
                                    layout="card"
                                    indicatorPlacement="bottom"
                                    label={`选择章节 ${index + 1}：${chapter.title}`}
                                    checked={draft.chapterIds.includes(chapter.id)}
                                    onCheckedChange={(checked): void =>
                                        change({ type: 'chapter', value: chapter.id, checked })
                                    }
                                >
                                    <span className="relative block min-w-0 px-5 pb-3 pt-5">
                                        <img
                                            src={chapter.cornerSource}
                                            alt=""
                                            width={39}
                                            height={39}
                                            className="absolute left-0 top-0 size-[39px]"
                                        />
                                        <img
                                            src={chapter.iconSource}
                                            alt=""
                                            width={16}
                                            height={16}
                                            className="absolute left-1 top-1 size-4"
                                        />
                                        <span className="absolute right-1 top-1 rounded bg-surface-hover px-1 text-caption text-muted">
                                            #{index + 1}
                                        </span>
                                        <span className="line-clamp-2 text-label leading-snug text-primary">
                                            {chapter.title}
                                        </span>
                                        <span className="mt-1 flex items-center justify-between gap-1 pr-6">
                                            <span className="truncate text-caption text-muted">
                                                {chapter.translation}
                                            </span>
                                            <AccessBadge access={chapter.access} />
                                        </span>
                                    </span>
                                </TldSelection>
                            </div>
                        ))}
                    </div>
                    {chapters.length === 0 ? (
                        <p className="text-label text-muted">该课程暂无此游戏类型的章节</p>
                    ) : null}
                </FieldGroup>
                <FieldGroup title="模式：">
                    <div className="space-y-2">
                        {(['translation', 'dictation'] as const).map((mode) => (
                            <div key={mode} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                <OptionTile
                                    name={`${groupId}-mode`}
                                    label={mode === 'translation' ? '中译英模式' : '听写模式'}
                                    checked={draft.mode === mode}
                                    onSelect={(): void => change({ type: 'mode', value: mode })}
                                />
                                <div
                                    role="group"
                                    aria-label={
                                        mode === 'translation' ? '中译英书写方式' : '听写书写方式'
                                    }
                                    className="flex gap-3"
                                >
                                    {(['recall', 'copy'] as const).map((writing) => (
                                        <InlineChoice
                                            key={writing}
                                            name={`${groupId}-${mode}-writing`}
                                            label={writing === 'recall' ? '默写' : '抄写'}
                                            checked={
                                                (mode === 'translation'
                                                    ? draft.translationWriting
                                                    : draft.dictationWriting) === writing
                                            }
                                            onSelect={(): void =>
                                                change({ type: 'writing', mode, value: writing })
                                            }
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                        <OptionTile
                            name={`${groupId}-mode`}
                            label="选词拼块"
                            disabled={draft.game === 'word'}
                            checked={draft.mode === 'puzzle'}
                            onSelect={(): void => change({ type: 'mode', value: 'puzzle' })}
                        />
                    </div>
                </FieldGroup>
                <FieldGroup title="主题背景：">
                    <div className="flex gap-3">
                        <InlineChoice
                            name={`${groupId}-background`}
                            label="默认"
                            checked={draft.background === 'default'}
                            onSelect={(): void => change({ type: 'background', value: 'default' })}
                        />
                        <InlineChoice
                            name={`${groupId}-background`}
                            label="闪电"
                            checked={draft.background === 'lightning'}
                            onSelect={(): void =>
                                change({ type: 'background', value: 'lightning' })
                            }
                        />
                    </div>
                </FieldGroup>
                {creation === null ? (
                    <p role="status" className="text-caption text-warning">
                        请选择课程及至少一个当前题型的章节。
                    </p>
                ) : null}
            </div>
        </TldDialog>
    )
}
