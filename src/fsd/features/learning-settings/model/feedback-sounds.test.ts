import assert from 'node:assert/strict'
import test from 'node:test'
import { statSync } from 'node:fs'
import { getLearningSoundPreview, learningSoundAssets } from './feedback-sounds'
import { defaultPreferences, parsePreferences, preferenceGroups } from './preferences'

test('四类29种真实音色逐项有本地文件，完整交互注册表对应37个不同资源', (): void => {
    const prefixes: Readonly<Record<string, string | undefined>> = {
        typingTone: 'typing',
        correctTone: 'correct',
        errorTone: 'incorrect',
        completionTone: 'chapterComplete',
    }
    let choices = 0
    for (const group of preferenceGroups.effects) {
        for (const field of group.fields) {
            const prefix = prefixes[field.key]
            if (!prefix || field.kind !== 'select') continue
            for (const option of field.options) {
                const asset = learningSoundAssets[`${prefix}:${option}`]
                assert.ok(asset, option)
                assert.ok(statSync(new URL(asset.src)).size > 0)
                choices += 1
            }
        }
    }
    assert.equal(choices, 29)
    const sources = new Set(
        Object.values(learningSoundAssets).flatMap((asset) => (asset ? [asset.src] : [])),
    )
    assert.equal(sources.size, 37)
    for (const source of sources) assert.ok(statSync(new URL(source)).size > 0)
    assert.match(learningSoundAssets['typing:跳音']?.src ?? '', /type\/12\.mp3$/)
    assert.match(learningSoundAssets['typing:轻键']?.src ?? '', /type\/1\.mp3$/)
    assert.match(learningSoundAssets['correct:清悦']?.src ?? '', /success\/1\.wav$/)
})

test('移除旧完成音色并默认落幕，历史值回退落幕且保留其他声音偏好', (): void => {
    assert.equal(defaultPreferences.completionTone, '落幕（默认）')
    const restored = parsePreferences({
        version: 1,
        values: {
            completionTone: '章节完成音效1',
            completionVolume: 32,
            typingTone: '跳音',
            correctSound: false,
        },
    })
    assert.equal(restored.completionTone, '落幕（默认）')
    assert.equal(restored.completionVolume, 32)
    assert.equal(restored.typingTone, '跳音')
    assert.equal(restored.correctSound, false)
    assert.equal(learningSoundAssets['chapterComplete:章节完成音效1'], undefined)
    assert.match(
        getLearningSoundPreview(restored, 'chapterComplete').asset?.src ?? '',
        /finish\/0\.mp3$/,
    )
})

test('设置试听沿同一音色和对应音量，只有开关的切题／评价用固定基准', (): void => {
    const values = {
        ...defaultPreferences,
        typingVolume: 17,
        correctVolume: 23,
        errorVolume: 31,
        completionVolume: 45,
        typingSound: false,
    }
    assert.equal(getLearningSoundPreview(values, 'typing').volume, 0.17)
    assert.equal(getLearningSoundPreview(values, 'typing').enabled, false)
    assert.equal(getLearningSoundPreview(values, 'correct').volume, 0.23)
    assert.equal(getLearningSoundPreview(values, 'incorrect').volume, 0.31)
    assert.equal(getLearningSoundPreview(values, 'chapterComplete').volume, 0.45)
    assert.equal(getLearningSoundPreview(values, 'questionChange').volume, 0.4)
    assert.equal(getLearningSoundPreview(values, 'evaluationComplete').volume, 1)
})
