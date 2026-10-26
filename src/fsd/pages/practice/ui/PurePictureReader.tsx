'use client'

import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, PointerEvent, ReactElement } from 'react'
import { pictureReaderSlides } from '../model/picture-reader-demo'
import { getPictureReaderIndex, getPictureReaderSwipe } from '../model/picture-reader'
import { getPracticeReference } from '../model/reference-layout'
import { usePictureReaderMotion } from './usePictureReaderMotion'
import previousAsset from '../assets/picture-reader/previous.svg'
import nextAsset from '../assets/picture-reader/next.svg'

interface ReaderStyle extends CSSProperties {
    readonly '--practice-reference-top': string
}

interface PurePictureReaderProps {
    readonly index: number
    readonly blocked: boolean
    readonly onSelect: (index: number) => void
    readonly onBusyChange: (busy: boolean) => void
}

interface PicturePointer {
    readonly id: number
    readonly x: number
    readonly y: number
}

function PictureReaderImage({
    source,
    title,
}: {
    readonly source: string
    readonly title: string
}): ReactElement {
    const [failed, setFailed] = useState(false)
    return failed ? (
        <p
            className="grid size-full place-items-center px-6 text-center text-body text-media-foreground"
            role="status"
        >
            {title}：图片暂时无法显示
        </p>
    ) : (
        <img
            src={source}
            alt={title}
            draggable={false}
            className="block size-full select-none object-cover"
            onError={(): void => setFailed(true)}
        />
    )
}

export function PurePictureReader({
    index,
    blocked,
    onSelect,
    onBusyChange,
}: PurePictureReaderProps): ReactElement {
    const reference = getPracticeReference('picture-reader', 'read')
    const style: ReaderStyle = { '--practice-reference-top': `${reference.top}px` }
    const frameRef = useRef<HTMLDivElement>(null)
    const pointer = useRef<PicturePointer | null>(null)
    const motion = usePictureReaderMotion(frameRef, { index, blocked, onBusyChange })
    useEffect(() => {
        if (blocked) pointer.current = null
    }, [blocked])

    function select(nextIndex: number): void {
        if (blocked || motion.current || nextIndex === index) return
        onSelect(nextIndex)
    }
    function startSwipe(event: PointerEvent<HTMLDivElement>): void {
        if (blocked || motion.current || !event.isPrimary || event.button !== 0) return
        if (event.target instanceof Element && event.target.closest('button')) return
        pointer.current = { id: event.pointerId, x: event.clientX, y: event.clientY }
        event.currentTarget.setPointerCapture(event.pointerId)
    }
    function finishSwipe(event: PointerEvent<HTMLDivElement>): void {
        const start = pointer.current
        if (!start || start.id !== event.pointerId) return
        pointer.current = null
        const direction = getPictureReaderSwipe({
            startX: start.x,
            startY: start.y,
            endX: event.clientX,
            endY: event.clientY,
            width: event.currentTarget.clientWidth,
        })
        if (direction !== 0)
            select(getPictureReaderIndex(index, pictureReaderSlides.length, direction))
    }
    function cancelSwipe(): void {
        pointer.current = null
    }

    return (
        <section
            aria-label="纯图片轮播"
            aria-roledescription="轮播"
            data-pure-picture-reader
            data-reference-node={reference.node}
            className="min-w-0 px-4 pb-8 pt-20 md:px-8 md:pt-24 design:pt-[var(--practice-reference-top)]"
            style={style}
        >
            <div
                ref={frameRef}
                data-pure-picture-frame
                className="relative mx-auto aspect-[1100/733] w-full max-w-[1100px] touch-pan-y overflow-hidden rounded-[20px] bg-media-ink"
                onPointerDown={startSwipe}
                onPointerUp={finishSwipe}
                onPointerCancel={cancelSwipe}
                onLostPointerCapture={cancelSwipe}
            >
                {pictureReaderSlides.map((slide, slideIndex) => (
                    <div
                        key={slide.id}
                        role="group"
                        aria-roledescription="幻灯片"
                        aria-label={`${slideIndex + 1}/${pictureReaderSlides.length} ${slide.title}`}
                        aria-hidden={slideIndex !== index}
                        data-picture-slide={slide.id}
                        className={
                            slideIndex === index
                                ? 'absolute inset-0'
                                : 'pointer-events-none absolute inset-0 invisible opacity-0'
                        }
                    >
                        <PictureReaderImage source={slide.source} title={slide.title} />
                    </div>
                ))}
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-linear-to-b from-media-ink from-87% to-[color:color-mix(in_srgb,var(--color-media-ink)_60%,var(--color-media-foreground))] opacity-30"
                />
                <button
                    type="button"
                    aria-label="上一张图片"
                    disabled={blocked}
                    onClick={(): void =>
                        select(getPictureReaderIndex(index, pictureReaderSlides.length, -1))
                    }
                    className="absolute left-2 top-1/2 grid size-[50px] -translate-y-1/2 cursor-pointer place-items-center rounded-full outline-offset-2 hover:opacity-80 focus-visible:outline-2 focus-visible:outline-focus disabled:cursor-default disabled:opacity-40 md:left-[14px]"
                >
                    <img alt="" src={previousAsset.src} className="shrink-0" />
                </button>
                <button
                    type="button"
                    aria-label="下一张图片"
                    disabled={blocked}
                    onClick={(): void =>
                        select(getPictureReaderIndex(index, pictureReaderSlides.length, 1))
                    }
                    className="absolute right-2 top-1/2 grid size-[50px] -translate-y-1/2 cursor-pointer place-items-center rounded-full outline-offset-2 hover:opacity-80 focus-visible:outline-2 focus-visible:outline-focus disabled:cursor-default disabled:opacity-40 md:right-4"
                >
                    <img alt="" src={nextAsset.src} className="shrink-0" />
                </button>
                <div
                    role="group"
                    aria-label="选择图片"
                    data-picture-indicators
                    className="absolute inset-x-0 bottom-0.5 flex h-[34px] items-center justify-center"
                >
                    {pictureReaderSlides.map((slide, slideIndex) => (
                        <button
                            key={slide.id}
                            type="button"
                            aria-label={`查看第${slideIndex + 1}张图片`}
                            aria-current={slideIndex === index ? 'true' : undefined}
                            disabled={blocked}
                            onClick={(): void => select(slideIndex)}
                            className="grid h-[34px] cursor-pointer place-items-center px-[5px] outline-offset-[-2px] focus-visible:outline-2 focus-visible:outline-focus disabled:cursor-default disabled:opacity-40"
                        >
                            <span
                                aria-hidden="true"
                                className={
                                    slideIndex === index
                                        ? 'h-2.5 w-5 rounded-[13px] bg-practice-control-accent'
                                        : 'size-2.5 rounded-full bg-dialog-title-soft'
                                }
                            />
                        </button>
                    ))}
                </div>
            </div>
            <p className="sr-only" aria-live="polite" aria-atomic="true">
                第{index + 1}张，共{pictureReaderSlides.length}张图片
            </p>
        </section>
    )
}
