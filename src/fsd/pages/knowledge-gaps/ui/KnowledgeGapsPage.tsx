'use client'

import { useReducer, useState } from 'react'
import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { TldButton } from '../../../shared/ui/tld-button'
import { TldPaginationStatus } from '../../../shared/ui/tld-pagination-status'
import { TldSelect } from '../../../shared/ui/tld-select'
import { TldDialog } from '../../../shared/ui/tld-dialog'
import { TldInput } from '../../../shared/ui/tld-input'
import { TldSwitch } from '../../../shared/ui/tld-switch'
import { TldSegmentedTabs } from '../../../shared/ui/tld-segmented-tabs'
import deleteIconSourceAsset from '../assets/delete.svg'
import searchIconSourceAsset from '../assets/search.svg'
import sortIconSourceAsset from '../assets/sort.svg'
import startArrowIconSourceAsset from '../assets/start-arrow.svg'
import { initialKnowledgeGapListState, knowledgeGapListReducer } from '../model/list-state'
import { useKnowledgeGapPagination } from '../model/useKnowledgeGapPagination'
import { KnowledgeGapCard } from './KnowledgeGapCard'
import {
    getKnowledgeGapCategoryPages,
    isKnowledgeGapCategoryId,
    knowledgeGapCategories,
} from '../model/categories'
import type { KnowledgeGapCategoryId } from '../model/categories'

const deleteIconSource: string = deleteIconSourceAsset.src
const searchIconSource: string = searchIconSourceAsset.src
const sortIconSource: string = sortIconSourceAsset.src
const startArrowIconSource: string = startArrowIconSourceAsset.src

