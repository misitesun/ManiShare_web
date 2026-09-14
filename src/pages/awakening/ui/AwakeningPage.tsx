import { useCallback, useReducer } from 'react'
import type { ReactElement } from 'react'
import { Link, generatePath } from 'react-router-dom'
import { hasAwakeningCourseDetail } from '../model/course-detail'
import { TldPaginationStatus } from '../../../shared/ui/tld-pagination-status'
import { awakeningCourses } from '../model/course-items'
import {
    awakeningCatalogReducer,
    awakeningFilters,
    initialAwakeningCatalogState,
} from '../model/catalog-state'
import { AwakeningCourseCard } from './AwakeningCourseCard'
import { AwakeningFilterRow } from './AwakeningFilterRow'

export function AwakeningPage({ coursePath }: { readonly coursePath: string }): ReactElement {
    const [state, dispatch] = useReducer(awakeningCatalogReducer, initialAwakeningCatalogState)
    const loadNextPage = useCallback(
        (): void => dispatch({ type: 'load', total: awakeningCourses.length }),
        [],
    )
    return (
        <section
            aria-label="言灵觉醒"
            className="mx-auto min-w-0 px-3 pb-6 pt-4 md:px-4 xl:min-[1920px]:px-[250px]"
        >
            <h1 className="sr-only">言灵觉醒</h1>
            <div className="flex min-w-0 flex-col gap-4 md:gap-[21px]">
                <AwakeningFilterRow
                    primary
                    label="课程分类"
                    options={awakeningFilters.category}
                    value={state.category}
                    onChange={(value): void =>
                        dispatch({ type: 'select', group: 'category', value })
                    }
                />
                <AwakeningFilterRow
                    label="课程推荐"
                    options={awakeningFilters.recommendation}
                    value={state.recommendation}
                    onChange={(value): void =>
                        dispatch({ type: 'select', group: 'recommendation', value })
                    }
                />
                <AwakeningFilterRow
                    label="课程排序与共享"
                    options={awakeningFilters.access}
                    value={state.access}
                    onChange={(value): void => dispatch({ type: 'select', group: 'access', value })}
                />
            </div>
            <div className="mt-6 grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 md:gap-y-6 xl:grid-cols-[repeat(auto-fill,minmax(270px,1fr))] xl:min-[1920px]:grid-cols-[repeat(auto-fill,minmax(290px,1fr))]">
                {awakeningCourses.slice(0, state.visibleCount).map((course) =>
                    hasAwakeningCourseDetail(course.id) ? (
                        <Link
                            key={course.id}
                            to={generatePath(coursePath, { courseId: course.id })}
                            aria-label={`查看${course.title}课程详情`}
                            className="min-w-0 cursor-pointer rounded-xl outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus"
                        >
                            <AwakeningCourseCard course={course} />
                        </Link>
                    ) : (
                        <AwakeningCourseCard key={course.id} course={course} />
                    ),
                )}
            </div>
            <TldPaginationStatus
                status={state.visibleCount < awakeningCourses.length ? 'idle' : 'exhausted'}
                onLoadNextPage={loadNextPage}
            />
        </section>
    )
}
