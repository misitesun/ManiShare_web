import { useState } from 'react'
import type { ReactElement } from 'react'
import {
    cancelCourseCollectionEditing,
    CourseCollectionEditActions,
    createCourseCollectionEditingState,
    deleteSelectedCourseCollectionItems,
    enterCourseCollectionEditing,
    toggleCourseCollectionItem,
} from '../../../features/edit-course-collection'
import { TldDialog } from '../../../shared/ui/tld-dialog'
import { TldPaginationStatus } from '../../../shared/ui/tld-pagination-status'
import { TldSegmentedTabs } from '../../../shared/ui/tld-segmented-tabs'
import type { TldSegmentedTabItem } from '../../../shared/ui/tld-segmented-tabs'
import { filterFavoriteItems, isFavoriteCategory } from '../model/favorite-categories'
import type { FavoriteCategory } from '../model/favorite-categories'
import { favoriteItemPages } from '../model/favorite-items'
import { useStaticFavoritePagination } from '../model/useStaticFavoritePagination'
import { FavoriteCard } from './FavoriteCard'

const favoriteTabs = [
    { id: 'all', label: '全部', panelId: 'favorites-all-panel' },
    { id: 'awakening', label: '言灵觉醒', panelId: 'favorites-awakening-panel' },
    { id: 'wisdom', label: '智慧殿堂', panelId: 'favorites-wisdom-panel' },
    { id: 'stories', label: '漫说故事', panelId: 'favorites-stories-panel' },
    { id: 'vocabulary', label: '秒记万词', panelId: 'favorites-vocabulary-panel' },
    { id: 'bootcamp', label: '入门特训', panelId: 'favorites-bootcamp-panel' },
] satisfies readonly TldSegmentedTabItem[]

function getFavoritePanelId(category: FavoriteCategory): string {
    return `favorites-${category}-panel`
}

export function FavoritesPage(): ReactElement {
    const [activeCategory, setActiveCategory] = useState<FavoriteCategory>('all')
    const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [editingState, setEditingState] = useState(createCourseCollectionEditingState)
    const { loadNextPage, status, visibleItems } = useStaticFavoritePagination(favoriteItemPages)
    const existingFavoriteItems = visibleItems.filter(
        (favoriteItem) => !editingState.deletedItemIds.includes(favoriteItem.id),
    )
    const filteredFavoriteItems = filterFavoriteItems(existingFavoriteItems, activeCategory)
    const selectedFavoriteCount = editingState.selectedItemIds.length

    function selectCategory(value: string): void {
        if (!isFavoriteCategory(value)) return

        setActiveCategory(value)
        setEditingState(cancelCourseCollectionEditing)
    }

    function enterEditing(): void {
        setEditingState(enterCourseCollectionEditing)
    }

    function cancelEditing(): void {
        setEditingState(cancelCourseCollectionEditing)
    }

    function toggleSelection(favoriteId: string): void {
        setEditingState((currentState) => toggleCourseCollectionItem(currentState, favoriteId))
    }

    function confirmDeletion(): void {
        setEditingState(deleteSelectedCourseCollectionItems)
    }

    return (
        <section
            aria-label="我的收藏"
            className="mx-auto min-w-0 px-3 pb-6 pt-5 md:px-4 xl:min-[1920px]:px-[250px]"
        >
            <header className="flex min-w-0 flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="min-w-0 max-w-full overflow-x-auto rounded-lg">
                    <div className="w-[690px]">
                        <TldSegmentedTabs
                            ariaLabel="收藏课程分类"
                            items={favoriteTabs}
                            value={activeCategory}
                            onValueChange={selectCategory}
                        />
                    </div>
                </div>
                <div className="flex shrink-0 justify-end">
                    <CourseCollectionEditActions
                        isEditing={editingState.isEditing}
                        selectedItemCount={selectedFavoriteCount}
                        onCancel={cancelEditing}
                        onDelete={(): void => setDeleteDialogOpen(true)}
                        onEdit={enterEditing}
                    />
                </div>
            </header>

            <div
                id={getFavoritePanelId(activeCategory)}
                aria-label={`${favoriteTabs.find((tab) => tab.id === activeCategory)?.label ?? '全部'}收藏`}
                className="mt-[30px]"
                role="tabpanel"
            >
                {filteredFavoriteItems.length === 0 ? (
                    <p className="py-20 text-center text-body text-muted">暂无收藏</p>
                ) : (
                    <div className="grid min-w-0 grid-cols-1 gap-x-4 gap-y-5 md:grid-cols-2 xl:min-h-[584px] xl:content-start xl:grid-cols-4 xl:min-[1920px]:grid-cols-[repeat(auto-fill,minmax(290px,1fr))]">
                        {filteredFavoriteItems.map((favoriteItem) => (
                            <FavoriteCard
                                key={favoriteItem.id}
                                favoriteItem={favoriteItem}
                                isEditing={editingState.isEditing}
                                isSelected={editingState.selectedItemIds.includes(favoriteItem.id)}
                                onToggleSelection={toggleSelection}
                            />
                        ))}
                    </div>
                )}

                <div className={status === 'idle' ? 'xl:pt-[360px]' : ''}>
                    <TldPaginationStatus status={status} onLoadNextPage={loadNextPage} />
                </div>
            </div>

            <TldDialog
                confirmLabel="确认删除"
                content={`删除后，选中的 ${selectedFavoriteCount} 个收藏将从列表移除，是否确认删除？`}
                onConfirm={confirmDeletion}
                onOpenChange={setDeleteDialogOpen}
                open={isDeleteDialogOpen}
                size="small"
                title="删除收藏"
            />
        </section>
    )
}
