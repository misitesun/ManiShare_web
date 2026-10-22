'use client'

import type { ReactElement, ReactNode } from 'react'
import { TldDialog } from '../../../shared/ui/tld-dialog'
import type { TldDialogReferenceFrame } from '../../../shared/ui/tld-dialog'
import type { OralAssessmentDemoController } from '../model/useOralAssessmentDemo'
import type { OralAssessmentTarget } from '../model/oral-assessment'
import { OralAssessmentContent } from './OralAssessmentContent'

const referenceFrame: TldDialogReferenceFrame = { width: 1220, offsetX: 0, offsetY: 5.5 }

export interface OralAssessmentDialogProps {
    readonly open: boolean
    readonly onOpenChange: (open: boolean) => void
    readonly target: OralAssessmentTarget
    readonly controller: OralAssessmentDemoController
    /** 由页面装配设置中的录音/朗读声纹，feature 不横向依赖设置 feature。 */
    readonly wave?: ReactNode
}

export function OralAssessmentDialog({
    open,
    onOpenChange,
    target,
    controller,
    wave,
}: OralAssessmentDialogProps): ReactElement {
    function close(): void {
        controller.reset()
        onOpenChange(false)
    }

    return (
        <TldDialog
            open={open}
            onOpenChange={(value): void => {
                if (!value) close()
                else onOpenChange(true)
            }}
            title="口语评测"
            closeLabel="关闭口语评测"
            referenceFrame={referenceFrame}
            size="fit-extra-wide"
            density="compact"
            showHeader={false}
            showCancelButton={false}
            showConfirmButton={false}
            closeOnBackdrop={false}
        >
            <div
                data-oral-assessment-dialog
                data-oral-assessment-stage={controller.stage}
                data-oral-assessment-simulation
                className="relative flex min-h-[540px] flex-col items-center px-5 pb-6 pt-14 text-center text-content-strong md:min-h-[639px] md:px-10 md:pb-8 md:pt-0"
            >
                <OralAssessmentContent
                    target={target}
                    controller={controller}
                    active={open}
                    wave={wave}
                />
                <button
                    type="button"
                    onClick={close}
                    className="absolute bottom-2.5 left-1/2 min-h-10 -translate-x-1/2 cursor-pointer rounded px-2 text-[14px] font-normal leading-5 text-hint outline-none focus-visible:ring-2 focus-visible:ring-focus"
                >
                    ESC退出
                </button>
            </div>
        </TldDialog>
    )
}
