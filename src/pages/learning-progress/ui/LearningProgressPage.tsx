import { useState } from 'react'
import type { ReactElement } from 'react'
import { TldDialog } from '../../../shared/ui/tld-dialog'
import { TldPaginationStatus } from '../../../shared/ui/tld-pagination-status'
import { TldSegmentedTabs } from '../../../shared/ui/tld-segmented-tabs'
import type { TldSegmentedTabItem } from '../../../shared/ui/tld-segmented-tabs'
import { appendDeletedLearningProgressId } from '../model/learning-progress-deletion'
import { getLearningProgressPages } from '../model/learning-progress-items'
import type {
    LearningProgressCategory,
    LearningProgressItem,
} from '../model/learning-progress-items'
import { useLearningProgressPagination } from '../model/useLearningProgressPagination'
import { LearningProgressCard } from './LearningProgressCard'

const learningProgressTabs = [
    { id: 'all', label: '全部', panelId: 'learning-progress-all-panel' },
    { id: 'awakening', label: '言灵觉醒', panelId: 'learning-progress-awakening-panel' },
    { id: 'wisdom', label: '智慧殿堂', panelId: 'learning-progress-wisdom-panel' },
    { id: 'stories', label: '漫说故事', panelId: 'learning-progress-stories-panel' },
    { id: 'vocabulary', label: '秒记万词', panelId: 'learning-progress-vocabulary-panel' },
    { id: 'bootcamp', label: '入门特训', panelId: 'learning-progress-bootcamp-panel' },
] satisfies readonly TldSegmentedTabItem[]

function isLearningProgressCategory(value: string): value is LearningProgressCategory {
    return (
        value === 'all' ||
        value === 'awakening' ||
        value === 'wisdom' ||
        value === 'stories' ||
        value === 'vocabulary' ||
        value === 'bootcamp'
    )
}

function getPanelId(category: LearningProgressCategory): string {
    const activeTab = learningProgressTabs.find((tab) => tab.id === category)
    return activeTab?.panelId ?? 'learning-progress-all-panel'
}

export function LearningProgressPage(): ReactElement {
    const [activeCategory, setActiveCategory] = useState<LearningProgressCategory>('all')
    const [deletedItemIds, setDeletedItemIds] = useState<readonly string[]>([])
    const [deleteTarget, setDeleteTarget] = useState<LearningProgressItem | null>(null)
    const pages = getLearningProgressPages(activeCategory)
    const { loadNextPage, status, visibleItems } = useLearningProgressPagination(pages)
    const remainingItems = visibleItems.filter((item) => !deletedItemIds.includes(item.id))

    function selectCategory(value: string): void {
        if (isLearningProgressCategory(value)) setActiveCategory(value)
    }

    function handleDialogOpenChange(open: boolean): void {
        if (!open) setDeleteTarget(null)
    }

    function confirmDeletion(): void {
        if (deleteTarget === null) return
        setDeletedItemIds((currentIds) =>
            appendDeletedLearningProgressId(currentIds, deleteTarget.id),
        )
    }

    return (
        <section
            aria-label="学习进度"
            className="mx-auto min-w-0 px-3 pb-6 pt-4 md:px-4 md:pt-5 xl:min-[1920px]:px-[250px]"
        >
            <div className="min-w-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <div className="w-full min-w-[690px] xl:w-[690px]">
                    <TldSegmentedTabs
                        ariaLabel="学习进度分类"
                        items={learningProgressTabs}
                        value={activeCategory}
                        onValueChange={selectCategory}
                    />
                </div>
            </div>

            <div
                id={getPanelId(activeCategory)}
                aria-label={`${learningProgressTabs.find((tab) => tab.id === activeCategory)?.label ?? '全部'}学习进度`}
                className="mt-5"
                role="tabpanel"
            >
                {remainingItems.length === 0 ? (
                    <p className="flex min-h-[250px] items-center justify-center rounded-xl border border-primary/30 text-body text-muted">
                        该分类暂无学习进度
                    </p>
                ) : (
                    <div className="space-y-4">
                        {remainingItems.map((item) => (
                            <LearningProgressCard
                                key={item.id}
                                item={item}
                                onRequestDelete={setDeleteTarget}
                            />
                        ))}
                    </div>
                )}
            </div>

            {visibleItems.length === 0 ? null : (
                <div className={status === 'idle' ? 'xl:pt-40' : ''}>
                    <TldPaginationStatus status={status} onLoadNextPage={loadNextPage} />
                </div>
            )}

            <TldDialog
                confirmLabel="确认删除"
                content={
                    deleteTarget === null
                        ? undefined
                        : `删除“${deleteTarget.title}”的学习进度后将无法恢复，是否确认删除？`
                }
                onConfirm={confirmDeletion}
                onOpenChange={handleDialogOpenChange}
                open={deleteTarget !== null}
                size="small"
                title="删除学习进度"
            />
        </section>
    )
}
