import { useState } from 'react'
import type { ReactElement } from 'react'
import { useParams } from 'react-router-dom'
import { TldBackButton } from '../../../shared/ui/tld-back-button'
import { TldButton } from '../../../shared/ui/tld-button'
import { TldSegmentedTabs } from '../../../shared/ui/tld-segmented-tabs'
import { notification } from '../../../shared/notification'
import bannerSource from '../assets/winter-speaking-banner.png'
import playSource from '../assets/play.svg'
import paginationSource from '../assets/pagination.svg'
import vipSource from '../assets/vip.svg'

interface ForeignLanguageCoursePageProps {
    readonly backPath: string
}

const detailTabs = [
    { id: 'details', label: '详情', panelId: 'course-details-panel' },
    { id: 'claim', label: '领取', panelId: 'course-claim-panel' },
]

export function ForeignLanguageCoursePage({
    backPath,
}: ForeignLanguageCoursePageProps): ReactElement {
    const { courseId } = useParams<{ courseId: string }>()
    const [activeTab, setActiveTab] = useState('details')

    if (courseId !== 'winter-speaking') {
        return (
            <section className="px-3 py-6 md:px-4 xl:min-[1920px]:px-[250px]">
                <TldBackButton to={backPath} />
                <h1 className="mt-6 text-page-title text-primary">暂未提供该课程详情</h1>
            </section>
        )
    }

    return (
        <section
            aria-label="课程详情"
            className="flex h-[calc(100dvh-4rem)] min-h-0 min-w-0 flex-col overflow-hidden px-3 md:px-4 xl:h-[calc(100dvh-5rem)] xl:min-[1920px]:px-[250px]"
        >
            <header className="flex shrink-0 items-center py-4 md:py-5">
                <TldBackButton to={backPath} />
            </header>

            <div
                aria-label="课程详情内容"
                tabIndex={0}
                className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain outline-offset-[-2px] focus-visible:outline-2 focus-visible:outline-focus [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
                <h1 className="mb-4 text-center text-section-title font-bold text-primary md:mb-5">
                    —冰雪口语训练营·情景对话·勇敢表达—
                </h1>
                <div className="relative aspect-[1212/350] min-w-0 overflow-hidden rounded-xl md:rounded-[20px]">
                    <img
                        alt="冰雪口语训练营，情景对话·勇敢表达"
                        className="size-full object-cover"
                        src={bannerSource}
                    />
                    <button
                        type="button"
                        aria-label="播放课程介绍"
                        className="absolute left-1/2 top-1/2 size-12 -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full outline-offset-4 focus-visible:outline-2 focus-visible:outline-focus md:size-[75px]"
                        onClick={(): void => notification.info('课程介绍视频暂未开放')}
                    >
                        <img alt="" className="size-full" src={playSource} />
                    </button>
                    <img
                        alt=""
                        aria-hidden="true"
                        className="absolute bottom-3 left-1/2 h-[10px] w-[90px] -translate-x-1/2"
                        src={paginationSource}
                    />
                </div>

                <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                        <h2 className="text-card-title font-medium text-primary">冰雪口语训练营</h2>
                        <ul aria-label="课程标签" className="mt-4 flex gap-3">
                            <li className="rounded-lg border border-strong px-5 py-1 text-label text-primary">
                                标签
                            </li>
                            <li className="rounded-lg border border-strong px-5 py-1 text-label text-primary">
                                标签
                            </li>
                        </ul>
                    </div>
                    <div className="ml-auto text-right">
                        <p className="font-medium text-danger">
                            <span className="text-body">¥</span>
                            <span className="text-[26px] md:text-[30px]">400.00</span>
                        </p>
                        <p className="mt-2 flex items-center justify-end text-body text-warning">
                            <img alt="" className="size-6" src={vipSource} />
                            VIP价格：¥320.00
                        </p>
                    </div>
                </div>

                <div>
                    <TldSegmentedTabs
                        activeTextTone="brand"
                        ariaLabel="课程内容"
                        indicatorTone="brand"
                        indicatorWidth="segment"
                        items={detailTabs}
                        layout="equal"
                        showBaseline
                        value={activeTab}
                        onValueChange={setActiveTab}
                        variant="underline"
                    />
                </div>
                <div
                    id="course-details-panel"
                    role="tabpanel"
                    aria-label="详情"
                    hidden={activeTab !== 'details'}
                    className="pb-5 pt-5"
                >
                    <article
                        aria-label="课程图文详情"
                        className="space-y-5 break-words text-body leading-relaxed text-primary [&_a]:text-brand [&_h2]:text-section-title [&_img]:h-auto [&_img]:max-w-full [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6"
                    >
                        <p>
                            欢迎来到“冰雪口语训练营”！这不仅是一门英语课程，更是一场在冬日雪国中展开的奇妙探险。我们将枯燥的英语课堂搬进银装素裹的冰雪世界，让孩子在滑雪、滑冰、打雪仗的真实情境中，自然而然地掌握冰雪相关词汇与地道口语表达。告别死记硬背，让英语学习像呼吸一样自然，像玩雪一样快乐！我们摒弃了传统的教室教学，精心设计了一条完整的“冰雪探索线”。课程分为四大阶段：破冰与初识：认识冰雪世界、冬季装备与基础运动词汇（如skating,
                            skiing, helmet等）。
                        </p>
                        <p>
                            最好的学习，永远发生在快乐发生的时刻。现在加入“冰雪口语训练营”，穿上你的冰雪装备，在雪花的飞舞与欢笑声中，开启一场充满惊喜的英语探索之旅吧！
                        </p>
                        <p>
                            最好的学习，永远发生在快乐发生的时刻。现在加入“冰雪口语训练营”，穿上你的冰雪装备，在雪花的飞舞与欢笑声中，开启一场充满惊喜的英语探索之旅吧！
                        </p>
                    </article>
                </div>
                <div
                    id="course-claim-panel"
                    role="tabpanel"
                    aria-label="领取"
                    hidden={activeTab !== 'claim'}
                    className="min-h-48"
                />
            </div>

            <footer
                aria-label="课程购买"
                className="grid shrink-0 grid-cols-2 gap-3 bg-canvas pb-[max(16px,env(safe-area-inset-bottom))] pt-5 md:gap-12 md:pb-8 xl:gap-[15%] xl:pb-10"
            >
                <TldButton
                    fullWidth
                    size="large"
                    variant="secondary"
                    onClick={(): void => notification.info('课程购买暂未开放')}
                >
                    直接购买
                </TldButton>
                <TldButton
                    fullWidth
                    size="large"
                    onClick={(): void => notification.info('VIP领取暂未开放')}
                >
                    VIP免费
                </TldButton>
            </footer>
        </section>
    )
}
