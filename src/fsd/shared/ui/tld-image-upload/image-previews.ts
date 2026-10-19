export interface ImagePreview {
    readonly file: File
    readonly source: string | null
    readonly status: 'loading' | 'ready' | 'error'
}

export interface ImageDataReader {
    readonly read: (file: File, onLoad: (source: string) => void, onError: () => void) => void
    readonly abort: () => void
}

/** 每次文件集合持有独立读取会话；关闭后不再交付迟到的结果。 */
export function createDataUrlPreviewSession(
    files: readonly File[],
    createReader: () => ImageDataReader,
    onPreviewsChange: (previews: readonly ImagePreview[]) => void,
): () => void {
    let active = true
    let previews: readonly ImagePreview[] = files.map((file) => ({
        file,
        source: null,
        status: 'loading',
    }))
    const readers = files.map(() => createReader())
    onPreviewsChange(previews)

    function updatePreview(index: number, source: string | null): void {
        if (!active) return
        previews = previews.map((preview, previewIndex) =>
            previewIndex === index
                ? { ...preview, source, status: source === null ? 'error' : 'ready' }
                : preview,
        )
        onPreviewsChange(previews)
    }

    readers.forEach((reader, index) => {
        const file = files[index]
        if (file === undefined) return
        try {
            reader.read(
                file,
                (source): void => updatePreview(index, source),
                (): void => updatePreview(index, null),
            )
        } catch {
            updatePreview(index, null)
        }
    })

    return (): void => {
        active = false
        readers.forEach((reader) => reader.abort())
    }
}

export function createBrowserImageDataReader(): ImageDataReader {
    const reader = new FileReader()
    return {
        read(file, onLoad, onError): void {
            reader.onload = (): void => {
                if (typeof reader.result === 'string') onLoad(reader.result)
                else onError()
            }
            reader.onerror = onError
            reader.readAsDataURL(file)
        },
        abort(): void {
            reader.onload = null
            reader.onerror = null
            if (reader.readyState === FileReader.LOADING) reader.abort()
        },
    }
}
