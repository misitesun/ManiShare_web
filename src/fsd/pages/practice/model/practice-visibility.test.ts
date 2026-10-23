import assert from 'node:assert/strict'
import test from 'node:test'
import { canShowQuickOral, isPracticeAnswerVisible } from './practice-visibility'

test('答错保留输入，不等同揭晓或答对', (): void => {
    assert.equal(isPracticeAnswerVisible('answering'), false)
    assert.equal(isPracticeAnswerVisible('incorrect'), false)
    assert.equal(isPracticeAnswerVisible('revealed'), true)
    assert.equal(isPracticeAnswerVisible('correct'), true)
})

test('快捷口语按目标、设置、模式与阶段门控', (): void => {
    assert.equal(canShowQuickOral('word', 'pronounce', 'answering', true, true), false)
    assert.equal(canShowQuickOral('phonetics', 'pronounce', 'answering', true, true), true)
    assert.equal(canShowQuickOral('sentence', 'listen', 'answering', true, true), true)
    assert.equal(canShowQuickOral('sentence', 'read', 'answering', true, true), true)
    for (const mode of ['spell', 'dictate', 'typing'] as const) {
        assert.equal(canShowQuickOral('word', mode, 'answering', true, true), false)
        assert.equal(canShowQuickOral('word', mode, 'revealed', true, true), false)
        assert.equal(canShowQuickOral('word', mode, 'incorrect', true, true), false)
        assert.equal(canShowQuickOral('word', mode, 'correct', true, true), true)
        assert.equal(canShowQuickOral('word', mode, 'correct', true, false), false)
    }
    for (const mode of ['translate', 'blocks', 'check', 'meaning', 'guess'] as const) {
        assert.equal(canShowQuickOral('sentence', mode, 'answering', true, true), false)
        assert.equal(canShowQuickOral('sentence', mode, 'incorrect', true, true), false)
        assert.equal(canShowQuickOral('sentence', mode, 'revealed', true, true), true)
        assert.equal(canShowQuickOral('sentence', mode, 'correct', true, true), true)
    }
    for (const family of ['audio-reader', 'video-reader', 'picture-reader', 'text-reader'] as const)
        assert.equal(canShowQuickOral(family, 'read', 'correct', true, true), false)
    assert.equal(canShowQuickOral('sentence', 'listen', 'answering', false, true), false)
    assert.equal(canShowQuickOral('sentence', 'listen', 'answering', true, false), false)
    assert.equal(canShowQuickOral('sentence', 'oral', 'correct', true, true), false)
})

test('单词拼读的全部题态均不提供快捷口语，其他拼读与独立口语范围保持', (): void => {
    for (const phase of ['answering', 'incorrect', 'revealed', 'correct'] as const) {
        assert.equal(canShowQuickOral('word', 'pronounce', phase, true, true), false)
        assert.equal(canShowQuickOral('phonetics', 'pronounce', phase, true, true), true)
    }
    assert.equal(canShowQuickOral('word', 'oral', 'answering', true, true), false)
})

test('纯指法的单词和句子目标在所有题态均不提供快捷口语', (): void => {
    for (const phase of ['answering', 'incorrect', 'revealed', 'correct'] as const)
        assert.equal(canShowQuickOral('typing', 'typing', phase, true, true), false)
})
