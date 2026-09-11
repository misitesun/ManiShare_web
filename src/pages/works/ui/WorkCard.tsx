import type { ReactElement } from 'react'
import { CourseCollectionSelectionOverlay } from '../../../features/edit-course-collection'
import type { WorkItem } from '../model/work-items'

export interface WorkCardProps {
    readonly isEditing: boolean
    readonly isSelected: boolean
    readonly onToggleSelection: (workId: string) => void
    readonly workItem: WorkItem
}

export function WorkCard({
    isEditing,
    isSelected,
    onToggleSelection,
    workItem,
}: WorkCardProps): ReactElement {
    const sharingLabel = workItem.sharingStatus === 'shared' ? '共享' : '不共享'

    return (
        <article className="relative min-w-0 overflow-hidden rounded-xl bg-surface-raised">
            <div className="relative h-[200px] overflow-hidden rounded-t-xl">
                <img
                    alt=""
                    aria-hidden="true"
                    className="size-full object-cover"
                    src={workItem.imageSource}
                />
                <span
                    className={
                        workItem.sharingStatus === 'shared'
                            ? 'absolute left-0 top-0 flex h-[38px] w-[76px] items-center justify-center rounded-br-xl bg-accent-green text-action-label text-inverse'
                            : 'absolute left-0 top-0 flex h-[38px] w-[76px] items-center justify-center rounded-br-xl bg-danger text-action-label text-inverse'
                    }
                >
                    {sharingLabel}
                </span>
            </div>

            <div className="flex h-[82px] min-w-0 flex-col px-2.5 py-2.5">
                <div className="flex min-w-0 items-center justify-between gap-2">
                    <h2 className="min-w-0 truncate text-card-title font-medium text-primary">
                        {workItem.title}
                    </h2>
                    <span
                        className={
                            workItem.categoryTone === 'awakening'
                                ? 'flex h-[30px] w-[120px] shrink-0 items-center justify-center truncate rounded-lg border border-accent-green/30 px-2 text-label text-accent-green'
                                : workItem.categoryTone === 'blue'
                                  ? 'flex h-[30px] w-[120px] shrink-0 items-center justify-center truncate rounded-lg border border-accent-blue/30 px-2 text-label text-accent-blue'
                                  : workItem.categoryTone === 'cyan'
                                    ? 'flex h-[30px] w-[120px] shrink-0 items-center justify-center truncate rounded-lg border border-accent-cyan/30 px-2 text-label text-accent-cyan'
                                    : workItem.categoryTone === 'magenta'
                                      ? 'flex h-[30px] w-[120px] shrink-0 items-center justify-center truncate rounded-lg border border-accent-magenta/30 px-2 text-label text-accent-magenta'
                                      : workItem.categoryTone === 'stories'
                                        ? 'flex h-[30px] w-[120px] shrink-0 items-center justify-center truncate rounded-lg border border-accent-orange/30 px-2 text-label text-accent-orange'
                                        : 'flex h-[30px] w-[120px] shrink-0 items-center justify-center truncate rounded-lg border border-brand-start/30 px-2 text-label text-brand-start'
                        }
                    >
                        {workItem.categoryLabel}
                    </span>
                </div>
                <p className="mt-1 text-body text-primary/60">共{workItem.noteCount}条笔记</p>
            </div>

            {isEditing ? (
                <CourseCollectionSelectionOverlay
                    label={`${isSelected ? '取消选择' : '选择'}作品：${workItem.title}`}
                    selected={isSelected}
                    onToggle={(): void => onToggleSelection(workItem.id)}
                />
            ) : null}
        </article>
    )
}
