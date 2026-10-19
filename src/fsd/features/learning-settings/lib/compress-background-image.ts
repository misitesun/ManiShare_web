import {
    getBackgroundDimensions,
    getBackgroundFileError,
    maxBackgroundSourceLength,
    maxBackgroundFileBytes,
} from '../model/practice-background'
import type { PracticeBackgroundImage } from '../model/practice-background'

function readImageSource(file: File): Promise<string> {
    return new Promise((resolve, reject): void => {
        const reader = new FileReader()
        const cleanup = (): void => {
            reader.onload = null
            reader.onerror = null
            reader.onabort = null
        }
        reader.onload = (): void => {
            cleanup()
            if (typeof reader.result === 'string') resolve(reader.result)
            else reject(new Error('无法读取图片文件，请重新选择。'))
        }
        reader.onerror = reader.onabort = (): void => {
            cleanup()
            reject(new Error('无法读取图片文件，请重新选择。'))
        }
        reader.readAsDataURL(file)
    })
}

function loadImage(source: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject): void => {
        const image = new Image()
        image.onload = (): void => {
            image.onload = null
            image.onerror = null
            resolve(image)
        }
        image.onerror = (): void => {
            image.onload = null
            image.onerror = null
            reject(new Error('无法读取这张图片，请选择有效的JPG、PNG或WebP图片。'))
        }
        image.src = source
    })
}

export async function compressBackgroundImage(file: File): Promise<PracticeBackgroundImage> {
    if (file.size > maxBackgroundFileBytes) throw new Error('图片不能超过10MB，请选择较小的图片。')
    const header = new Uint8Array(await file.slice(0, 12).arrayBuffer())
    const error = getBackgroundFileError(file.size, header)
    if (error !== null) throw new Error(error)
    const source = await readImageSource(file)
    const canvas = document.createElement('canvas')
    try {
        const image = await loadImage(source)
        if (image.naturalWidth < 1 || image.naturalHeight < 1)
            throw new Error('图片尺寸无效，请重新选择。')
        const dimensions = getBackgroundDimensions(image.naturalWidth, image.naturalHeight)
        const context = canvas.getContext('2d')
        if (context === null) throw new Error('当前浏览器无法处理背景图，请稍后重试。')
        for (let attempt = 0; attempt < 8; attempt++) {
            const scale = attempt < 4 ? 1 : 0.75 ** (attempt - 3)
            canvas.width = Math.max(1, Math.round(dimensions.width * scale))
            canvas.height = Math.max(1, Math.round(dimensions.height * scale))
            context.drawImage(image, 0, 0, canvas.width, canvas.height)
            const quality = attempt < 4 ? 0.86 - attempt * 0.12 : 0.7
            let encoded = canvas.toDataURL('image/webp', quality)
            if (!encoded.startsWith('data:image/webp;base64,'))
                encoded = canvas.toDataURL('image/jpeg', quality)
            if (encoded.length <= maxBackgroundSourceLength) {
                return {
                    version: 1,
                    source: encoded,
                    name: file.name.slice(0, 120),
                    width: canvas.width,
                    height: canvas.height,
                }
            }
        }
        throw new Error('图片压缩后仍过大，请选择画面较简洁的图片。')
    } finally {
        canvas.width = 0
        canvas.height = 0
    }
}
