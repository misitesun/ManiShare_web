import type { CSSProperties, ReactElement, ReactNode } from 'react'
import { getPracticeReference } from '../model/reference-layout'

interface ReaderStyle extends CSSProperties {
    readonly '--practice-reference-top': string
}

interface PureArticleReaderProps {
    /** 只接收页面已构建的React内容；接口富文本的解析须等格式明确后接入。 */
    readonly content: ReactNode
}

export function PureArticleReader({ content }: PureArticleReaderProps): ReactElement {
    const reference = getPracticeReference('text-reader', 'read', 'answering')
    const style: ReaderStyle = { '--practice-reference-top': `${reference.top}px` }
    const empty = content === null || content === undefined
    return (
        <section
            aria-label="纯文章阅读"
            data-pure-article-reader
            data-reference-node={reference.node}
            data-article-empty={empty}
            className="flex min-h-0 min-w-0 flex-1 flex-col px-4 pb-[calc(16px+env(safe-area-inset-bottom))] pt-6 md:px-8 md:pb-8 md:pt-8 design:pb-[170px] design:pt-[var(--practice-reference-top)]"
            style={style}
        >
            <article
                aria-label="文章内容"
                tabIndex={0}
                data-pure-article-content
                className="mx-auto min-h-0 w-full max-w-[1100px] max-h-[740px] flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain rounded-[20px] bg-practice-control-surface p-5 text-body leading-relaxed text-primary outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus md:p-8 [&_a]:cursor-pointer [&_a]:break-words [&_a]:text-brand [&_a]:underline [&_a]:underline-offset-4 [&_blockquote]:border-l-2 [&_blockquote]:border-brand [&_blockquote]:pl-4 [&_h1]:text-page-title [&_h2]:text-section-title [&_h3]:text-card-title [&_img]:h-auto [&_img]:max-w-full [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6 [&_video]:h-auto [&_video]:max-w-full"
            >
                {empty ? (
                    <div className="flex min-h-full items-center justify-center">
                        <p role="status" className="text-center text-body text-secondary">
                            暂无文章内容
                        </p>
                    </div>
                ) : (
                    <div className="min-w-0 space-y-5 break-words">{content}</div>
                )}
            </article>
        </section>
    )
}
