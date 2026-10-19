import assert from 'node:assert/strict'
import test from 'node:test'
import { sharedConfig } from '../../config'
import { storage } from './storage'

test('背景图片使用独立登记键保存，移除不影响偏好，清理项目数据涵盖新键', (): void => {
    const previous = Object.getOwnPropertyDescriptor(globalThis, 'window')
    const entries = new Map<string, string>()
    Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: {
            localStorage: {
                getItem(key: string): string | null {
                    return entries.get(key) ?? null
                },
                setItem(key: string, value: string): void {
                    entries.set(key, value)
                },
                removeItem(key: string): void {
                    entries.delete(key)
                },
            },
        },
    })
    try {
        const payload = { version: 1, source: 'opaque-owner-validated-image' }
        storage.set(sharedConfig.storageKeys.learningPreferences, {
            version: 1,
            values: { font: '现代体' },
        })
        storage.set(sharedConfig.storageKeys.practiceBackgroundImage, payload)
        assert.deepEqual(storage.get(sharedConfig.storageKeys.practiceBackgroundImage), payload)
        storage.remove(sharedConfig.storageKeys.practiceBackgroundImage)
        assert.equal(storage.get(sharedConfig.storageKeys.practiceBackgroundImage), null)
        assert.notEqual(storage.get(sharedConfig.storageKeys.learningPreferences), null)
        storage.set(sharedConfig.storageKeys.practiceBackgroundImage, payload)
        entries.set('unrelated', 'preserve')
        storage.clearAppStorage()
        assert.equal(storage.get(sharedConfig.storageKeys.practiceBackgroundImage), null)
        assert.equal(entries.get('unrelated'), 'preserve')
    } finally {
        if (previous === undefined) Reflect.deleteProperty(globalThis, 'window')
        else Object.defineProperty(globalThis, 'window', previous)
    }
})

test('练习工具栏缓存是独立unknown容器，单独移除和项目清理不触及第三方键', (): void => {
    const previous = Object.getOwnPropertyDescriptor(globalThis, 'window')
    const entries = new Map<string, string>()
    Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: {
            localStorage: {
                getItem(key: string): string | null {
                    return entries.get(key) ?? null
                },
                setItem(key: string, value: string): void {
                    entries.set(key, value)
                },
                removeItem(key: string): void {
                    entries.delete(key)
                },
            },
        },
    })
    try {
        assert.equal(
            sharedConfig.storageKeys.practiceToolbarOptions,
            'english-learning-practice-toolbar-options-v1',
        )
        const payload = { version: 1, scopes: { 'audio:translate': { copy: false } } }
        storage.set(sharedConfig.storageKeys.learningPreferences, { version: 1, values: {} })
        storage.set(sharedConfig.storageKeys.theme, 'light')
        storage.set(sharedConfig.storageKeys.practiceToolbarOptions, payload)
        assert.deepEqual(storage.get(sharedConfig.storageKeys.practiceToolbarOptions), payload)
        storage.remove(sharedConfig.storageKeys.practiceToolbarOptions)
        assert.equal(storage.get(sharedConfig.storageKeys.practiceToolbarOptions), null)
        assert.notEqual(storage.get(sharedConfig.storageKeys.learningPreferences), null)
        assert.equal(storage.get(sharedConfig.storageKeys.theme), 'light')
        storage.set(sharedConfig.storageKeys.practiceToolbarOptions, payload)
        entries.set('third-party-cache', 'preserve')
        storage.clearAppStorage()
        assert.equal(storage.get(sharedConfig.storageKeys.practiceToolbarOptions), null)
        assert.equal(entries.get('third-party-cache'), 'preserve')
    } finally {
        if (previous === undefined) Reflect.deleteProperty(globalThis, 'window')
        else Object.defineProperty(globalThis, 'window', previous)
    }
})

test('工具栏缓存的存储访问异常继续交由页面owner处理', (): void => {
    const previous = Object.getOwnPropertyDescriptor(globalThis, 'window')
    Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: {
            localStorage: {
                getItem(): never {
                    throw new Error('storage read denied')
                },
                setItem(): never {
                    throw new Error('storage quota exceeded')
                },
                removeItem(): never {
                    throw new Error('storage removal denied')
                },
            },
        },
    })
    try {
        assert.throws(
            (): unknown => storage.get(sharedConfig.storageKeys.practiceToolbarOptions),
            /storage read denied/,
        )
        assert.throws(
            (): void => storage.set(sharedConfig.storageKeys.practiceToolbarOptions, {}),
            /storage quota exceeded/,
        )
        assert.throws(
            (): void => storage.remove(sharedConfig.storageKeys.practiceToolbarOptions),
            /storage removal denied/,
        )
    } finally {
        if (previous === undefined) Reflect.deleteProperty(globalThis, 'window')
        else Object.defineProperty(globalThis, 'window', previous)
    }
})
