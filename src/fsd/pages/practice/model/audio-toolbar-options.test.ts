import assert from 'node:assert/strict'
import test from 'node:test'
import {
    audioToolbarRows,
    createAudioToolbarOptions,
    getAudioToolbarTranslationOverride,
    isAudioToolbarMode,
    type AudioToolbarMode,
} from './audio-toolbar-options'

const modes: readonly AudioToolbarMode[] = [
    'listen',
    'read',
    'translate',
    'check',
    'typing',
    'oral',
    'blocks',
]

test('音频工具栏只接受音频游戏的七种合法模式', (): void => {
    for (const mode of modes) assert.equal(isAudioToolbarMode(mode), true)
    for (const value of [
        '',
        'audio',
        'audio-reader',
        'pronounce',
        'spell',
        'dictate',
        'meaning',
        'guess',
        'Listen',
        'read ',
        'toString',
    ])
        assert.equal(isAudioToolbarMode(value), false)
})

test('音频中译英和指法默认抄写，所有显示与切读开关初始开启', (): void => {
    for (const mode of modes) {
        const options = createAudioToolbarOptions(mode)
        assert.equal(options.copy, mode === 'translate' || mode === 'typing')
        assert.equal(options.imageVisible, true)
        assert.equal(options.translationVisible, true)
        assert.equal(options.cutReading, true)
        assert.equal('split' in options, false)
    }
})

test('每次创建音频局部设置均相互独立，修改不污染其他模式或重进初值', (): void => {
    for (const mode of modes) {
        const current = createAudioToolbarOptions(mode)
        const original = createAudioToolbarOptions(mode)
        assert.notEqual(current, original)
        current.copy = !current.copy
        current.imageVisible = false
        current.translationVisible = false
        current.cutReading = false
        assert.deepEqual(createAudioToolbarOptions(mode), original)
    }
    assert.equal(createAudioToolbarOptions('translate').copy, true)
    assert.equal(createAudioToolbarOptions('typing').copy, true)
    assert.equal(createAudioToolbarOptions('blocks').copy, false)
})

test('音频七模式按确认顺序配置设置行，阅读无设置且任何模式都无拆分', (): void => {
    assert.deepEqual(audioToolbarRows, {
        listen: ['imageVisible', 'cutReading'],
        read: [],
        translate: ['copy', 'imageVisible', 'translationVisible', 'cutReading'],
        check: ['imageVisible', 'cutReading'],
        typing: ['copy', 'imageVisible', 'cutReading'],
        oral: ['imageVisible', 'translationVisible', 'cutReading'],
        blocks: ['imageVisible', 'translationVisible', 'cutReading'],
    })
})

test('局部翻译仅覆盖音频中译英、口语和拼块，不改变其他音频模式的既有规则', (): void => {
    for (const mode of ['translate', 'oral', 'blocks'] as const)
        for (const translationVisible of [false, true])
            assert.equal(
                getAudioToolbarTranslationOverride(mode, {
                    ...createAudioToolbarOptions(mode),
                    translationVisible,
                }),
                translationVisible,
            )
    for (const mode of ['listen', 'read', 'check', 'typing'] as const)
        for (const translationVisible of [false, true])
            assert.equal(
                getAudioToolbarTranslationOverride(mode, {
                    ...createAudioToolbarOptions(mode),
                    translationVisible,
                }),
                undefined,
            )
})
