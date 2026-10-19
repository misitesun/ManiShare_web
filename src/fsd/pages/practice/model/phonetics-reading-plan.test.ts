import assert from 'node:assert/strict'
import test from 'node:test'
import { createPhoneticsReadingPlan, describePhoneticsReadingPlan } from './phonetics-reading-plan'

test('音标自然拼读开启为四阶段，整词分别位于音段前后', () => {
    assert.deepEqual(createPhoneticsReadingPlan(true), [
        'target-phonetic',
        'word',
        'phonics',
        'word',
    ])
    assert.equal(describePhoneticsReadingPlan(true), '目标音标 → 单词 → 自然拼读音段 → 单词')
})

test('关闭自然拼读只保留目标音标与整词，不保留末尾重复整词', () => {
    assert.deepEqual(createPhoneticsReadingPlan(false), ['target-phonetic', 'word'])
    assert.equal(describePhoneticsReadingPlan(false), '目标音标 → 单词')
})
