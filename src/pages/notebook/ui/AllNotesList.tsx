import { useState } from 'react'
import type { ReactElement } from 'react'
import { TldDialog } from '../../../shared/ui/tld-dialog'
import { TldPaginationStatus } from '../../../shared/ui/tld-pagination-status'
import addRecordIconSource from '../assets/add-record.svg'
import deleteGroupIconSource from '../assets/delete-group.svg'
import deleteRecordIconSource from '../assets/delete-record.svg'
import editRecordIconSource from '../assets/edit-record.svg'
import { deleteNotebookTarget, initialNotebookDeletionState } from '../model/notebook-deletion'
import type { NotebookDeleteTarget } from '../model/notebook-deletion'
import { notebookGroupPages } from '../model/notebook-items'
import type { NotebookGroup, NotebookRecord } from '../model/notebook-items'
import { useStaticPagination } from '../model/useStaticPagination'

interface NotebookRecordRowProps {
    readonly onRequestDelete: (recordId: string) => void
    readonly record: NotebookRecord
}

interface NotebookGroupCardProps {
    readonly deletedRecordIds: readonly string[]
    readonly group: NotebookGroup
    readonly onRequestDeleteGroup: (groupId: string) => void
    readonly onRequestDeleteRecord: (recordId: string) => void
}

function NotebookRecordRow({ onRequestDelete, record }: NotebookRecordRowProps): ReactElement {
    return (
        <div className="flex min-h-[78px] min-w-0 items-center justify-between gap-3 rounded-lg bg-surface-raised px-3 py-3 text-body text-primary/60">
            <div className="min-w-0 space-y-1.5">
                {record.lines.map((line) => (
                    <p key={line.id} className="break-words">
                        {line.text}
                    </p>
                ))}
            </div>
            <div className="flex shrink-0 items-center gap-3">
                <button
                    type="button"
                    aria-label="编辑这条笔记"
                    className="grid size-[22px] cursor-pointer place-items-center"
                >
                    <img
                        alt=""
                        aria-hidden="true"
                        className="size-[22px]"
                        src={editRecordIconSource}
                    />
                </button>
                <button
                    type="button"
                    aria-label="删除这条笔记"
                    className="grid size-[22px] cursor-pointer place-items-center"
                    onClick={(): void => onRequestDelete(record.id)}
                >
                    <img
                        alt=""
                        aria-hidden="true"
                        className="size-[22px]"
                        src={deleteRecordIconSource}
                    />
                </button>
            </div>
        </div>
    )
}

function NotebookGroupCard({
    deletedRecordIds,
    group,
    onRequestDeleteGroup,
    onRequestDeleteRecord,
}: NotebookGroupCardProps): ReactElement {
    const visibleRecords = group.records.filter((record) => !deletedRecordIds.includes(record.id))

    return (
        <article className="min-w-0 rounded-xl border border-primary/30 p-3 md:p-[15px]">
            <header className="min-w-0 md:flex md:items-center md:justify-between md:gap-6">
                <div
                    className={
                        group.isMuted === true
                            ? 'min-w-0 space-y-[15px] text-section-title text-primary/60'
                            : 'min-w-0 space-y-[15px] text-section-title text-primary'
                    }
                >
                    <p className="break-words">
                        <span className="font-medium">句子：</span>
                        {group.sentence}
                    </p>
                    <p className="break-words">
                        <span className="font-medium">翻译：</span>
                        {group.translation}
                    </p>
                </div>

                <div className="mt-4 flex shrink-0 items-center gap-3 md:mt-0 md:gap-4">
                    <button
                        type="button"
                        className="flex h-8 w-[88px] cursor-pointer items-center justify-center gap-1 rounded border border-primary/50 text-label text-primary"
                    >
                        <img
                            alt=""
                            aria-hidden="true"
                            className="size-5 [filter:var(--app-filter-shell-icon)]"
                            src={addRecordIconSource}
                        />
                        <span>添加记录</span>
                    </button>
                    <button
                        type="button"
                        className="flex h-8 w-[88px] cursor-pointer items-center justify-center gap-1 rounded border border-danger text-label text-danger"
                        onClick={(): void => onRequestDeleteGroup(group.id)}
                    >
                        <img
                            alt=""
                            aria-hidden="true"
                            className="size-5"
                            src={deleteGroupIconSource}
                        />
                        <span>删除</span>
                    </button>
                </div>
            </header>

            <div className="mt-4 space-y-3">
                {visibleRecords.map((record) => (
                    <NotebookRecordRow
                        key={record.id}
                        record={record}
                        onRequestDelete={onRequestDeleteRecord}
                    />
                ))}
            </div>
        </article>
    )
}

export function AllNotesList(): ReactElement {
    const { loadNextPage, status, visibleItems } = useStaticPagination(notebookGroupPages)
    const [deleteTarget, setDeleteTarget] = useState<NotebookDeleteTarget | null>(null)
    const [deletionState, setDeletionState] = useState(initialNotebookDeletionState)
    const visibleGroups = visibleItems.filter(
        (group) => !deletionState.deletedGroupIds.includes(group.id),
    )

    function requestGroupDeletion(groupId: string): void {
        setDeleteTarget({ groupId, kind: 'group' })
    }

    function requestRecordDeletion(recordId: string): void {
        setDeleteTarget({ kind: 'record', recordId })
    }

    function handleDialogOpenChange(open: boolean): void {
        if (!open) setDeleteTarget(null)
    }

    function confirmDeletion(): void {
        if (deleteTarget === null) return
        setDeletionState((currentState) => deleteNotebookTarget(currentState, deleteTarget))
    }

    return (
        <div>
            <div className="space-y-4">
                {visibleGroups.map((group) => (
                    <NotebookGroupCard
                        key={group.id}
                        deletedRecordIds={deletionState.deletedRecordIds}
                        group={group}
                        onRequestDeleteGroup={requestGroupDeletion}
                        onRequestDeleteRecord={requestRecordDeletion}
                    />
                ))}
            </div>
            <div className={status === 'idle' ? 'xl:pt-[112px]' : ''}>
                <TldPaginationStatus status={status} onLoadNextPage={loadNextPage} />
            </div>

            <TldDialog
                confirmLabel="确认删除"
                content={
                    deleteTarget?.kind === 'group'
                        ? '删除后，该句子下的全部笔记记录将无法恢复，是否确认删除？'
                        : '删除后，这条笔记记录将无法恢复，是否确认删除？'
                }
                onConfirm={confirmDeletion}
                onOpenChange={handleDialogOpenChange}
                open={deleteTarget !== null}
                size="small"
                title={deleteTarget?.kind === 'group' ? '删除笔记组' : '删除笔记记录'}
            />
        </div>
    )
}
