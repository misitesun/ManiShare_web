import type { ReactElement } from 'react'
import { CourseCollectionSelectionOverlay } from '../../../features/edit-course-collection'
import type { FavoriteItem } from '../model/favorite-items'

export interface FavoriteCardProps {
    readonly favoriteItem: FavoriteItem
    readonly isEditing: boolean
    readonly isSelected: boolean
    readonly onToggleSelection: (favoriteId: string) => void
}

export function FavoriteCard({
    favoriteItem,
    isEditing,
    isSelected,
    onToggleSelection,
}: FavoriteCardProps): ReactElement {
    return (
        <article className="relative min-w-0 overflow-hidden rounded-xl bg-surface-raised">
            <div className="h-[200px] overflow-hidden rounded-t-xl">
                <img
                    alt=""
                    aria-hidden="true"
                    className="size-full object-cover"
                    src={favoriteItem.imageSource}
                />
            </div>

            <div className="flex h-[82px] min-w-0 flex-col px-2.5 py-2.5">
                <div className="flex min-w-0 items-center justify-between gap-2">
                    <h2 className="min-w-0 truncate text-card-title font-medium text-primary">
                        {favoriteItem.title}
                    </h2>
                    <span
                        className={
                            favoriteItem.categoryTone === 'awakening'
                                ? 'flex h-[30px] w-[120px] shrink-0 items-center justify-center truncate rounded-lg border border-accent-green/30 px-2 text-label text-accent-green'
                                : favoriteItem.categoryTone === 'blue'
                                  ? 'flex h-[30px] w-[120px] shrink-0 items-center justify-center truncate rounded-lg border border-accent-blue/30 px-2 text-label text-accent-blue'
                                  : favoriteItem.categoryTone === 'cyan'
                                    ? 'flex h-[30px] w-[120px] shrink-0 items-center justify-center truncate rounded-lg border border-accent-cyan/30 px-2 text-label text-accent-cyan'
                                    : favoriteItem.categoryTone === 'magenta'
                                      ? 'flex h-[30px] w-[120px] shrink-0 items-center justify-center truncate rounded-lg border border-accent-magenta/30 px-2 text-label text-accent-magenta'
                                      : favoriteItem.categoryTone === 'stories'
                                        ? 'flex h-[30px] w-[120px] shrink-0 items-center justify-center truncate rounded-lg border border-accent-orange/30 px-2 text-label text-accent-orange'
                                        : 'flex h-[30px] w-[120px] shrink-0 items-center justify-center truncate rounded-lg border border-brand-start/30 px-2 text-label text-brand-start'
                        }
                    >
                        {favoriteItem.categoryLabel}
                    </span>
                </div>
                <p className="mt-1 text-body text-primary/60">共{favoriteItem.noteCount}条笔记</p>
            </div>

            {isEditing ? (
                <CourseCollectionSelectionOverlay
                    label={`${isSelected ? '取消选择' : '选择'}收藏：${favoriteItem.title}`}
                    selected={isSelected}
                    onToggle={(): void => onToggleSelection(favoriteItem.id)}
                />
            ) : null}
        </article>
    )
}
