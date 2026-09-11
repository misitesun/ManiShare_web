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
import { useStaticWorkPagination } from '../model/useStaticWorkPagination'
import { workItemPages } from '../model/work-items'
import { WorkCard } from './WorkCard'

type WorksView = 'shared' | 'unshared'

const sharedPanelId = 'works-shared-panel'
const unsharedPanelId = 'works-unshared-panel'

const worksTabs = [
    { id: 'shared', label: '共享', panelId: sharedPanelId },
    { id: 'unshared', label: '不共享', panelId: unsharedPanelId },
] satisfies readonly TldSegmentedTabItem[]

export function WorksPage(): ReactElement {
    const [activeView, setActiveView] = useState<WorksView>('shared')
    const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [editingState, setEditingState] = useState(createCourseCollectionEditingState)
    const { loadNextPage, status, visibleItems } = useStaticWorkPagination(workItemPages)
    const visibleWorkItems = visibleItems.filter(
        (workItem) => !editingState.deletedItemIds.includes(workItem.id),
    )
    const selectedWorkCount = editingState.selectedItemIds.length

    function selectView(value: string): void {
        if (value !== 'shared' && value !== 'unshared') return

        setActiveView(value)
        setEditingState(cancelCourseCollectionEditing)
    }

    function enterEditing(): void {
        setEditingState(enterCourseCollectionEditing)
    }

    function cancelEditing(): void {
        setEditingState(cancelCourseCollectionEditing)
    }

    function toggleSelection(workId: string): void {
        setEditingState((currentState) => toggleCourseCollectionItem(currentState, workId))
    }

    function confirmDeletion(): void {
        setEditingState(deleteSelectedCourseCollectionItems)
    }

    const activePanelId = activeView === 'shared' ? sharedPanelId : unsharedPanelId

    return (
        <section
            aria-label="我的作品"
            className="mx-auto min-w-0 px-3 pb-6 pt-5 md:px-4 xl:min-[1920px]:px-[250px]"
        >
            <header className="flex min-w-0 flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="w-[230px] min-w-0">
                    <TldSegmentedTabs
                        ariaLabel="作品共享方式"
                        items={worksTabs}
                        value={activeView}
                        onValueChange={selectView}
                    />
                </div>
                <div className="flex shrink-0 justify-end">
                    <CourseCollectionEditActions
                        isEditing={editingState.isEditing}
                        selectedItemCount={selectedWorkCount}
                        onCancel={cancelEditing}
                        onDelete={(): void => setDeleteDialogOpen(true)}
                        onEdit={enterEditing}
                    />
                </div>
            </header>

            <div
                id={activePanelId}
                aria-label={activeView === 'shared' ? '共享作品管理列表' : '不共享作品管理列表'}
                className="mt-[30px]"
                role="tabpanel"
            >
                {visibleWorkItems.length === 0 ? (
                    <p className="py-20 text-center text-body text-muted">暂无作品</p>
                ) : (
                    <div className="grid min-w-0 grid-cols-1 gap-x-4 gap-y-5 md:grid-cols-2 xl:grid-cols-4 xl:min-[1920px]:grid-cols-[repeat(auto-fill,minmax(290px,1fr))]">
                        {visibleWorkItems.map((workItem) => (
                            <WorkCard
                                key={workItem.id}
                                isEditing={editingState.isEditing}
                                isSelected={editingState.selectedItemIds.includes(workItem.id)}
                                workItem={workItem}
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
                content={`删除后，选中的 ${selectedWorkCount} 个作品将无法恢复，是否确认删除？`}
                onConfirm={confirmDeletion}
                onOpenChange={setDeleteDialogOpen}
                open={isDeleteDialogOpen}
                size="small"
                title="删除作品"
            />
        </section>
    )
}
