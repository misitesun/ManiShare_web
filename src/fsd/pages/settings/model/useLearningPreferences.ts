'use client'

import { useEffect, useRef, useState } from 'react'
import { sharedConfig } from '../../../shared/config'
import { storage } from '../../../shared/lib/storage'
import { notification } from '../../../shared/notification'
import { defaultPreferences, parsePreferences } from './preferences'
import type { LearningPreferences } from './preferences'

interface LearningPreferencesState {
    values: LearningPreferences
    ready: boolean
    saveError: boolean
    update: <K extends keyof LearningPreferences>(key: K, value: LearningPreferences[K]) => void
    replace: (values: LearningPreferences) => void
}

export function useLearningPreferences(): LearningPreferencesState {
    const [values, setValues] = useState<LearningPreferences>({ ...defaultPreferences })
    const [ready, setReady] = useState(false)
    const [saveError, setSaveError] = useState(false)
    const valuesRef = useRef(values)
    const reportedError = useRef(false)
    useEffect(() => {
        try {
            const restored = parsePreferences(
                storage.get(sharedConfig.storageKeys.learningPreferences),
            )
            valuesRef.current = restored
            setValues(restored)
        } catch {
            setSaveError(true)
        }
        setReady(true)
    }, [])

    function replace(next: LearningPreferences): void {
        if (!ready) return
        valuesRef.current = next
        setValues(next)
        try {
            storage.set(sharedConfig.storageKeys.learningPreferences, { version: 1, values: next })
            setSaveError(false)
            reportedError.current = false
        } catch {
            setSaveError(true)
            if (!reportedError.current) {
                reportedError.current = true
                notification.error('本机存储不可用，修改暂时仅在当前页面生效，刷新后无法恢复。')
            }
        }
    }

    function update<K extends keyof LearningPreferences>(
        key: K,
        value: LearningPreferences[K],
    ): void {
        replace({ ...valuesRef.current, [key]: value })
    }

    return { values, ready, saveError, update, replace }
}
