'use client'

import { useId, useReducer, useRef, useState } from 'react'
import type { FormEvent, ReactElement } from 'react'
import { notification } from '../../../shared/notification'
import { TldButton } from '../../../shared/ui/tld-button'
import { TldDialog } from '../../../shared/ui/tld-dialog'
import { TldImageUpload } from '../../../shared/ui/tld-image-upload'
import { TldSelection } from '../../../shared/ui/tld-selection'
import type { PracticeQuestion } from '../model/practice-demo'
import {
    createPracticeErrorFeedbackState,
    practiceErrorFeedbackOptions,
    practiceErrorFeedbackReducer,
    validatePracticeErrorFeedback,
} from '../model/practice-error-feedback'
import closeAsset from '../assets/error-feedback-close.svg'

interface PracticeErrorFeedbackDialogProps {
    readonly open: boolean
    readonly question: Pick<PracticeQuestion, 'english' | 'translation'>
    readonly onClose: () => void
}

const notSentMessage = '反馈未发送：暂时无法提交，你填写的内容仍保留在此弹窗。'

/** 本题错误反馈的本地表单；关闭清空编辑态，退场保留关闭前画面，不持久化或发送请求。 */
export function PracticeErrorFeedbackDialog({
    open,
    question,
    onClose,
}: PracticeErrorFeedbackDialogProps): ReactElement {
    const id = useId()
    const formRef = useRef<HTMLFormElement>(null)
    const descriptionRef = useRef<HTMLTextAreaElement>(null)
    const [state, dispatch] = useReducer(
        practiceErrorFeedbackReducer,
        undefined,
        createPracticeErrorFeedbackState,
    )
    const [screenshots, setScreenshots] = useState<readonly File[]>([])
    const [notice, setNotice] = useState('')
    const errors = state.hasSubmitted ? validatePracticeErrorFeedback(state.form) : {}

    function close(): void {
        resetForm()
        onClose()
    }

    function resetForm(): void {
        dispatch({ type: 'reset' })
        setScreenshots([])
        setNotice('')
    }

    function submit(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault()
        dispatch({ type: 'submit' })
        const nextErrors = validatePracticeErrorFeedback(state.form)
        if (nextErrors.types) {
            formRef.current?.querySelector<HTMLInputElement>('input[type="checkbox"]')?.focus()
            return
        }
        if (nextErrors.description) {
            descriptionRef.current?.focus()
            return
        }
        setNotice(notSentMessage)
        notification.info(notSentMessage)
    }

    return (
        <TldDialog
            open={open}
            onOpenChange={(open): void => {
                if (!open) close()
            }}
            title="错误反馈"
            size="fit-extra-wide"
            referenceFrame={{ width: 686, offsetX: 0, offsetY: 0 }}
            density="compact"
            showHeader={false}
            showCloseButton={false}
            footer={null}
        >
            <form
                ref={formRef}
                aria-label="错误反馈表单"
                data-practice-error-feedback
                className="relative px-[15px] pb-6 pt-[23px] md:min-h-[820px] md:pb-[39px] md:pl-[31px] md:pr-[23px]"
                noValidate
                onSubmit={submit}
            >
                <h3
                    data-practice-error-title
                    className="-mx-[15px] h-[34px] text-center text-section-title-display font-medium tracking-normal md:-ml-[31px] md:-mr-[23px]"
                >
                    <span className="bg-linear-to-b/srgb from-brand-start to-brand-end bg-clip-text text-transparent">
                        错误反馈
                    </span>
                </h3>
                <button
                    type="button"
                    aria-label="关闭错误反馈"
                    className="absolute right-[15px] top-5 grid size-10 cursor-pointer place-items-center rounded-lg hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-focus"
                    onClick={close}
                >
                    <img
                        alt=""
                        src={closeAsset.src}
                        className="[filter:var(--app-filter-dialog-icon)]"
                    />
                </button>

                <section
                    aria-label="当前反馈内容"
                    data-practice-error-content
                    className="mt-4 grid min-w-0 gap-4 rounded-xl border border-foreground/30 px-3 py-4 text-body-tight font-normal text-foreground"
                >
                    <div className="flex min-w-0 items-start gap-[9px]">
                        <span className="inline-flex h-6 w-[58px] shrink-0 items-center justify-center rounded bg-accent-green text-label-regular text-foreground">
                            英文
                        </span>
                        <p className="min-w-0 break-words leading-6">{question.english}</p>
                    </div>
                    <div className="flex min-w-0 items-start gap-3">
                        <span className="inline-flex h-6 w-[58px] shrink-0 items-center justify-center rounded border border-accent-green text-label-regular text-accent-green">
                            翻译
                        </span>
                        <p className="min-w-0 break-words leading-6">{question.translation}</p>
                    </div>
                </section>

                <fieldset
                    aria-describedby={errors.types ? `${id}-types-error` : undefined}
                    aria-invalid={errors.types ? true : undefined}
                    className="mt-5 min-w-0"
                >
                    <legend
                        data-practice-error-label="types"
                        className="text-form-title font-medium text-foreground"
                    >
                        <span aria-hidden="true" className="text-danger">
                            *
                        </span>
                        类型（可多选）
                        <span className="sr-only">，必填</span>
                    </legend>
                    <div data-practice-error-categories className="mt-[18px] space-y-5">
                        {[
                            practiceErrorFeedbackOptions.slice(0, 4),
                            practiceErrorFeedbackOptions.slice(4),
                        ].map((row) => (
                            <div key={row[0]?.id} className="flex flex-wrap gap-x-6 gap-y-3">
                                {row.map((option) => (
                                    <TldSelection
                                        key={option.id}
                                        appearance="ring-compact"
                                        label={option.label}
                                        checked={state.form.types.includes(option.id)}
                                        layout="inline"
                                        name="practice-error-types"
                                        value={option.id}
                                        onCheckedChange={(): void => {
                                            dispatch({ type: 'toggle-type', errorType: option.id })
                                            setNotice('')
                                        }}
                                    >
                                        {option.label}
                                    </TldSelection>
                                ))}
                            </div>
                        ))}
                    </div>
                    {errors.types ? (
                        <p
                            id={`${id}-types-error`}
                            role="alert"
                            className="mt-2 text-caption text-danger"
                        >
                            {errors.types}
                        </p>
                    ) : null}
                </fieldset>

                <div className="mt-[18px]">
                    <label
                        htmlFor={`${id}-description`}
                        data-practice-error-label="description"
                        className="block cursor-pointer text-form-title font-medium text-foreground"
                    >
                        <span aria-hidden="true" className="text-danger">
                            *
                        </span>
                        具体描述
                        <span className="sr-only">，必填</span>
                    </label>
                    <textarea
                        ref={descriptionRef}
                        id={`${id}-description`}
                        aria-label="错误描述"
                        aria-required="true"
                        aria-invalid={errors.description ? true : undefined}
                        aria-describedby={
                            errors.description ? `${id}-description-error` : undefined
                        }
                        data-practice-error-description
                        value={state.form.description}
                        placeholder="请说明哪些错误～"
                        className="mt-2.5 block h-[133px] w-full cursor-text resize-none rounded-xl border border-dashed border-foreground/30 bg-transparent px-[15px] pb-2.5 pt-[15px] text-label-regular tracking-[0.01em] text-foreground outline-none placeholder:text-hint focus:border-brand focus:shadow-focus md:w-[calc(100%_-_5px)]"
                        onChange={(change): void => {
                            dispatch({
                                type: 'edit-description',
                                description: change.currentTarget.value,
                            })
                            setNotice('')
                        }}
                    />
                    {errors.description ? (
                        <p
                            id={`${id}-description-error`}
                            role="alert"
                            className="mt-2 text-caption text-danger"
                        >
                            {errors.description}
                        </p>
                    ) : null}
                </div>

                <section className="mt-[18px]" aria-labelledby={`${id}-screenshot-title`}>
                    <h4
                        id={`${id}-screenshot-title`}
                        data-practice-error-label="screenshot"
                        className="text-form-title font-medium text-foreground"
                    >
                        上传截图
                    </h4>
                    <div data-practice-error-screenshot className="mt-3">
                        <TldImageUpload
                            appearance="outlined"
                            previewSource="data-url"
                            files={screenshots}
                            label="选择错误截图"
                            onFilesChange={(files): void => {
                                setScreenshots(files)
                                setNotice('')
                            }}
                        />
                    </div>
                </section>

                {notice ? (
                    <p
                        data-practice-error-status
                        role="status"
                        className="mt-3 text-caption text-secondary"
                    >
                        {notice}
                    </p>
                ) : null}
                <div
                    data-practice-error-actions
                    className="mt-[38px] flex items-center justify-end gap-3 md:gap-[30px] md:pr-5"
                >
                    <div className="min-w-0 flex-1 md:w-[180px] md:flex-none">
                        <TldButton fullWidth size="form-wide" variant="soft" onClick={close}>
                            取消
                        </TldButton>
                    </div>
                    <div className="min-w-0 flex-1 md:w-[180px] md:flex-none">
                        <TldButton fullWidth size="form-wide" type="submit">
                            提交
                        </TldButton>
                    </div>
                </div>
            </form>
        </TldDialog>
    )
}
