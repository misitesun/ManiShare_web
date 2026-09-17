import type { ReactElement } from 'react'
import { TldButton } from '../../../shared/ui/tld-button'

interface VipCollaborationPanelProps {
    readonly onExplore: () => void
}

export function VipCollaborationPanel({ onExplore }: VipCollaborationPanelProps): ReactElement {
    return (
        <div
            id="collaboration-vip-panel"
            className="flex w-full flex-col items-center"
            role="tabpanel"
        >
            <p className="mt-5 text-center text-body text-primary">
                不只是终身 VIP，更是漫奇说事业共创人
            </p>

            <article
                aria-label="漫奇联创天使富文本内容"
                className="mt-7 min-h-[260px] w-full max-w-[790px] rounded-[20px] border border-strong bg-surface/30 md:min-h-[360px] xl:min-h-[440px]"
            />

            <div className="mt-7 w-full max-w-[410px]">
                <TldButton fullWidth size="large" onClick={onExplore}>
                    去看看
                </TldButton>
            </div>
        </div>
    )
}