export function KnowledgeGapsPage(): ReactElement {
    const { t } = useTranslation()
    const [state, dispatch] = useReducer(knowledgeGapListReducer, initialKnowledgeGapListState)
    const [deleteCategoryId, setDeleteCategoryId] = useState<KnowledgeGapCategoryId | null>(null)
    const categoryPages = getKnowledgeGapCategoryPages(state.categoryId, state.clearedCategoryIds)
    const { loadNextPage, pages, status, sort, selectSort, query, changeQuery, resetPagination } =
        useKnowledgeGapPagination(categoryPages)
    const visibleItems = pages.flatMap((page) => page.items)
    const hasCategoryItems = categoryPages.some((page) => page.items.length > 0)
    const activeCategory = knowledgeGapCategories.find(
        (category) => category.id === state.categoryId,
    )
    const deleteCategory = knowledgeGapCategories.find(
        (category) => category.id === deleteCategoryId,
    )

    function selectCategory(value: string): void {
        if (!isKnowledgeGapCategoryId(value) || value === state.categoryId) return
        resetPagination()
        dispatch({ type: 'category', categoryId: value })
    }

    return (
        <section
            aria-labelledby="knowledge-gaps-page-title"
            className="mx-auto min-w-0 px-3 pb-6 pt-4 md:px-4 md:pt-6 xl:pt-[34px] xl:min-[1920px]:px-[254px]"
        >
            <header className="md:flex md:min-w-0 md:items-start md:justify-between">
                <div className="min-w-0">
                    <div>
                        <h1
                            id="knowledge-gaps-page-title"
                            className="text-page-title font-bold tracking-[0.01em] text-primary"
                        >
                            {t('knowledgeGaps.pageTitle')}
                        </h1>
                        <p className="mt-2.5 text-body-tight text-primary/60">
                            巩固知识，消灭薄弱点！
                        </p>
                    </div>
                </div>

                <div className="mt-4 w-full md:mt-[15px] md:w-[211px]">
                    <TldButton fullWidth disabled>
                        <span className="text-action-label-compact font-medium">
                            {t('knowledgeGaps.startPractice')}
                        </span>
                        <img
                            alt=""
                            aria-hidden="true"
                            className="size-6"
                            src={startArrowIconSource}
                        />
                    </TldButton>
                </div>
            </header>

            <div className="mt-2 min-w-0 overflow-x-auto overflow-y-hidden pb-1 [scrollbar-width:none] xl:mt-1.5 [&::-webkit-scrollbar]:hidden">
                <TldSegmentedTabs
                    activeTextTone="primary"
                    ariaLabel="查漏补缺分类"
                    gap="compact"
                    indicatorThickness="medium"
                    indicatorTone="accent-green"
                    indicatorWidth="item"
                    items={knowledgeGapCategories}
                    semantics="filter"
                    showBaseline={false}
                    size="compact"
                    typography="compact"
                    value={state.categoryId}
                    variant="underline"
                    onValueChange={selectCategory}
                />
            </div>

            <div className="mt-4 flex min-w-0 flex-wrap items-center gap-4">
                <div className="w-full min-w-0 md:flex-1 xl:w-[322px] xl:flex-none">
                    <TldInput
                        label={t('knowledgeGaps.searchLabel')}
                        type="search"
                        value={query}
                        onChange={(event): void => changeQuery(event.currentTarget.value)}
                        placeholder="搜索错题内容"
                        icon={
                            <img
                                alt=""
                                aria-hidden="true"
                                className="size-5 shrink-0 rounded-full bg-icon-contrast"
                                src={searchIconSource}
                            />
                        }
                    />
                </div>

                <div className="w-[calc(50%-8px)] md:w-[153px]">
                    <TldSelect
                        label="错题排序"
                        value={sort}
                        onValueChange={selectSort}
                        options={[
                            { value: 'createdAt', label: '创建日期' },
                            { value: 'mistakeCount', label: '错误次数' },
                        ]}
                        icon={
                            <img
                                alt=""
                                aria-hidden="true"
                                className="size-5 rotate-90 [filter:var(--app-filter-shell-icon)]"
                                src={sortIconSource}
                            />
                        }
                    />
                </div>

                <button
                    type="button"
                    disabled={!hasCategoryItems}
                    onClick={(): void => setDeleteCategoryId(state.categoryId)}
                    className="flex h-10 w-[calc(50%-8px)] cursor-pointer items-center justify-center gap-1 rounded-xl border border-strong bg-surface text-label text-danger outline-offset-2 transition-colors duration-200 hover:border-danger hover:bg-danger-surface focus-visible:outline-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none md:w-[153px]"
                >
                    <img alt="" aria-hidden="true" className="size-5" src={deleteIconSource} />
                    <span>{t('knowledgeGaps.deleteAll')}</span>
                </button>

                <div className="ml-auto flex w-full justify-end md:w-auto xl:mb-0.5 xl:self-end">
                    <TldSwitch
                        label={t('knowledgeGaps.batchSelect')}
                        size="compact"
                        checked={state.batch}
                        disabled={!hasCategoryItems}
                        onCheckedChange={(checked): void => dispatch({ type: 'batch', checked })}
                    />
                </div>
            </div>

            <div className="mt-[25px] grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 xl:min-[1920px]:grid-cols-[repeat(auto-fill,minmax(380px,1fr))]">
                {visibleItems.map((item) => (
                    <KnowledgeGapCard
                        key={item.id}
                        item={item}
                        batch={state.batch}
                        selected={state.selectedIds.includes(item.id)}
                        onSelectedChange={(checked): void =>
                            dispatch({ type: 'select', id: item.id, checked })
                        }
                    />
                ))}
            </div>

            {visibleItems.length === 0 ? (
                <p role="status" className="py-16 text-center text-body text-primary/60">
                    {hasCategoryItems ? '没有找到匹配的内容' : activeCategory?.emptyLabel}
                </p>
            ) : (
                <div className={status === 'idle' ? 'xl:pt-[112px]' : ''}>
                    <TldPaginationStatus status={status} onLoadNextPage={loadNextPage} />
                </div>
            )}
            <TldDialog
                open={deleteCategoryId !== null}
                onOpenChange={(open): void => {
                    if (!open) setDeleteCategoryId(null)
                }}
                title={`删除${deleteCategory?.label ?? '当前分类'}全部内容`}
                content={`确定删除“${deleteCategory?.label ?? '当前分类'}”的全部内容吗？包括尚未加载的条目，仅清空当前分类。`}
                confirmLabel="全部删除"
                cancelLabel="取消"
                onConfirm={(): void => {
                    if (deleteCategoryId === null) return
                    dispatch({ type: 'clear', categoryId: deleteCategoryId })
                }}
            />
        </section>
    )
}
