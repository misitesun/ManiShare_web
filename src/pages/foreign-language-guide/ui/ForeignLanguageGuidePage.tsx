import { useState } from 'react'
import type { ReactElement } from 'react'
import { generatePath, Link } from 'react-router-dom'
import { TldButton } from '../../../shared/ui/tld-button'
import { TldPaginationStatus } from '../../../shared/ui/tld-pagination-status'
import { TldSegmentedTabs } from '../../../shared/ui/tld-segmented-tabs'
import oceanEnglishBannerSource from '../assets/ocean-english-banner.webp'
import { foreignLanguageCoursePages } from '../model/course-items'
import { useForeignLanguageCoursePagination } from '../model/useForeignLanguageCoursePagination'
import { ForeignLanguageCourseCard } from './ForeignLanguageCourseCard'

const categoryLabels = ['全部', '分类1', '分类2', '分类3'] as const
const categoryTabs = categoryLabels.map((label) => ({ id: label, label }))

type CategoryLabel = (typeof categoryLabels)[number]

function isCategoryLabel(value: string): value is CategoryLabel {
    return categoryLabels.some((label) => label === value)
}

interface ForeignLanguageGuidePageProps {
    readonly courseDetailPath: string
}

export function ForeignLanguageGuidePage({
    courseDetailPath,
}: ForeignLanguageGuidePageProps): ReactElement {
    const [activeCategory, setActiveCategory] = useState<CategoryLabel>('全部')
    const { loadNextPage, status, visibleItems } = useForeignLanguageCoursePagination(
        foreignLanguageCoursePages,
    )

    function selectCategory(value: string): void {
        if (isCategoryLabel(value)) setActiveCategory(value)
    }

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

            <div className="mt-4 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <TldSegmentedTabs
                    activeTextTone="gradient"
                    ariaLabel="课程分类"
                    indicatorThickness="thick"
                    indicatorTone="brand-start"
                    indicatorWidth={48}
                    items={categoryTabs}
                    layout="equal"
                    semantics="filter"
                    showBaseline={false}
                    value={activeCategory}
                    variant="underline"
                    onValueChange={selectCategory}
                />
            </div>

            <div className="mt-[30px] grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 md:gap-y-5 xl:min-[1920px]:grid-cols-[repeat(auto-fill,minmax(562px,1fr))]">
                {visibleItems.map((courseItem) =>
                    courseItem.id === 'winter-speaking' ||
                    courseItem.id === 'winter-speaking-continuation' ? (
                        <Link
                            key={courseItem.id}
                            to={generatePath(courseDetailPath, { courseId: 'winter-speaking' })}
                            aria-label={`查看${courseItem.title}课程详情`}
                            className="block min-w-0 cursor-pointer rounded-xl outline-offset-4 focus-visible:outline-2 focus-visible:outline-focus"
                        >
                            <ForeignLanguageCourseCard courseItem={courseItem} />
                        </Link>
                    ) : (
                        <ForeignLanguageCourseCard key={courseItem.id} courseItem={courseItem} />
                    ),
                )}
            </div>

            <TldPaginationStatus status={status} onLoadNextPage={loadNextPage} />
        </section>
    )
}
