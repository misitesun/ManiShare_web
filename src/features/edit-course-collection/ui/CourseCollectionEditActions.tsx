import * as React from 'react'

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
}: CourseCollectionEditActionsProps): React.ReactElement {
    const actionRef = React.useRef<HTMLButtonElement>(null)
    return (
        <div className="flex shrink-0 items-center overflow-hidden rounded border border-strong">
            <div
                inert={!isEditing}
                aria-hidden={!isEditing}
                className={
                    isEditing
                        ? 'w-[82px] shrink-0 overflow-hidden opacity-100 transition-[width,opacity] duration-200 ease-out motion-reduce:transition-none'
                        : 'pointer-events-none w-0 shrink-0 overflow-hidden opacity-0 transition-[width,opacity] duration-200 ease-out motion-reduce:transition-none'
                }
            >
                <button
                    type="button"
                    className="flex h-9 w-[82px] cursor-pointer items-center justify-center border-r border-strong text-action-label text-muted outline-none transition-colors hover:bg-surface-hover hover:text-primary focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus motion-reduce:transition-none"
                    onClick={(): void => {
                        onCancel()
                        actionRef.current?.focus()
                    }}
                >
                    取消
                </button>
            </div>
            <button
                ref={actionRef}
                type="button"
                disabled={isEditing && selectedItemCount === 0}
                className={
                    isEditing
                        ? 'flex h-9 w-20 shrink-0 cursor-pointer items-center justify-center text-action-label text-danger outline-none transition-colors hover:bg-danger-surface focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus disabled:cursor-not-allowed disabled:text-muted disabled:hover:bg-transparent motion-reduce:transition-none'
                        : 'flex h-9 w-20 shrink-0 cursor-pointer items-center justify-center text-action-label text-muted outline-none transition-colors hover:bg-surface-hover hover:text-primary focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus motion-reduce:transition-none'
                }
                onClick={isEditing ? onDelete : onEdit}
            >
                {isEditing ? '删除' : '编辑'}
            </button>
        </div>
    )
}
