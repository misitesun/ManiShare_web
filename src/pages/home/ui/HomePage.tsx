import type { ReactElement } from 'react'
import { AnnouncementBar } from './AnnouncementBar'
import { AttentionProgress } from './AttentionProgress'
import { CommunityMessages } from './CommunityMessages'
import { Leaderboard } from './Leaderboard'
import { LearningGarden } from './LearningGarden'
import { LearningShowcase } from './LearningShowcase'
import { LearningStats } from './LearningStats'
import { LocationPromptDialog } from './LocationPromptDialog'

export function HomePage(): ReactElement {
    return (
        <>
            <section
                aria-label="学习首页"
                className="mx-auto grid min-h-full w-full max-w-[1720px] min-w-0 grid-cols-1 gap-4 p-3 md:p-4 lg:grid-cols-[minmax(0,1fr)_minmax(340px,400px)] lg:gap-x-5 xl:min-[1440px]:h-[max(1001px,calc(100dvh-5rem))] xl:min-[1440px]:min-h-0 xl:min-[1440px]:grid-cols-[minmax(0,1.55fr)_minmax(180px,0.85fr)_minmax(360px,1fr)] xl:min-[1440px]:grid-rows-[713px_minmax(241px,1fr)] xl:min-[1440px]:gap-y-[15px] xl:min-[1920px]:grid-cols-[749px_415px_478px]"
            >
                <div className="min-w-0 lg:h-[713px]">
                    <AnnouncementBar />
                    <div className="mt-[7px]">
                        <AttentionProgress />
                    </div>
                    <div className="mt-[17px]">
                        <CommunityMessages />
                    </div>
                    <div className="mt-4 min-w-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        <LearningStats />
                    </div>
                    <div className="mt-4 min-w-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        <LearningShowcase />
                    </div>
                </div>

                <section
                    aria-label="预留功能区域"
                    className="min-h-80 rounded-xl bg-surface-raised md:min-h-[28rem] lg:col-start-1 lg:row-start-2 xl:min-[1440px]:col-start-2 xl:min-[1440px]:row-start-1 xl:min-[1440px]:h-[713px] xl:min-[1440px]:min-h-0"
                />
                <div className="min-h-0 min-w-0 lg:col-start-2 lg:row-span-3 lg:row-start-1 xl:min-[1440px]:col-start-3 xl:min-[1440px]:row-span-2 xl:min-[1440px]:h-full">
                    <Leaderboard />
                </div>
                <div className="min-w-0 lg:col-start-1 lg:row-start-3 xl:min-[1440px]:col-span-2 xl:min-[1440px]:col-start-1 xl:min-[1440px]:row-start-2 xl:min-[1440px]:h-full">
                    <LearningGarden />
                </div>
            </section>
            <LocationPromptDialog />
        </>
    )
}
