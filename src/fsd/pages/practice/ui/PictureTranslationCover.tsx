import type { ReactElement } from 'react'
import scene from '../assets/picture-scene.png'
import { PracticeReadingOverlay } from './PracticeReadingOverlay'
import type { PracticeReadingView } from './PracticeReadingOverlay'

/** 用户指定760×520；与看图听力共用场景，只承载图片和真实朗读展示。 */
export function PictureTranslationCover({
    reading,
    blocked,
    onToggle,
}: {
    readonly reading?: PracticeReadingView | undefined
    readonly blocked: boolean
    readonly onToggle: () => void
}): ReactElement {
    return (
        <button
            type="button"
            data-picture-translation-cover
            data-practice-reading-surface
            data-practice-command="practice.readAloud"
            aria-label={reading?.status === 'playing' ? '暂停当前词条朗读' : '朗读当前词条'}
            aria-pressed={reading?.status === 'playing'}
            disabled={blocked}
            onClick={onToggle}
            className="relative block aspect-[760/520] w-full max-w-[760px] shrink-0 cursor-pointer overflow-hidden rounded-2xl focus-visible:outline-2 focus-visible:outline-focus disabled:cursor-not-allowed"
        >
            <img
                data-practice-media
                src={scene.src}
                alt="看图学词共用场景"
                width={760}
                height={520}
                className="h-full w-full object-cover"
            />
            <PracticeReadingOverlay reading={reading} />
        </button>
    )
}
