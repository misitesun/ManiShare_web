import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
    chapterCompleteAnimation,
    correctAnimations,
    getLearningAnimation,
    resolveCorrectAnimationId,
} from './feedback-animations'
import { defaultPreferences, parsePreferences } from './preferences'

test('原版七种动画保留来源顺序、速度、完整矢量数据和独立章节烟花', async (): Promise<void> => {
    assert.deepEqual(
        correctAnimations.map(({ id, speed }) => [id, speed]),
        [
            ['lottie-0', 1],
            ['lottie-1', 1],
            ['lottie-2', 1.5],
            ['lottie-4', 1.5],
            ['lottie-5', 1.5],
            ['lottie-6', 1.5],
            ['lottie-7', 1],
        ],
    )
    const all = [...correctAnimations, chapterCompleteAnimation]
    for (const animation of all) {
        assert.equal(getLearningAnimation(animation.id), animation)
        const data = await animation.loadData()
        assert.ok(data.w > 0 && data.h > 0 && data.fr > 0 && data.op > data.ip)
        assert.ok(data.layers.length > 0)
        // These source files are self-contained; no remote image/font completion requests are needed.
        assert.doesNotMatch(
            JSON.stringify(data),
            /https?:\/\/|"p":"(?:data:|[^"]+\.(?:png|jpg|webp))"|"fonts":/,
        )
    }
    const completion = await chapterCompleteAnimation.loadData()
    assert.equal((completion.op - completion.ip) / completion.fr, 4)
})

test('全部旧粒子值兼容回退首份原版，七份新选择逐项恢复且不清空其他偏好', (): void => {
    for (const value of ['🎊', '🎊🎊🎊', '🐸', '🎉', '✨']) {
        assert.equal(resolveCorrectAnimationId(value), 'lottie-0')
        const restored = parsePreferences({
            version: 1,
            values: {
                ...defaultPreferences,
                correctEffectType: value,
                readingWave: '雨滴点阵',
                correctEffect: false,
            },
        })
        assert.equal(restored.correctEffectType, 'lottie-0')
        assert.equal(restored.readingWave, '雨滴点阵')
        assert.equal(restored.correctEffect, false)
    }
    for (const { id } of correctAnimations)
        assert.equal(
            parsePreferences({ version: 1, values: { correctEffectType: id } }).correctEffectType,
            id,
        )
    for (const value of [null, 3, 'lottie-3', '未知'])
        assert.equal(resolveCorrectAnimationId(value), null)
})

test('八份动画文件与迁入时记录的原始文件摘要一致', (): void => {
    const expected: readonly [string, string][] = [
        ['correct-0.json', 'c8a8a1cd0e5b0da7fd14c5844b275ff0a5ec6536490674655310a9e9a79e2fc7'],
        ['correct-1.json', 'f39ef63c792fa9808a26f652e94ecd0e86aaf31cd5f9612060942219dcc1a893'],
        ['correct-2.json', 'e18b09d40f0431419ace6066b9a6237057319c4a5da8d5ce523c5d126434cf52'],
        ['correct-4.json', 'a71a94405417bca52b4fe720da34c2059b7bdf99a8123b4c0d8c0922c9bfab82'],
        ['correct-5.json', '6614ef69bfc4abf3867486dce44a5a1c7caaa939297c118af6a4ffec38747a58'],
        ['correct-6.json', 'b7015b8bc08911f354b4eaf87494a85de91c35586a2590108aff5ebc006f4fbf'],
        ['correct-7.json', '20b4ad73a8bf55bda17554b70ad083fd89c1eb7108b8b66919eb4d27d982d5b0'],
        [
            'chapter-complete.json',
            '9f1f8e8fd65a4410e38ad1ac99446855e1cbf6288b6ba1289a419ae10eefb4ee',
        ],
    ]
    for (const [file, hash] of expected) {
        const bytes = readFileSync(new URL('../assets/feedback/' + file, import.meta.url))
        assert.equal(createHash('sha256').update(bytes).digest('hex'), hash, file)
    }
})
