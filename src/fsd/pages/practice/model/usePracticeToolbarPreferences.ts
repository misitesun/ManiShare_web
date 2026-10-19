'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { sharedConfig } from '../../../shared/config'
import { storage } from '../../../shared/lib/storage'
import { notification } from '../../../shared/notification'
import type { PracticeFamily, PracticeMode } from './practice-demo'
import type { WordToolbarMode, WordToolbarOptions } from './word-toolbar-options'
import type { SentenceToolbarMode, SentenceToolbarOptions } from './sentence-toolbar-options'
import type { AudioToolbarMode, AudioToolbarOptions } from './audio-toolbar-options'
import type {
    AdditionalToolbarFamily,
    AdditionalToolbarOptions,
} from './additional-toolbar-options'
import {
    getAdditionalToolbarPreferences,
    getAudioToolbarPreferences,
    getPracticeToolbarScopeKey,
    getSentenceToolbarPreferences,
    getWordToolbarPreferences,
    parsePracticeToolbarPreferences,
    updatePracticeToolbarPreferences,
} from './practice-toolbar-preferences'
import type { PracticeToolbarOptions, PracticeToolbarScopes } from './practice-toolbar-preferences'

export interface PracticeToolbarPreferencesState {
    readonly ready: boolean
    readonly saveError: boolean
    readonly word: (mode: WordToolbarMode) => WordToolbarOptions
    readonly sentence: (mode: SentenceToolbarMode) => SentenceToolbarOptions
    readonly audio: (mode: AudioToolbarMode) => AudioToolbarOptions
    readonly additional: (
        family: AdditionalToolbarFamily,
        mode: PracticeMode,
    ) => AdditionalToolbarOptions
    readonly update: (
        family: PracticeFamily,
        mode: PracticeMode,
        next: PracticeToolbarOptions,
    ) => void
}

/** 由未被模式 key 重挂的 PracticePage 单次持有，不同步跨标签页。 */
export function usePracticeToolbarPreferences(): PracticeToolbarPreferencesState {
    const [preferences, setPreferences] = useState(() => parsePracticeToolbarPreferences(null))
    const preferencesRef = useRef(preferences)
    const [ready, setReady] = useState(false)
    const readyRef = useRef(false)
    const [saveError, setSaveError] = useState(false)
    const reportedError = useRef(false)
    const pendingScopes = useRef<PracticeToolbarScopes>({})

    const reportFailure = useCallback((): void => {
        setSaveError(true)
        if (reportedError.current) return
        reportedError.current = true
        notification.error('本机存储不可用，练习设置暂时仅在当前页面生效，刷新后无法恢复修改。')
    }, [])

    useEffect(() => {
        try {
            const restored = parsePracticeToolbarPreferences(
                storage.get(sharedConfig.storageKeys.practiceToolbarOptions),
            )
            preferencesRef.current = restored
            setPreferences(restored)
        } catch {
            reportFailure()
        }
        readyRef.current = true
        setReady(true)
    }, [reportFailure])

    function word(mode: WordToolbarMode): WordToolbarOptions {
        return getWordToolbarPreferences(preferences, mode)
    }

    function sentence(mode: SentenceToolbarMode): SentenceToolbarOptions {
        return getSentenceToolbarPreferences(preferences, mode)
    }

    function audio(mode: AudioToolbarMode): AudioToolbarOptions {
        return getAudioToolbarPreferences(preferences, mode)
    }

    function additional(
        family: AdditionalToolbarFamily,
        mode: PracticeMode,
    ): AdditionalToolbarOptions {
        return getAdditionalToolbarPreferences(preferences, family, mode)
    }

    function update(
        family: PracticeFamily,
        mode: PracticeMode,
        next: PracticeToolbarOptions,
    ): void {
        if (!readyRef.current) return
        const updated = updatePracticeToolbarPreferences(preferencesRef.current, family, mode, next)
        if (updated === preferencesRef.current) return
        preferencesRef.current = updated
        setPreferences(updated)
        const key = getPracticeToolbarScopeKey(family, mode)
        const options = updated.scopes[key]
        if (options === undefined) return
        pendingScopes.current = { ...pendingScopes.current, [key]: options }
        try {
            const latest = parsePracticeToolbarPreferences(
                storage.get(sharedConfig.storageKeys.practiceToolbarOptions),
            )
            const saved = parsePracticeToolbarPreferences({
                version: 1,
                scopes: { ...latest.scopes, ...pendingScopes.current },
            })
            storage.set(sharedConfig.storageKeys.practiceToolbarOptions, saved)
            pendingScopes.current = {}
            preferencesRef.current = saved
            setPreferences(saved)
            setSaveError(false)
            reportedError.current = false
        } catch {
            reportFailure()
        }
    }

    return { ready, saveError, word, sentence, audio, additional, update }
}
