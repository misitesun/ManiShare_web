import assert from 'node:assert/strict'
import { test } from 'node:test'
import { chatInputReducer, initialChatInput } from './chat-input'

test('默认文字输入，切换语音并切回后保留草稿', () => {
    assert.equal(initialChatInput.voiceMode, false)
    const edited = chatInputReducer(initialChatInput, { type: 'edit', value: 'Hello Sarah' })
    const voice = chatInputReducer(edited, { type: 'toggle-mode' })
    assert.equal(voice.voiceMode, true)
    assert.equal(voice.draft, 'Hello Sarah')
    assert.deepEqual(chatInputReducer(voice, { type: 'toggle-mode' }), edited)
    assert.equal(initialChatInput.draft, '')
})
