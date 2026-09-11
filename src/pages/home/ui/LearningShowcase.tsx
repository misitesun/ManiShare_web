import type { ReactElement } from 'react'
import playArrowSource from '../assets/icons/play-arrow.svg'
import { showcaseSources } from '../model/home-data'

export function LearningShowcase(): ReactElement {
    return (
        <section
            aria-labelledby="learning-showcase-title"
            className="min-w-0 overflow-hidden rounded-xl border border-strong bg-canvas px-4 py-4 min-[750px]:min-w-[690px] min-[750px]:px-5"
        >
            <h2
                id="learning-showcase-title"
                className="text-center text-card-title font-medium text-primary"
            >
                适合中国人的311N游戏化类母语自学法 多年实践 告别哑巴英语
            </h2>
            <p className="mt-2 text-center text-body text-muted">
                原生态·开口碎片·日常·自主记录·不修饰·真成长·部分展示
            </p>
            <ul className="mt-3 flex flex-wrap justify-center gap-x-3 gap-y-2 px-1">
                {showcaseSources.map((source, index) => (
                    <li
                        key={source}
                        className="relative h-[60px] w-[60px] shrink-0 overflow-hidden rounded-full"
                    >
                        <img
                            alt={`学习视频封面 ${index + 1}`}
                            className="absolute left-[-6px] top-0 h-[60px] w-[66px] max-w-none object-fill"
                            loading="lazy"
                            src={source}
                        />
                        <span
                            aria-hidden="true"
                            className="absolute left-1/2 top-1/2 z-10 grid size-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-overlay"
                        >
                            <img
                                alt=""
                                aria-hidden="true"
                                className="size-5 brightness-0 invert"
                                src={playArrowSource}
                            />
                        </span>
                    </li>
                ))}
            </ul>
        </section>
    )
}
