import { useEffect, useId, useState } from 'react'
import type { ChangeEvent, ReactElement } from 'react'
import addIconSource from './assets/add.svg'
import removeIconSource from './assets/remove.svg'
import { appendImageFiles, normalizeImageLimit, removeImageFile } from './image-files'

interface ImagePreview {
    readonly file: File
    readonly source: string
}

export interface TldImageUploadProps {
    readonly accept?: string
    readonly disabled?: boolean
    readonly files: readonly File[]
    readonly label: string
    readonly maxFiles?: number
    readonly onFilesChange: (files: readonly File[]) => void
}

export function TldImageUpload({
    accept = 'image/*',
    disabled = false,
    files,
    label,
    maxFiles = 1,
    onFilesChange,
}: TldImageUploadProps): ReactElement {
    const inputId = useId()
    const [previews, setPreviews] = useState<readonly ImagePreview[]>([])
    const fileLimit = normalizeImageLimit(maxFiles)

    useEffect(() => {
        const nextPreviews = files.map((file) => ({
            file,
            source: URL.createObjectURL(file),
        }))
        setPreviews(nextPreviews)

        return (): void => {
            nextPreviews.forEach((preview) => URL.revokeObjectURL(preview.source))
        }
    }, [files])

    function handleFileChange(event: ChangeEvent<HTMLInputElement>): void {
        const incomingFiles = Array.from(event.currentTarget.files ?? [])
        onFilesChange(appendImageFiles(files, incomingFiles, fileLimit))
        event.currentTarget.value = ''
    }

    return (
        <div className="flex flex-wrap gap-2.5" aria-label={label}>
            {previews.map((preview, index) => (
                <div
                    key={`${preview.file.name}-${preview.file.lastModified}-${index}`}
                    className="relative size-24 overflow-hidden rounded-[5px] border border-dashed border-strong bg-surface md:size-[130px]"
                >
                    <img
                        alt={preview.file.name}
                        className="size-full object-cover"
                        src={preview.source}
                    />
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
                        disabled
                            ? 'grid size-24 cursor-not-allowed place-items-center rounded-[5px] border border-dashed border-strong bg-surface opacity-50 md:size-[130px]'
                            : 'grid size-24 cursor-pointer place-items-center rounded-[5px] border border-dashed border-strong bg-surface transition-colors hover:bg-surface-hover md:size-[130px] motion-reduce:transition-none'
                    }
                >
                    <span className="sr-only">{label}</span>
                    <img
                        alt=""
                        aria-hidden="true"
                        className="size-[18px] [filter:var(--app-filter-dialog-icon)]"
                        src={addIconSource}
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
