import type { ReactElement } from 'react'
import { TldButton } from '../../../shared/ui/tld-button'
import { TldGradientText } from '../../../shared/ui/tld-gradient-text'
import { TldPaginationStatus } from '../../../shared/ui/tld-pagination-status'
import oceanEnglishBannerSource from '../assets/ocean-english-banner.webp'
import { foreignLanguageCoursePages } from '../model/course-items'
import { useForeignLanguageCoursePagination } from '../model/useForeignLanguageCoursePagination'
import { ForeignLanguageCourseCard } from './ForeignLanguageCourseCard'

const categoryLabels = ['全部', '分类1', '分类2', '分类3'] as const

export function ForeignLanguageGuidePage(): ReactElement {
    const { loadNextPage, status, visibleItems } = useForeignLanguageCoursePagination(
        foreignLanguageCoursePages,
    )

    return (
        <section
            aria-label="外语逆袭秘籍"
            className="mx-auto min-w-0 px-3 pb-6 pt-5 md:px-4 xl:min-[1920px]:px-[250px]"
        >
            <div className="relative h-[145px] min-w-0 overflow-hidden rounded-xl md:h-[190px] xl:h-[230px] xl:rounded-[20px]">
                <img
                    alt="海底英语寻宝，听说训练、勇闯关卡"
                    className="size-full object-cover object-center"
                    src={oceanEnglishBannerSource}
                />
                <div aria-hidden="true" className="absolute inset-0 bg-overlay/20" />
                <div className="absolute bottom-3 left-1/2 w-[160px] -translate-x-1/2 md:bottom-5 md:w-[189px]">
                    <TldButton fullWidth size="large" onClick={(): void => undefined}>
                        立即开通
                    </TldButton>
                </div>
            </div>

            <nav
                aria-label="课程分类"
                className="mt-4 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
                <ul className="mx-auto flex w-max min-w-full items-start justify-center gap-8 md:gap-12 xl:gap-16">
                    {categoryLabels.map((label, index) => (
                        <li
                            key={label}
                            aria-current={index === 0 ? 'page' : undefined}
                            className={
                                index === 0
                                    ? 'relative pb-3 text-tab-label font-medium text-brand after:absolute after:bottom-0 after:left-1/2 after:h-1 after:w-12 after:-translate-x-1/2 after:rounded-full after:bg-brand-start'
                                    : 'pb-3 text-tab-label text-muted'
                            }
                        >
                            {index === 0 ? (
                                <TldGradientText animationSpeed={3}>{label}</TldGradientText>
                            ) : (
                                label
                            )}
                        </li>
                    ))}
                </ul>
            </nav>

            <div className="mt-[30px] grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 md:gap-y-5 xl:min-[1920px]:grid-cols-[repeat(auto-fill,minmax(562px,1fr))]">
                {visibleItems.map((courseItem) => (
                    <ForeignLanguageCourseCard key={courseItem.id} courseItem={courseItem} />
                ))}
            </div>

            <TldPaginationStatus status={status} onLoadNextPage={loadNextPage} />
        </section>
    )
}
