'use client'

import { useEffect, useRef, useState } from 'react'
import { sharedConfig } from '../../../shared/config'
import { storage } from '../../../shared/lib/storage'
import { notification } from '../../../shared/notification'
import { defaultPreferences, hasLegacyControlShortcut, parsePreferences } from './preferences'
import type { LearningPreferences } from './preferences'

export interface LearningPreferencesState {
    values: LearningPreferences
    ready: boolean
    saveError: boolean
    update: <K extends keyof LearningPreferences>(key: K, value: LearningPreferences[K]) => void
    patch: (changes: Partial<LearningPreferences>) => void
    replace: (values: LearningPreferences) => void
}

interface RestoredLearningPreferences {
    values: LearningPreferences
    saveError: boolean
}

/** 挂载后调用；恢复与一次性 Ctrl 迁移回写共用原偏好键。 */
export function restoreLearningPreferences(): RestoredLearningPreferences {
    let stored: unknown
    try {
        stored = storage.get(sharedConfig.storageKeys.learningPreferences)
    } catch {
        return { values: { ...defaultPreferences }, saveError: true }
    }
    const values = parsePreferences(stored)
    if (hasLegacyControlShortcut(stored)) {
        try {
            storage.set(sharedConfig.storageKeys.learningPreferences, { version: 1, values })
        } catch {
            return { values, saveError: true }
        }
    }
    return { values, saveError: false }
}

export function useLearningPreferences(): LearningPreferencesState {
    const [values, setValues] = useState<LearningPreferences>({ ...defaultPreferences })
    const [ready, setReady] = useState(false)
    const [saveError, setSaveError] = useState(false)
    const valuesRef = useRef(values)
    const reportedError = useRef(false)
    const restored = useRef(false)
    useEffect(() => {
        if (restored.current) return
        restored.current = true
        const result = restoreLearningPreferences()
        valuesRef.current = result.values
        setValues(result.values)
        if (result.saveError) reportStorageError()
        setReady(true)
    }, [])

    function reportStorageError(): void {
        setSaveError(true)
        if (!reportedError.current) {
            reportedError.current = true
            notification.error('本机存储不可用，修改暂时仅在当前页面生效，刷新后无法恢复。')
        }
    }

    function replace(next: LearningPreferences): void {
        if (!ready) return
        valuesRef.current = next
        setValues(next)
        try {
            storage.set(sharedConfig.storageKeys.learningPreferences, { version: 1, values: next })
            setSaveError(false)
            reportedError.current = false
        } catch {
            reportStorageError()
        }
    }

    function update<K extends keyof LearningPreferences>(
        key: K,
        value: LearningPreferences[K],
    ): void {
        patch({ [key]: value })
    }

    function patch(changes: Partial<LearningPreferences>): void {
        replace({ ...valuesRef.current, ...changes })
    }

    return { values, ready, saveError, update, patch, replace }
}
