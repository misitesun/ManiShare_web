import { useReducer, useState } from 'react'
import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { TldButton } from '../../../shared/ui/tld-button'
import { TldPaginationStatus } from '../../../shared/ui/tld-pagination-status'
import { TldSelect } from '../../../shared/ui/tld-select'
import { TldDialog } from '../../../shared/ui/tld-dialog'
import { TldInput } from '../../../shared/ui/tld-input'
import { TldSwitch } from '../../../shared/ui/tld-switch'
import deleteIconSource from '../assets/delete.svg'
import searchIconSource from '../assets/search.svg'
import sortIconSource from '../assets/sort.svg'
import startArrowIconSource from '../assets/start-arrow.svg'
import { initialKnowledgeGapListState, knowledgeGapListReducer } from '../model/list-state'
import { useKnowledgeGapPagination } from '../model/useKnowledgeGapPagination'
import { KnowledgeGapCard } from './KnowledgeGapCard'

export function KnowledgeGapsPage(): ReactElement {
    const { t } = useTranslation()
    const { loadNextPage, pages, status, sort, selectSort, query, changeQuery } =
        useKnowledgeGapPagination()
    const [state, dispatch] = useReducer(knowledgeGapListReducer, initialKnowledgeGapListState)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const visibleItems = state.cleared ? [] : pages.flatMap((page) => page.items)

    return (
        <section
            aria-labelledby="knowledge-gaps-page-title"
            className="mx-auto min-w-0 px-3 pb-6 pt-4 md:px-4 md:pt-6 xl:pt-[34px] xl:min-[1920px]:px-[250px]"
        >
            <header className="md:flex md:min-w-0 md:items-start md:justify-between">
                <div className="min-w-0">
                    <div className="xl:pl-[3px]">
                        <h1
                            id="knowledge-gaps-page-title"
                            className="text-page-title font-bold tracking-[0.01em] text-primary"
                        >
                            {t('knowledgeGaps.pageTitle')}
                        </h1>
                        <p className="mt-2.5 text-body text-primary/60">
                            {t('knowledgeGaps.description')}
                        </p>
                    </div>
                </div>

                <div className="mt-4 w-full md:mt-[15px] md:w-[211px]">
                    <TldButton fullWidth disabled>
                        <span>{t('knowledgeGaps.startPractice')}</span>
                        <img
                            alt=""
                            aria-hidden="true"
                            className="size-6"
                            src={startArrowIconSource}
                        />
                    </TldButton>
                </div>
            </header>

            <div className="mt-6 flex min-w-0 flex-wrap items-center gap-4 xl:mt-[42px]">
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
                    disabled={state.cleared}
                    onClick={(): void => setDeleteDialogOpen(true)}
                    className="flex h-10 w-[calc(50%-8px)] cursor-pointer items-center justify-center gap-1 rounded-xl border border-strong bg-surface text-label text-danger outline-offset-2 transition-colors duration-200 hover:border-danger hover:bg-danger-surface focus-visible:outline-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none md:w-[153px]"
                >
                    <img alt="" aria-hidden="true" className="size-5" src={deleteIconSource} />
                    <span>{t('knowledgeGaps.deleteAll')}</span>
                </button>

                <div className="ml-auto flex w-full justify-end md:w-auto">
                    <TldSwitch
                        label={t('knowledgeGaps.batchSelect')}
                        checked={state.batch}
                        disabled={state.cleared}
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
                    {state.cleared ? '暂无错题' : '没有找到匹配的错题'}
                </p>
            ) : (
                <div className={status === 'idle' ? 'xl:pt-[112px]' : ''}>
                    <TldPaginationStatus status={status} onLoadNextPage={loadNextPage} />
                </div>
            )}
            <TldDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="删除全部错题"
                content="确定删除全部错题吗？此操作会清空所有错题，包括尚未加载的条目。"
                confirmLabel="全部删除"
                cancelLabel="取消"
                onConfirm={(): void => dispatch({ type: 'clear' })}
            />
        </section>
    )
}
