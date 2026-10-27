'use client'
import { useState } from 'react'
import type { ReactElement } from 'react'
import pictureSceneAsset from '../assets/picture-scene.png'
import { PracticeReadingOverlay } from './PracticeReadingOverlay'
import type { PracticeReadingView } from './PracticeReadingOverlay'
// highlight 只复现原稿已核实的静态书本框；词条动态区域仍待正式标注。
export function PictureScene({
    width,
    height,
    source,
    reading,
    showSceneInfo = true,
    highlight = false,
}: {
    readonly width: number
    readonly height: number
    readonly source?: string | undefined
    readonly reading?: PracticeReadingView | undefined
    readonly showSceneInfo?: boolean
    readonly highlight?: boolean
}): ReactElement {
    const [expanded, setExpanded] = useState(false)
    return (
        <figure className="relative mx-auto w-full min-w-0 max-w-full" style={{ maxWidth: width }}>
            <div data-practice-reading-surface className="relative overflow-hidden rounded-[20px]">
                <img
                    src={source ?? pictureSceneAsset.src}
                    data-practice-media
                    alt="看图学词示例场景"
                    className="block h-auto w-full rounded-[20px] object-cover"
                    style={{ aspectRatio: `${width}/${height}` }}
                />
                {highlight && (
                    <span
                        aria-hidden="true"
                        data-picture-static-highlight
                        className="pointer-events-none absolute top-0 rounded-[6px] border-[3px] border-brand"
                        style={{
                            left: `${(22 / 844) * 100}%`,
                            width: `${(279 / 844) * 100}%`,
                            height: `${(151 / 565) * 100}%`,
                        }}
                    />
                )}
                <PracticeReadingOverlay reading={reading} />
                {showSceneInfo && (
                    <button
                        type="button"
                        className="absolute bottom-3 right-3 z-20 cursor-pointer rounded-lg border border-strong bg-surface/90 px-3 py-1 text-caption text-primary focus-visible:outline-2 focus-visible:outline-focus"
                        aria-expanded={expanded}
                        onClick={(): void => setExpanded((value) => !value)}
                    >
                        场景信息
                    </button>
                )}
            </div>
            {showSceneInfo && expanded && (
                <figcaption className="mt-2 text-caption text-secondary">
                    场景图片已接入。当前显示设计稿自带的区域高亮图；动态区域坐标与列表关联尚未接入。
                </figcaption>
            )}
        </figure>
    )
}
