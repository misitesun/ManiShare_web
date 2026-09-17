import { useState } from 'react'
import type { ReactElement } from 'react'
import { TldDialog } from '../../../shared/ui/tld-dialog'
import locationIconSource from '../assets/location-prompt/location.svg'
import { confirmLocationPrompt, hasConfirmedLocationPrompt } from '../model/location-prompt'

export function LocationPromptDialog(): ReactElement {
    const [open, setOpen] = useState<boolean>(() => !hasConfirmedLocationPrompt())

    function handleConfirm(): void {
        confirmLocationPrompt()
    }

    return (
        <TldDialog
            confirmLabel="确定"
            onConfirm={handleConfirm}
            onOpenChange={setOpen}
            open={open}
            showCancelButton={false}
            size="small"
            title="提示"
        >
            <div className="flex items-start justify-center gap-1.5 md:px-5">
                <img
                    alt=""
                    aria-hidden="true"
                    className="mt-0.5 size-6 shrink-0"
                    src={locationIconSource}
                />
                <p className="max-w-[348px] text-body leading-6 text-primary">
                    为了帮您快速匹配当地线下玩咖空间和咨询服务中心，请提供您的地理位置
                </p>
            </div>
        </TldDialog>
    )
}
