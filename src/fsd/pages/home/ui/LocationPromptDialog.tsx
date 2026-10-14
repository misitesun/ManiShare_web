'use client'

import type { ReactElement } from 'react'
import { TldDialog } from '../../../shared/ui/tld-dialog'
import locationIconSourceAsset from '../assets/location-prompt/location.svg'

const locationIconSource: string = locationIconSourceAsset.src

interface LocationPromptDialogProps {
    readonly open: boolean
    readonly onConfirm: () => void
    readonly onClose: () => void
    readonly error: string
}

export function LocationPromptDialog({
    open,
    onConfirm,
    onClose,
    error,
}: LocationPromptDialogProps): ReactElement {
    return (
        <TldDialog
            confirmLabel="确定"
            closeOnConfirm={false}
            onConfirm={onConfirm}
            onOpenChange={(next): void => {
                if (!next) onClose()
            }}
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
            {error ? (
                <p role="alert" className="mt-2 text-body-tight text-danger">
                    {error}
                </p>
            ) : null}
        </TldDialog>
    )
}
