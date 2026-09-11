import type { ReactElement } from 'react'
import announcementIconSource from '../assets/icons/announcement.svg'
import { AutoMarquee } from './AutoMarquee'

export function AnnouncementBar(): ReactElement {
    return (
        <aside aria-label="公告" className="flex h-5 min-w-0 items-center gap-1.5 overflow-hidden">
            <img
                alt=""
                aria-hidden="true"
                className="size-5 shrink-0"
                src={announcementIconSource}
            />
            <div className="min-w-0 flex-1">
                <AutoMarquee durationSeconds={18}>
                    <span className="whitespace-nowrap bg-linear-to-r from-brand-start to-brand-end bg-clip-text text-label font-medium text-transparent">
                        这是一条公告消息～
                    </span>
                </AutoMarquee>
            </div>
        </aside>
    )
}
