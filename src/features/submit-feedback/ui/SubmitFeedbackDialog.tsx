import { useState } from 'react'
import type { FormEvent, ReactElement } from 'react'
import { TldButton } from '../../../shared/ui/tld-button'
import { TldDialog } from '../../../shared/ui/tld-dialog'
import { TldImageUpload } from '../../../shared/ui/tld-image-upload'
import { TldSelection } from '../../../shared/ui/tld-selection'
import { feedbackOptions } from '../model/feedback-options'
import type { FeedbackCategory } from '../model/feedback-options'

export interface FeedbackDraft {
    readonly category: FeedbackCategory
    readonly description: string
    readonly screenshots: readonly File[]
}

export interface SubmitFeedbackDialogProps {
    readonly onOpenChange: (open: boolean) => void
    readonly onSubmit?: (draft: FeedbackDraft) => void
    readonly open: boolean
}

const initialCategory: FeedbackCategory = 'course'

export function SubmitFeedbackDialog({
    onOpenChange,
    onSubmit,
    open,
}: SubmitFeedbackDialogProps): ReactElement {
    const [category, setCategory] = useState<FeedbackCategory>(initialCategory)
    const [description, setDescription] = useState('')
    const [screenshots, setScreenshots] = useState<readonly File[]>([])

    function resetDraft(): void {
        setCategory(initialCategory)
        setDescription('')
        setScreenshots([])
    }

    function closeDialog(): void {
        resetDraft()
        onOpenChange(false)
    }

    function handleOpenChange(nextOpen: boolean): void {
        if (!nextOpen) resetDraft()
        onOpenChange(nextOpen)
    }

    function handleSubmit(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault()
        onSubmit?.({ category, description, screenshots })
        closeDialog()
    }

    return (
        <TldDialog
            open={open}
            onOpenChange={handleOpenChange}
            showCancelButton={false}
            showConfirmButton={false}
            size="large"
            title="建议反馈"
        >
            <form className="flex min-h-0 flex-col md:min-h-[646px]" onSubmit={handleSubmit}>
                <fieldset>
                    <legend className="sr-only">反馈内容</legend>
                    <div className="space-y-0.5">
                        {feedbackOptions.map((option) => (
                            <TldSelection
                                key={option.id}
                                checked={category === option.id}
                                label={option.label}
                                layout="inline"
                                name="feedback-category"
                                type="radio"
                                value={option.id}
                                onCheckedChange={(checked): void => {
                                    if (checked) setCategory(option.id)
                                }}
                            >
                                {option.label}
                            </TldSelection>
                        ))}
                    </div>
                </fieldset>

                <label
                    htmlFor="feedback-description"
                    className="mt-2 text-section-title text-primary"
                >
                    具体描述
                </label>
                <textarea
                    id="feedback-description"
                    className="mt-4 h-[133px] w-full shrink-0 resize-none rounded-[5px] border border-dashed border-strong bg-surface p-4 text-body text-primary outline-none transition-[border-color,box-shadow] placeholder:text-muted hover:border-brand focus:border-brand focus:shadow-focus motion-reduce:transition-none"
                    placeholder="请说明哪些错误～"
                    value={description}
                    onChange={(event): void => setDescription(event.currentTarget.value)}
                />

                <section className="mt-4" aria-labelledby="feedback-screenshot-title">
                    <h3 id="feedback-screenshot-title" className="text-section-title text-primary">
                        上传截图
                    </h3>
                    <div className="mt-4">
                        <TldImageUpload
                            files={screenshots}
                            label="选择反馈截图"
                            maxFiles={4}
                            onFilesChange={setScreenshots}
                        />
                    </div>
                </section>

                <div className="mt-6 flex items-center justify-center gap-3 md:mt-auto md:gap-6">
                    <div className="min-w-0 flex-1 md:w-[180px] md:flex-none">
                        <TldButton fullWidth size="large" variant="secondary" onClick={closeDialog}>
                            取消
                        </TldButton>
                    </div>
                    <div className="min-w-0 flex-1 md:w-[180px] md:flex-none">
                        <TldButton fullWidth size="large" type="submit">
                            提交
                        </TldButton>
                    </div>
                </div>

                <div className="mt-5 text-center text-helper text-secondary md:mt-6">
                    <p>可直接联系首页客服反馈</p>
                    <p className="mt-2">——感谢反馈，您的建议是我们前进的动力——</p>
                </div>
            </form>
        </TldDialog>
    )
}
