'use client'

import { useEffect, useRef, useState } from 'react'
import { sharedConfig } from '../../../shared/config'
import { storage } from '../../../shared/lib/storage'
import { notification } from '../../../shared/notification'
import { compressBackgroundImage } from '../lib/compress-background-image'
import { parseBackgroundImage } from './practice-background'
import type { PracticeBackgroundImage } from './practice-background'

export interface PracticeBackgroundState {
    readonly image: PracticeBackgroundImage | null
    readonly ready: boolean
    readonly busy: boolean
    readonly error: string | null
    readonly upload: (file: File) => Promise<boolean>
    readonly remove: () => boolean
}

export function usePracticeBackgroundImage(): PracticeBackgroundState {
    const [image, setImage] = useState<PracticeBackgroundImage | null>(null)
    const [ready, setReady] = useState(false)
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const request = useRef({ id: 0 })
    useEffect(() => {
        const lifecycle = request.current
        try {
            const saved = storage.get(sharedConfig.storageKeys.practiceBackgroundImage)
            const restored = parseBackgroundImage(saved)
            setImage(restored)
            if (saved !== null && restored === null) setError('已保存的背景图无效，请重新上传。')
        } catch {
            setError('无法读取本机背景图，请检查浏览器存储权限。')
        }
        setReady(true)
        return (): void => {
            lifecycle.id++
        }
    }, [])

    async function upload(file: File): Promise<boolean> {
        if (!ready) return false
        const current = ++request.current.id
        setBusy(true)
        setError(null)
        try {
            let next: PracticeBackgroundImage
            try {
                next = await compressBackgroundImage(file)
            } catch (cause) {
                if (current !== request.current.id) return false
                const message =
                    cause instanceof Error && /[\u4e00-\u9fff]/.test(cause.message)
                        ? cause.message
                        : '背景图处理失败，请换一张图片重试。'
                setError(message)
                notification.error(message)
                return false
            }
            if (current !== request.current.id) return false
            try {
                storage.set(sharedConfig.storageKeys.practiceBackgroundImage, next)
            } catch {
                const message = '背景图保存失败，可能是本机存储已满或不可用；原背景图已保留。'
                setError(message)
                notification.error(message)
                return false
            }
            setImage(next)
            return true
        } finally {
            if (current === request.current.id) setBusy(false)
        }
    }

    function remove(): boolean {
        if (!ready || busy) return false
        try {
            storage.remove(sharedConfig.storageKeys.practiceBackgroundImage)
            setImage(null)
            setError(null)
            return true
        } catch {
            const message = '背景图移除失败，请检查本机存储后重试。'
            setError(message)
            notification.error(message)
            return false
        }
    }

    return { image, ready, busy, error, upload, remove }
}
