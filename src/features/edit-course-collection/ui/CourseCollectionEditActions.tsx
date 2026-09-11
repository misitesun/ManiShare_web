import type { ReactElement } from 'react'

export interface CourseCollectionEditActionsProps {
    readonly isEditing: boolean
    readonly onCancel: () => void
    readonly onDelete: () => void
    readonly onEdit: () => void
    readonly selectedItemCount: number
}

export function CourseCollectionEditActions({
    isEditing,
    onCancel,
    onDelete,
    onEdit,
    selectedItemCount,
}: CourseCollectionEditActionsProps): ReactElement {
    if (!isEditing) {
        return (
            <button
                type="button"
                className="flex h-[38px] w-[82px] cursor-pointer items-center justify-center rounded border border-strong text-action-label text-muted transition-colors hover:bg-surface-hover hover:text-primary"
                onClick={onEdit}
            >
                编辑
            </button>
        )
    }

    return (
        <div className="flex shrink-0 items-center gap-3">
            <button
                type="button"
                className="flex h-[38px] w-[82px] cursor-pointer items-center justify-center rounded border border-strong text-action-label text-muted transition-colors hover:bg-surface-hover hover:text-primary"
                onClick={onCancel}
            >
                取消
            </button>
            <button
                type="button"
                disabled={selectedItemCount === 0}
                className={
                    selectedItemCount === 0
                        ? 'flex h-[38px] w-[82px] cursor-not-allowed items-center justify-center rounded border border-strong text-action-label text-muted'
                        : 'flex h-[38px] w-[82px] cursor-pointer items-center justify-center rounded border border-danger text-action-label text-danger transition-colors hover:bg-danger-surface'
                }
                onClick={onDelete}
            >
                删除
            </button>
        </div>
    )
}
