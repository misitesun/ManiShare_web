import type { ReactElement } from 'react'
import scene from '../assets/picture-typing-scene.png'
import { PracticeReadingOverlay } from './PracticeReadingOverlay'
import type { PracticeReadingView } from './PracticeReadingOverlay'

/** 原稿520×360场景与静态高亮；朗读仍由练习会话持有。 */
export function PictureExerciseCover({
    mode,
    reading,
    blocked,
    onToggle,
}: {
    readonly mode: 'typing' | 'oral'
    readonly reading?: PracticeReadingView | undefined
    readonly blocked: boolean
    readonly onToggle: () => void
}): ReactElement {
    return (
        <button
            type="button"
            data-picture-exercise-cover
            data-picture-typing-cover={mode === 'typing' || undefined}
            data-picture-oral-cover={mode === 'oral' || undefined}
            data-practice-reading-surface
            data-practice-command="practice.readAloud"
            aria-label={reading?.status === 'playing' ? '暂停当前词条朗读' : '朗读当前词条'}
            aria-pressed={reading?.status === 'playing'}
            disabled={blocked}
            onClick={onToggle}
            className="relative block aspect-[520/360] w-full max-w-[520px] shrink-0 cursor-pointer overflow-hidden rounded-[20px] focus-visible:outline-2 focus-visible:outline-focus disabled:cursor-not-allowed"
        >
            <img
                data-practice-media
                src={scene.src}
                alt="看图学词练习的浴室场景"
                width={520}
                height={360}
                className="h-full w-full object-cover"
            />
            <span
                aria-hidden="true"
                data-picture-static-highlight
                data-picture-typing-static-highlight={mode === 'typing' || undefined}
                className="pointer-events-none absolute bottom-0 rounded-[6px] border-2 border-brand shadow-[0_4px_10px] shadow-brand/25"
                style={{
                    left: `${(71 / 520) * 100}%`,
                    width: `${(125 / 520) * 100}%`,
                    height: `${(205 / 360) * 100}%`,
                }}
            />
            <PracticeReadingOverlay reading={reading} />
        </button>
    )
}
