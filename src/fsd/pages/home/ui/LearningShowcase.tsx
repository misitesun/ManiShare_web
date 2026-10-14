'use client'
import { useState } from 'react'
import type { ReactElement } from 'react'
import { selectHomeSlide } from '../model/home-interactions'
import previousAsset from '../assets/redesign/carousel-previous.svg'
import nextAsset from '../assets/redesign/carousel-next.svg'
export function LearningShowcase(): ReactElement {
    const [slide, setSlide] = useState(2)
    return (
        <section
            role="region"
            aria-label="首页活动轮播"
            aria-roledescription="轮播"
            className="relative h-[196px] min-w-0 overflow-hidden rounded-xl bg-surface-raised"
        >
            <p aria-live="polite" className="sr-only">
                第{slide + 1}张活动占位，共5张
            </p>
            <button
                type="button"
                aria-label="上一张活动"
                onClick={(): void => setSlide((current) => selectHomeSlide(current, 'previous'))}
                className="absolute left-2 top-1/2 grid size-9 -translate-y-1/2 cursor-pointer place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-focus"
            >
                <img src={previousAsset.src} alt="" aria-hidden="true" width={24} height={24} />
            </button>
            <button
                type="button"
                aria-label="下一张活动"
                onClick={(): void => setSlide((current) => selectHomeSlide(current, 'next'))}
                className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 cursor-pointer place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-focus"
            >
                <img src={nextAsset.src} alt="" aria-hidden="true" width={24} height={24} />
            </button>
            <div
                role="group"
                aria-label="首页轮播位置"
                className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1"
            >
                {[0, 1, 2, 3, 4].map((position) => (
                    <button
                        key={position}
                        type="button"
                        aria-label={'首页第' + (position + 1) + '张活动'}
                        aria-pressed={slide === position}
                        onClick={(): void =>
                            setSlide((current) => selectHomeSlide(current, position))
                        }
                        className="grid size-8 cursor-pointer place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-focus"
                    >
                        <span
                            aria-hidden="true"
                            className={
                                slide === position
                                    ? 'h-1 w-2.5 rounded-full bg-brand'
                                    : 'size-1.5 rounded-full bg-primary/70'
                            }
                        />
                    </button>
                ))}
            </div>
        </section>
    )
}
