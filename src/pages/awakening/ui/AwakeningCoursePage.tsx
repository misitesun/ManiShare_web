import { useState } from 'react'
import type { ReactElement } from 'react'
import { Link, useParams } from 'react-router-dom'
import { TldProgressBar } from '../../../shared/ui/tld-progress-bar'
import { TldSwitch } from '../../../shared/ui/tld-switch'
import { TldButton } from '../../../shared/ui/tld-button'
import { notification } from '../../../shared/notification'
import { awakeningChapters, hasAwakeningCourseDetail } from '../model/course-detail'
import { AwakeningChapterCard } from './AwakeningChapterCard'
import cover from '../assets/phonetics.webp'
import heat from '../assets/heat.svg'
import back from '../assets/detail/back.svg'
import chevron from '../assets/detail/chevron.svg'
import plus from '../assets/detail/plus.svg'
import reset from '../assets/detail/reset.svg'

export function AwakeningCoursePage({ backPath }: { readonly backPath: string }): ReactElement {
    const { courseId } = useParams<{ courseId: string }>()
    const [collected, setCollected] = useState(false)
    const [memoryEnabled, setMemoryEnabled] = useState(false)
    if (!hasAwakeningCourseDetail(courseId))
        return (
            <section className="p-4">
                <Link to={backPath} className="cursor-pointer text-brand underline">
                    返回言灵觉醒
                </Link>
                <h1 className="mt-4 text-section-title">暂未提供该课程详情</h1>
            </section>
        )
    return (
        <section
            aria-label="言灵觉醒课程详情"
            className="flex h-[calc(100dvh-4rem)] min-h-0 min-w-0 flex-col overflow-hidden px-3 pb-4 pt-4 md:px-4 xl:h-[calc(100dvh-5rem)] xl:pt-5 xl:min-[1920px]:px-[250px]"
        >
            <nav
                aria-label="面包屑"
                className="mb-4 flex min-h-[58px] shrink-0 items-center gap-1 rounded-lg bg-surface-raised px-2 text-label md:mb-5"
            >
                <Link
                    to={backPath}
                    aria-label="返回言灵觉醒课程列表"
                    className="flex min-h-10 shrink-0 cursor-pointer items-center gap-1 rounded text-primary outline-offset-2 hover:text-brand focus-visible:outline-2 focus-visible:outline-focus"
                >
                    <img
                        alt=""
                        className="size-7 [filter:var(--app-filter-shell-icon)]"
                        src={back}
                    />
                    中小学同步
                </Link>
                <img
                    alt=""
                    className="size-5 shrink-0 [filter:var(--app-filter-shell-icon)]"
                    src={chevron}
                />
                <span className="shrink-0 text-primary/60">三年级</span>
                <img
                    alt=""
                    className="size-5 shrink-0 [filter:var(--app-filter-shell-icon)]"
                    src={chevron}
                />
                <span
                    aria-current="page"
                    className="min-w-0 truncate text-primary/60"
                    title="三年级上册--人教版"
                >
                    三年级上册--人教版
                </span>
            </nav>
            <div
                role="region"
                aria-label="课程简介与章节列表"
                tabIndex={0}
                className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain pb-4 pr-1 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
                <div className="flex min-w-0 flex-col gap-4 rounded-xl border border-strong p-4 md:flex-row md:items-start xl:gap-5">
                    <img
                        alt="发音基础练，小学英语音标入门"
                        src={cover}
                        className="aspect-[315/180] w-full shrink-0 rounded-lg object-cover md:w-[30%] xl:max-w-[315px]"
                    />
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <h1 className="text-section-title font-medium text-primary">
                                三年级上册--人教版
                            </h1>
                            <span className="text-caption text-accent-green">练习时长：19秒</span>
                        </div>
                        <p className="mt-2 text-body text-primary/60">
                            学地道英语表达，大量的阅读是提升整体英语语言能力的必经之路。但不少人停留于表面的背生词、拆解句，却并没有体会到阅读的乐趣，也不知道读完一篇文章能从中获得什么，这是最大的遗憾！从精读一篇完整外刊文章开始。
                        </p>
                        <div className="mt-2 flex gap-2.5">
                            <span className="rounded border border-strong px-4 text-label text-secondary">
                                标签
                            </span>
                            <span className="rounded border border-strong px-4 text-label text-secondary">
                                标签
                            </span>
                        </div>
                        <div className="mt-2 flex items-center text-label text-secondary">
                            <img alt="" src={heat} className="size-5" />
                            1800
                        </div>
                        <div className="mt-2 flex flex-col gap-3 xl:flex-row xl:items-end xl:gap-6">
                            <div className="flex min-w-0 flex-1 items-center gap-3">
                                <span className="shrink-0 text-label text-accent-blue">
                                    练习进度0/18
                                </span>
                                <div className="min-w-0 flex-1">
                                    <TldProgressBar
                                        ariaLabel="课程练习进度"
                                        value={0}
                                        max={18}
                                        showValue={false}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 xl:w-[320px] xl:shrink-0">
                                <TldButton
                                    fullWidth
                                    variant="secondary"
                                    onClick={(): void => setCollected((current) => !current)}
                                    aria-pressed={collected}
                                >
                                    <img
                                        alt=""
                                        className="size-5 [filter:var(--app-filter-shell-icon)]"
                                        src={plus}
                                    />
                                    {collected ? '已收藏' : '收藏'}
                                </TldButton>
                                <TldButton
                                    fullWidth
                                    onClick={(): void => notification.info('学习内容暂未开放')}
                                >
                                    开始学习
                                </TldButton>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="my-2 flex flex-wrap items-center justify-between gap-2">
                    <TldSwitch
                        label="艾宾记忆助手"
                        checked={memoryEnabled}
                        onCheckedChange={setMemoryEnabled}
                    />
                    <button
                        type="button"
                        className="flex min-h-8 cursor-pointer items-center gap-1 rounded-lg bg-surface-raised px-2 text-caption text-primary/60 outline-offset-2 hover:text-primary focus-visible:outline-2 focus-visible:outline-focus"
                        onClick={(): void =>
                            notification.info('当前为静态预览，暂无可重置的学习记录')
                        }
                    >
                        <img
                            alt=""
                            className="size-[18px] [filter:var(--app-filter-shell-icon)]"
                            src={reset}
                        />
                        重置学习进度
                    </button>
                </div>
                <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[repeat(auto-fill,minmax(270px,1fr))] xl:min-[1920px]:grid-cols-[repeat(auto-fill,minmax(290px,1fr))]">
                    {awakeningChapters.map((chapter) => (
                        <AwakeningChapterCard key={chapter.id} chapter={chapter} />
                    ))}
                </div>
            </div>
        </section>
    )
}
