'use client'

import { useEffect, useId, useState } from 'react'
import type { ChangeEvent, ReactElement } from 'react'
import addIconSourceAsset from './assets/add.svg'
import outlinedAddIconSourceAsset from './assets/add-outlined.svg'
import removeIconSourceAsset from './assets/remove.svg'
import { appendImageFiles, normalizeImageLimit, removeImageFile } from './image-files'
import { createBrowserImageDataReader, createDataUrlPreviewSession } from './image-previews'
import type { ImagePreview } from './image-previews'

const addIconSource: string = addIconSourceAsset.src
const outlinedAddIconSource: string = outlinedAddIconSourceAsset.src
const removeIconSource: string = removeIconSourceAsset.src

export interface TldImageUploadProps {
    readonly accept?: string
    readonly disabled?: boolean
    readonly files: readonly File[]
    readonly label: string
    readonly maxFiles?: number
    readonly onFilesChange: (files: readonly File[]) => void
    readonly appearance?: 'default' | 'outlined'
    readonly previewSource?: 'object-url' | 'data-url'
}

export function TldImageUpload({
    accept = 'image/*',
    disabled = false,
    files,
    label,
    maxFiles = 1,
    onFilesChange,
    appearance = 'default',
    previewSource = 'object-url',
}: TldImageUploadProps): ReactElement {
    const inputId = useId()
    const [previews, setPreviews] = useState<readonly ImagePreview[]>([])
    const fileLimit = normalizeImageLimit(maxFiles)

    useEffect(() => {
        if (previewSource === 'data-url') {
            return createDataUrlPreviewSession(files, createBrowserImageDataReader, setPreviews)
        }
        const nextPreviews = files.map((file) => ({
            file,
            source: URL.createObjectURL(file),
            status: 'ready' as const,
        }))
        setPreviews(nextPreviews)

        return (): void => {
            nextPreviews.forEach((preview) => URL.revokeObjectURL(preview.source))
        }
    }, [files, previewSource])

    function handleFileChange(event: ChangeEvent<HTMLInputElement>): void {
        const incomingFiles = Array.from(event.currentTarget.files ?? [])
        onFilesChange(appendImageFiles(files, incomingFiles, fileLimit))
        event.currentTarget.value = ''
    }

    return (
        <div className="flex flex-wrap gap-2.5" aria-label={label} data-appearance={appearance}>
            {previews.map((preview, index) => (
                <div
                    key={`${preview.file.name}-${preview.file.lastModified}-${index}`}
                    className={
                        appearance === 'outlined'
                            ? 'relative size-[130px] overflow-hidden rounded-lg border border-dashed border-foreground/30'
                            : 'relative size-24 overflow-hidden rounded-[5px] border border-dashed border-strong bg-surface md:size-[130px]'
                    }
                >
                    {preview.source === null ? (
                        <span
                            className="grid size-full place-items-center px-2 text-center text-caption text-secondary"
                            role="status"
                        >
                            {preview.status === 'error' ? '图片预览失败' : '图片预览加载中'}
                        </span>
                    ) : (
                        <img
                            alt={preview.file.name}
                            className="size-full object-cover"
                            src={preview.source}
                        />
                    )}
                    <button
                        type="button"
                        aria-label={`移除图片 ${preview.file.name}`}
                        disabled={disabled}
                        className="absolute right-0 top-0 grid size-8 cursor-pointer place-items-center rounded-bl bg-overlay/70 disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={(): void => onFilesChange(removeImageFile(files, index))}
                    >
                        <img
                            alt=""
                            aria-hidden="true"
                            className="size-[18px]"
                            src={removeIconSource}
                        />
                    </button>
                </div>
            ))}

            {files.length < fileLimit ? (
                <label
                    htmlFor={inputId}
                    className={
                        appearance === 'outlined'
                            ? disabled
                                ? 'grid size-[130px] cursor-not-allowed place-items-center rounded-lg border border-dashed border-foreground/30 opacity-50'
                                : 'grid size-[130px] cursor-pointer place-items-center rounded-lg border border-dashed border-foreground/30 transition-colors hover:bg-foreground/5 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus motion-reduce:transition-none'
                            : disabled
                              ? 'grid size-24 cursor-not-allowed place-items-center rounded-[5px] border border-dashed border-strong bg-surface opacity-50 md:size-[130px]'
                              : 'grid size-24 cursor-pointer place-items-center rounded-[5px] border border-dashed border-strong bg-surface transition-colors hover:bg-surface-hover md:size-[130px] motion-reduce:transition-none'
                    }
                >
                    <span className="sr-only">{label}</span>
                    <img
                        alt=""
                        aria-hidden="true"
                        className="size-[18px] [filter:var(--app-filter-dialog-icon)]"
                        src={appearance === 'outlined' ? outlinedAddIconSource : addIconSource}
                    />
                    <input
                        id={inputId}
                        type="file"
                        accept={accept}
                        disabled={disabled}
                        multiple={fileLimit > 1}
                        className="sr-only"
                        onChange={handleFileChange}
                    />
                </label>
            ) : null}
        </div>
    )
}
