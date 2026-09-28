'use client'

import type { ReactElement } from 'react'
import Link from 'next/link'
import { getNotebookChapters } from '../../../entities/notebook'
import chapterIconSourceAsset from '../assets/chapter.svg'

const chapterIconSource: string = chapterIconSourceAsset.src

interface NotebookChapterListProps {
    readonly chapterPath: (coursePackageId: string, chapterId: string) => string
    readonly coursePackageId: string
}

export function NotebookChapterList({
    chapterPath,
    coursePackageId,
}: NotebookChapterListProps): ReactElement {
    const chapters = getNotebookChapters(coursePackageId)

    return (
        <div className="grid min-w-0 grid-cols-1 gap-x-4 gap-y-6 md:grid-cols-2 xl:grid-cols-4 xl:min-[1920px]:grid-cols-[repeat(auto-fill,minmax(290px,1fr))]">
            {chapters.map((chapter) => (
                <Link
                    scroll={false}
                    key={chapter.id}
                    href={chapterPath(coursePackageId, chapter.id)}
                    className="flex min-h-[148px] min-w-0 cursor-pointer flex-col justify-between gap-6 rounded-lg bg-surface-raised p-4 transition-colors hover:bg-surface-hover motion-reduce:transition-none"
                >
                    <div className="flex min-w-0 items-center gap-2">
                        <img
                            alt=""
                            aria-hidden="true"
                            className="size-9 shrink-0 [filter:var(--app-filter-shell-icon)]"
                            src={chapterIconSource}
                        />
                        <h2 className="break-words text-card-title font-medium text-primary">
                            {chapter.title}
                        </h2>
                    </div>
                    <p className="text-tab-label text-primary/60">
                        共{chapter.groups.length}条笔记
                    </p>
                </Link>
            ))}
        </div>
    )
}
