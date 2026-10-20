import assert from 'node:assert/strict'
import test from 'node:test'
import { getPracticeToolbarDescription } from './practice-toolbar-description'

test('工具栏辅助说明只描述调用方的真实选项，听力删行后不残留拆分或抄写', (): void => {
    const description = getPracticeToolbarDescription('sentence', ['imageVisible', 'cutReading'])
    assert.match(description, /图片/)
    assert.match(description, /切读/)
    assert.doesNotMatch(description, /完整|拆分|默写|抄写/)
    assert.equal(getPracticeToolbarDescription('sentence', []), '')
    assert.equal(getPracticeToolbarDescription('audio', []), '')
})

test('其他模式仍按真实配置描述拆分、输入和翻译，音标保留常驻开关说明', (): void => {
    const description = getPracticeToolbarDescription('sentence', [
        'split',
        'copy',
        'translationVisible',
    ])
    assert.match(description, /完整\/拆分/)
    assert.match(description, /默写\/抄写/)
    assert.match(description, /翻译/)
    assert.doesNotMatch(description, /图片|切读/)
    assert.match(getPracticeToolbarDescription('phonetics', []), /自然拼读/)
    assert.doesNotMatch(
        getPracticeToolbarDescription('video', ['sentenceAnalysisVisible']),
        /完整\/拆分/,
    )
})
