'use client'
import { useState } from 'react'
import type { ReactElement } from 'react'
import pictureSceneAsset from '../assets/picture-scene.png'
import { PracticeReadingOverlay } from './PracticeReadingOverlay'
import type { PracticeReadingView } from './PracticeReadingOverlay'
// 此场景的区域框需要正式标注坐标；本期只选整幅场景，不伪造目标区域。
export function PictureScene({
    width,
    height,
    source,
    reading,
}: {
    readonly width: number
    readonly height: number
    readonly source?: string | undefined
    readonly reading?: PracticeReadingView | undefined
}): ReactElement {
    const [expanded, setExpanded] = useState(false)
    return (
        <figure className="relative mx-auto w-full min-w-0 max-w-full" style={{ maxWidth: width }}>
            <div data-practice-reading-surface className="relative overflow-hidden rounded-[20px]">
                <img
                    src={source ?? pictureSceneAsset.src}
                    alt="看图学词示例场景"
                    className="block h-auto w-full rounded-[20px] object-cover"
                    style={{ aspectRatio: `${width}/${height}` }}
                />
                <PracticeReadingOverlay reading={reading} />
                <button
                    type="button"
                    className="absolute bottom-3 right-3 z-20 cursor-pointer rounded-lg border border-strong bg-surface/90 px-3 py-1 text-caption text-primary focus-visible:outline-2 focus-visible:outline-focus"
                    aria-expanded={expanded}
                    onClick={(): void => setExpanded((value) => !value)}
                >
                    场景信息
                </button>
            </div>
            {expanded && (
                <figcaption className="mt-2 text-caption text-secondary">
                    场景图片已接入。当前显示设计稿自带的区域高亮图；动态区域坐标与列表关联尚未接入。
                </figcaption>
            )}
        </figure>
    )
}
