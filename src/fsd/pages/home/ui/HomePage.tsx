'use client'
import type { ReactElement } from 'react'
import { useRef } from 'react'
import { AnnouncementBar } from './AnnouncementBar'
import { AttentionProgress } from './AttentionProgress'
import { CommunityMessages } from './CommunityMessages'
import { Leaderboard } from './Leaderboard'
import { LearningGarden } from './LearningGarden'
import { LearningShowcase } from './LearningShowcase'
import { LearningStats } from './LearningStats'
import { HomeEntryFlow } from './HomeEntryFlow'
import { CheckinIllustration } from './CheckinIllustration'
import { HomeMascot } from './HomeMascot'
export function HomePage(): ReactElement {
    const mascotAnchorRef = useRef<HTMLSpanElement>(null)
    return (
        <>
            <section
                aria-label="学习首页"
                className="mx-auto grid min-h-full w-full max-w-[1720px] min-w-0 grid-cols-1 gap-4 p-3 md:p-4 lg:grid-cols-[minmax(0,1fr)_minmax(340px,400px)] xl:min-[1440px]:h-[max(1000px,calc(100dvh-5rem))] xl:min-[1440px]:min-h-0 xl:min-[1440px]:grid-cols-[minmax(0,1.55fr)_20px_minmax(180px,0.85fr)_16px_minmax(340px,1fr)] xl:min-[1440px]:grid-rows-[738px_minmax(214px,1fr)] xl:min-[1440px]:gap-x-0 xl:min-[1920px]:grid-cols-[749px_20px_415px_16px_484px] xl:min-[1920px]:pr-5"
            >
                <div className="min-w-0 xl:min-[1440px]:col-start-1">
                    <AnnouncementBar />
                    <div className="mt-[5px]">
                        <AttentionProgress />
                    </div>
                    <div className="mt-4">
                        <LearningStats />
                    </div>
                    <div className="mt-4">
                        <CommunityMessages mascotAnchorRef={mascotAnchorRef} />
                    </div>
                    <div className="mt-4">
                        <LearningShowcase />
                    </div>
                </div>
                <div className="min-w-0 lg:col-start-1 lg:row-start-2 xl:min-[1440px]:col-start-3 xl:min-[1440px]:row-start-1">
                    <CheckinIllustration />
                </div>
                <div className="min-h-0 min-w-0 lg:col-start-2 lg:row-span-3 lg:row-start-1 xl:min-[1440px]:col-start-5 xl:min-[1440px]:row-span-2 xl:min-[1440px]:h-full">
                    <Leaderboard />
                </div>
                <div className="min-w-0 lg:col-start-1 lg:row-start-3 xl:min-[1440px]:col-span-3 xl:min-[1440px]:col-start-1 xl:min-[1440px]:row-start-2 xl:min-[1440px]:h-full">
                    <LearningGarden />
                </div>
            </section>
            <HomeMascot anchorRef={mascotAnchorRef} />
            <HomeEntryFlow />
        </>
    )
}
