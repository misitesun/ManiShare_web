import assert from 'node:assert/strict'
import test from 'node:test'
import { existsSync } from 'node:fs'
import { getOralAssessmentPlaybackStatus } from './oral-assessment-playback'
import { getDemoQuestions } from './practice-demo'
import { getWordDemoReadingSource } from './word-demo-reading'

test('单词口语十题各自绑定对应单词音源，共用指法文件但保持题目身份独立', (): void => {
    const oral = getDemoQuestions('word', 'oral')
    const typing = getDemoQuestions('word', 'typing')
    assert.equal(oral.length, 10)
    assert.equal(new Set(oral.map((question) => question.id)).size, 10)
    assert.equal(new Set(oral.map((question) => question.english)).size, 10)
    for (const [index, question] of oral.entries()) {
        assert.equal(question.id, `oral:${question.english}`)
        assert.notEqual(question.id, typing[index]?.id)
        assert.equal(question.readingSource, getWordDemoReadingSource(question.english))
        assert.equal(question.readingSource, typing[index]?.readingSource)
        assert.ok(question.readingSource && existsSync(`public${question.readingSource}`))
    }
    assert.equal(getWordDemoReadingSource(' Woman '), oral[0]?.readingSource)
    for (const missing of [
        'unknown-word',
        'I like apples.',
        '../woman',
        '__proto__',
        'toString',
        '',
    ])
        assert.equal(getWordDemoReadingSource(missing), undefined)
    assert.equal(getDemoQuestions('word', 'dictate').length, 12)
    assert.equal(getDemoQuestions('word', 'spell').length, 12)
    assert.equal(getDemoQuestions('word', 'meaning').length, 10)
    assert.equal(getDemoQuestions('guess', 'guess').length, 2)
})

test('等待提示音和play请求不代表playing，真实结束、暂停及拒绝恢复静态', (): void => {
    for (const status of ['unavailable', 'loading', 'ready', 'paused', 'ended', 'error'] as const) {
        assert.notEqual(
            getOralAssessmentPlaybackStatus({ status, error: null, playRequested: false }),
            'playing',
        )
        assert.equal(
            getOralAssessmentPlaybackStatus({ status, error: null, playRequested: true }),
            'pending',
        )
    }
    assert.equal(
        getOralAssessmentPlaybackStatus({ status: 'playing', error: null, playRequested: true }),
        'playing',
    )
    assert.equal(
        getOralAssessmentPlaybackStatus({ status: 'ended', error: null, playRequested: false }),
        'stopped',
    )
    assert.equal(
        getOralAssessmentPlaybackStatus({ status: 'paused', error: null, playRequested: false }),
        'stopped',
    )
    assert.equal(
        getOralAssessmentPlaybackStatus({
            status: 'error',
            error: 'blocked',
            playRequested: false,
        }),
        'error',
    )
})
