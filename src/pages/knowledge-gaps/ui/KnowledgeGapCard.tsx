import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { TldProgressBar } from '../../../shared/ui/tld-progress-bar'
import audioIconSource from '../assets/audio.svg'
import audioWideIconSource from '../assets/audio-wide.svg'
import type { KnowledgeGapItem } from '../model/knowledge-gap-items'

export interface KnowledgeGapCardProps {
    readonly item: KnowledgeGapItem
}

export function KnowledgeGapCard({ item }: KnowledgeGapCardProps): ReactElement {
    const { t } = useTranslation()
    const audioSource = item.audioIcon === 'wide' ? audioWideIconSource : audioIconSource

    return (
        <article className="relative h-[158px] min-w-0 rounded-xl bg-surface-raised px-4 pb-3 pt-4">
            <div className="flex min-w-0 items-center pr-[62px]">
                <p className="min-w-0 truncate text-body text-primary" title={item.english}>
                    {item.english}
                </p>
                <button
                    type="button"
                    disabled
                    aria-label={t('knowledgeGaps.playSentence', { sentence: item.english })}
                    className="ml-1 inline-flex h-5 shrink-0 cursor-default items-center justify-center"
                >
                    <img
                        alt=""
                        aria-hidden="true"
                        className={
                            item.audioIcon === 'wide'
                                ? 'h-5 w-[23px] [filter:var(--app-filter-shell-icon)]'
                                : 'size-5 [filter:var(--app-filter-shell-icon)]'
                        }
                        src={audioSource}
                    />
                </button>
            </div>

            <span className="absolute right-4 top-4 flex h-6 min-w-[54px] items-center justify-center rounded bg-danger-surface px-2 text-label text-danger">
                {t('knowledgeGaps.mistakeCount', { count: item.mistakeCount })}
            </span>

            <p className="mt-2.5 truncate text-body text-brand" title={item.chinese}>
                {item.chinese}
            </p>

            <div className="mt-[17px] border-t border-dashed border-primary/20" />
            <p className="mt-1.5 text-label text-primary/60">{item.createdAt}</p>
            <div className="mt-1.5">
                <TldProgressBar
                    ariaLabel={t('knowledgeGaps.progressLabel', { sentence: item.english })}
                    max={item.progressMax}
                    value={item.progress}
                />
            </div>
        </article>
    )
}
