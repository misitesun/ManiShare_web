import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { PracticeWordSlotsInput } from './PracticeWordSlotsInput'
import type { PracticeWordSlotsInputProps } from './PracticeWordSlotsInput'

function rejectAction(): never {
    throw new Error('预渲染不能修改作答、提交或注册控制器')
}
function renderInput(props: Partial<PracticeWordSlotsInputProps> = {}): string {
    return renderToStaticMarkup(
        createElement(PracticeWordSlotsInput, {
            target: 'Hi there.',
            value: '',
            onChange: rejectAction,
            blocked: false,
            phase: 'answering',
            onSubmit: rejectAction,
            onController: rejectAction,
            onCursorChange: rejectAction,
            ...props,
        }),
    )
}

test('整词外观复用通用输入器，一个真实输入承接所有词，标点不占编辑位置', (): void => {
    const html = renderInput({ value: 'Hi th' })
    assert.equal((html.match(/<input\b/g) ?? []).length, 1)
    assert.match(html, /data-practice-controlled-answer="true"/)
    assert.match(html, /<input[^>]*value="Hith"/)
    assert.match(html, /data-answer-cursor="4"/)
    assert.equal((html.match(/data-word-slot="\d+"/g) ?? []).length, 2)
    assert.match(html, /data-word-slot="0"[^>]*data-word-slot-value="Hi"/)
    assert.match(html, /data-word-slot="1"[^>]*data-word-slot-value="th"/)
    assert.match(html, /data-word-slot-punctuation="true"[^>]*>\.<\/span>/)
})

test('默写与抄写只改变空位字形，均不自动填入答案，也不增加原生Tab项', (): void => {
    for (const showWordHint of [false, true]) {
        const html = renderInput({ target: 'apple', value: 'app', showWordHint })
        assert.match(html, /<input[^>]*value="app"/)
        assert.match(html, /data-answer-cursor="3"/)
        const tags = html.match(/<button\b[^>]*>/g) ?? []
        assert.equal(tags.length, 1)
        assert.ok(tags.every((tag) => tag.includes('tabindex="-1"')))
        assert.equal((html.match(/data-word-slot-character="missing"/g) ?? []).length, 2)
        if (showWordHint)
            assert.match(html, /data-word-slot-character="missing" class="text-practice-muted"/)
        else assert.match(html, /data-word-slot-character="missing" class="invisible"/)
        assert.doesNotMatch(html, /autofocus/)
    }
})

test('显式反馈定位首错，过期反馈不套新值；输入未补齐时不挤占下一词', (): void => {
    const feedback = {
        value: 'cx dog',
        slots: [{ index: 0, states: ['correct', 'incorrect', 'missing'] as const }],
    }
    const html = renderInput({
        target: 'cat dog',
        value: feedback.value,
        feedback,
        phase: 'incorrect',
    })
    assert.match(html, /data-spelling-errors="1,2"/)
    assert.match(html, /data-answer-cursor="1"/)
    assert.match(html, /data-word-slot="0"[^>]*data-word-slot-value="cx"/)
    assert.match(html, /data-word-slot="1"[^>]*data-word-slot-value="dog"/)
    assert.match(html, /data-word-slot-character="incorrect" class="text-danger"/)
    assert.match(
        renderInput({ target: 'cat dog', value: 'cat dog', feedback }),
        /data-spelling-errors=""/,
    )
})

test('阻断、字号和整词虚线继续生效，Unicode文字与数字采用同一位置模型', (): void => {
    const html = renderInput({
        target: 'Hi 中文 123!',
        value: 'Hi 中',
        blocked: true,
        displayFontSize: 52,
        compact: true,
        borderStyle: 'dashed',
    })
    assert.match(html, /style="font-size:52px"/)
    assert.match(html, /<input[^>]*disabled=""[^>]*value="Hi中"/)
    assert.match(html, /style="border-bottom-style:dashed"/)
    assert.ok((html.match(/<button\b[^>]*>/g) ?? []).every((tag) => tag.includes('disabled=""')))
    assert.equal((html.match(/data-word-slot="\d+"/g) ?? []).length, 3)
})
