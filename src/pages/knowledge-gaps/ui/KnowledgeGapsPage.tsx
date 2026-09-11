import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { TldButton } from '../../../shared/ui/tld-button'
import { TldPaginationStatus } from '../../../shared/ui/tld-pagination-status'
import chevronDownIconSource from '../assets/chevron-down.svg'
import deleteIconSource from '../assets/delete.svg'
import searchIconSource from '../assets/search.svg'
import sortIconSource from '../assets/sort.svg'
import startArrowIconSource from '../assets/start-arrow.svg'
import toggleIconSource from '../assets/toggle.svg'
import { useKnowledgeGapPagination } from '../model/useKnowledgeGapPagination'
import { KnowledgeGapCard } from './KnowledgeGapCard'

export function KnowledgeGapsPage(): ReactElement {
    const { t } = useTranslation()
    const { loadNextPage, pages, status } = useKnowledgeGapPagination()
    const visibleItems = pages.flatMap((page) => page.items)

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
                <label className="flex h-10 w-full min-w-0 items-center gap-1.5 rounded-lg border border-primary/50 px-2 md:flex-1 xl:w-[322px] xl:flex-none">
                    <span className="sr-only">{t('knowledgeGaps.searchLabel')}</span>
                    <img
                        alt=""
                        aria-hidden="true"
                        className="size-5 shrink-0 rounded-full bg-icon-contrast"
                        src={searchIconSource}
                    />
                    <input
                        readOnly
                        className="min-w-0 flex-1 bg-transparent text-label text-primary outline-none placeholder:text-primary/60"
                        placeholder={t('knowledgeGaps.searchPlaceholder')}
                        type="search"
                    />
                </label>

                <button
                    type="button"
                    disabled
                    className="flex h-10 w-[calc(50%-8px)] cursor-default items-center justify-center gap-1 rounded-lg border border-primary/50 text-label text-primary md:w-[153px]"
                >
                    <img
                        alt=""
                        aria-hidden="true"
                        className="size-5 rotate-90 [filter:var(--app-filter-shell-icon)]"
                        src={sortIconSource}
                    />
                    <span>{t('knowledgeGaps.creationDate')}</span>
                    <img
                        alt=""
                        aria-hidden="true"
                        className="size-5 [filter:var(--app-filter-shell-icon)]"
                        src={chevronDownIconSource}
                    />
                </button>

                <button
                    type="button"
                    disabled
                    className="flex h-10 w-[calc(50%-8px)] cursor-default items-center justify-center gap-1 rounded-lg border border-primary/50 text-label text-danger md:w-[153px]"
                >
                    <img alt="" aria-hidden="true" className="size-5" src={deleteIconSource} />
                    <span>{t('knowledgeGaps.deleteAll')}</span>
                </button>

                <button
                    type="button"
                    role="switch"
                    aria-checked="false"
                    disabled
                    className="ml-auto flex h-10 w-full cursor-default items-center justify-end gap-[13px] text-body text-primary md:w-auto"
                >
                    <span>{t('knowledgeGaps.batchSelect')}</span>
                    <img alt="" aria-hidden="true" className="h-5 w-8" src={toggleIconSource} />
                </button>
            </div>

            <div className="mt-[25px] grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 xl:min-[1920px]:grid-cols-[repeat(auto-fill,minmax(380px,1fr))]">
                {visibleItems.map((item) => (
                    <KnowledgeGapCard key={item.id} item={item} />
                ))}
            </div>

            <div className={status === 'idle' ? 'xl:pt-[112px]' : ''}>
                <TldPaginationStatus status={status} onLoadNextPage={loadNextPage} />
            </div>
        </section>
    )
}
