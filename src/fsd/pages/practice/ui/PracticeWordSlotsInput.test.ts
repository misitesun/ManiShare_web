import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { PracticeWordSlotsInput } from './PracticeWordSlotsInput'
import type { PracticeWordSlotsInputProps } from './PracticeWordSlotsInput'

function ignoreChange(): void {}

function renderInput(props: Partial<PracticeWordSlotsInputProps> = {}): string {
    return renderToStaticMarkup(
        createElement(PracticeWordSlotsInput, {
            target: 'Hi there.',
            value: '',
            onChange: ignoreChange,
            blocked: false,
            phase: 'answering',
            ...props,
        }),
    )
}

test('默认及默写均不显示提示，抄写只显示剩余目标，原生值和词槽数量保持一致', (): void => {
    const props = { target: 'Apple', value: 'AP' }
    const copying = renderInput({ ...props, showWordHint: true })
    assert.match(copying, /data-word-slot-hint-remaining="true">ple<\/span>/)
    assert.match(copying, /data-word-slot-placeholder="true"[^>]*>APple<\/span>/)
    assert.match(copying, /data-word-slot-answer[^>]*text-left/)
    for (const markup of [
        copying,
        renderInput({ ...props, showWordHint: false }),
        renderInput(props),
    ]) {
        assert.match(markup, /<input[^>]*value="AP"/)
        assert.equal((markup.match(/<input\b/g) ?? []).length, 1)
        assert.equal((markup.match(/data-word-slot="\d+"/g) ?? []).length, 1)
    }
    assert.doesNotMatch(renderInput(props), /data-word-slot-hint/)
    assert.doesNotMatch(renderInput({ ...props, showWordHint: false }), /data-word-slot-hint/)
})

test('抄写保留错误原文和反馈，输入完成或超长后不留下提示，也不截断真实录入', (): void => {
    const wrong = renderInput({
        target: 'cat',
        value: 'Cx',
        showWordHint: true,
        phase: 'incorrect',
        feedback: {
            value: 'Cx',
            slots: [{ index: 0, states: ['correct', 'incorrect', 'missing'] }],
        },
    })
    assert.match(wrong, /<input[^>]*value="Cx"/)
    assert.match(wrong, /data-word-slot-hint-remaining="true">t<\/span>/)
    assert.match(wrong, /data-word-slot-character="incorrect"/)
    for (const value of ['cat', 'cats', 'CAT']) {
        const markup = renderInput({ target: 'cat', value, showWordHint: true })
        assert.ok(markup.includes(`value="${value}"`))
        assert.doesNotMatch(markup, /data-word-slot-hint/)
    }
})

test('显式反馈分段显示正确错误缺失多余，下划线独立且不增加输入框', (): void => {
    const markup = renderInput({
        target: 'cat dog',
        value: 'cx dogs',
        phase: 'incorrect',
        feedback: {
            value: 'cx dogs',
            slots: [
                { index: 0, states: ['correct', 'incorrect', 'missing'] },
                { index: 1, states: ['correct', 'correct', 'correct', 'extra'] },
            ],
        },
    })
    assert.equal((markup.match(/<input\b/g) ?? []).length, 1)
    assert.match(markup, /<input[^>]*value="cx dogs"/)
    for (const state of ['correct', 'incorrect', 'missing', 'extra'])
        assert.match(markup, new RegExp('data-word-slot-character="' + state + '"'))
    assert.match(markup, /data-word-slot-placeholder-character="true" class="invisible">t<\/span>/)
    assert.match(markup, /data-word-slot-feedback-measure/)
    assert.doesNotMatch(
        renderInput({ value: 'cx', phase: 'incorrect' }),
        /data-word-slot-character=/,
    )
})

test('整词展示保留一个完整的原生文本输入和独立标点', (): void => {
    const markup = renderInput({ value: 'hi ' })
    assert.equal((markup.match(/<input\b/g) ?? []).length, 1)
    assert.match(markup, /<input[^>]*type="text"[^>]*value="hi "/)
    assert.match(markup, /<input[^>]*aria-label="练习答案"/)
    assert.equal((markup.match(/data-word-slot="\d+"/g) ?? []).length, 2)
    assert.match(markup, /data-word-slot="0"[^>]*data-word-slot-value="hi"/)
    assert.match(markup, /data-word-slot="1"[^>]*data-word-slot-target="there"/)
    assert.match(markup, /data-word-slot-punctuation="true"[^>]*>\.<\/span>/)
    assert.match(markup, /data-word-slot-placeholder="true"[^>]*>hi<\/span>/)
    assert.match(markup, /data-word-slot-placeholder="true"[^>]*>there<\/span>/)
})

test('可视词槽不增加原生Tab顺序，也不在预渲染时抢焦点', (): void => {
    const markup = renderInput()
    const inputTag = markup.match(/<input\b[^>]*>/)?.[0] ?? ''
    const buttonTags = markup.match(/<button\b[^>]*>/g) ?? []
    assert.equal(buttonTags.length, 2)
    assert.ok(buttonTags.every((tag): boolean => tag.includes('tabindex="-1"')))
    assert.ok(buttonTags.every((tag): boolean => tag.includes('type="button"')))
    assert.doesNotMatch(inputTag, /tabindex="-1"| autofocus[= >]| readonly[= >]| disabled[= >]/)
    assert.match(markup, /<label for="[^"]+"[^>]*>练习答案<\/label>/)
    assert.match(markup, /data-word-slot-focused="false"/)
    assert.ok(buttonTags.every((tag): boolean => tag.includes('data-word-slot-active="false"')))
})

test('词槽严格按题目数量渲染，尾空格和超额粘贴不会增加输入线', (): void => {
    for (const value of ['woman ', 'woman   ', 'woman another word'])
        assert.equal(
            (renderInput({ target: 'woman', value }).match(/data-word-slot="\d+"/g) ?? []).length,
            1,
        )
    assert.equal(
        (
            renderInput({ target: 'how are you', value: 'how are you ' }).match(
                /data-word-slot="\d+"/g,
            ) ?? []
        ).length,
        3,
    )
})

test('外部全文、用户字号与禁用状态保持在同一个输入节点', (): void => {
    const value = 'Hi   there. 中文输入 123!'
    const markup = renderInput({
        value,
        blocked: true,
        phase: 'incorrect',
        displayFontSize: 52,
        borderStyle: 'dashed',
        compact: true,
    })
    assert.match(markup, /style="font-size:52px"/)
    assert.match(markup, /data-word-slot-phase="incorrect"/)
    assert.match(markup, /<input[^>]*disabled=""[^>]*value="Hi   there\. 中文输入 123!"/)
    assert.ok(
        (markup.match(/<button\b[^>]*>/g) ?? []).every((tag): boolean => /disabled=""/.test(tag)),
    )
    assert.match(markup, /style="border-bottom-style:dashed"/)
})

test('空目标仍有可编辑槽，超长词与输入原文均保留', (): void => {
    const empty = renderInput({ target: '' })
    assert.match(empty, /data-word-slot="0"/)
    const target = 'pneumonoultramicroscopicsilicovolcanoconiosis'
    const markup = renderInput({ target, value: `${target}extra` })
    assert.match(markup, /data-word-slot-target="pneumonoultramicroscopicsilicovolcanoconiosis"/)
    assert.match(
        markup,
        /data-word-slot-value="pneumonoultramicroscopicsilicovolcanoconiosisextra"/,
    )
    assert.match(
        markup,
        /data-word-slot-answer="true"[^>]*>pneumonoultramicroscopicsilicovolcanoconiosisextra<\/span>/,
    )
})

test('独立纯标点不占词索引，全标点目标仍保留可点击的输入槽', (): void => {
    const punctuated = renderInput({ target: 'Hi , there .' })
    assert.equal((punctuated.match(/data-word-slot="\d+"/g) ?? []).length, 2)
    assert.match(punctuated, /data-word-slot="1"[^>]*data-word-slot-target="there"/)
    assert.match(punctuated, /data-word-slot-punctuation="true"[^>]*>,<\/span>/)
    assert.match(punctuated, /data-word-slot-punctuation="true"[^>]*>\.<\/span>/)
    const punctuationOnly = renderInput({ target: '...' })
    assert.equal((punctuationOnly.match(/data-word-slot="\d+"/g) ?? []).length, 1)
    assert.match(punctuationOnly, /data-word-slot="0"[^>]*data-word-slot-target=""/)
    assert.match(punctuationOnly, /data-word-slot-punctuation="true"[^>]*>\.\.\.<\/span>/)
})

test('存在尚未输入的后词时，预渲染不补空格或回写父层原生全文', (): void => {
    const changes: string[] = []
    const markup = renderInput({
        target: 'brush teeth',
        value: 'brush',
        onChange: (nextValue): void => {
            changes.push(nextValue)
        },
    })
    assert.deepEqual(changes, [])
    assert.match(markup, /<input[^>]*value="brush"/)
    assert.match(markup, /data-word-slot="1"[^>]*data-word-slot-value=""/)
})

test('长大写输入保留真实字形测宽层及小写占位，显示文本不截断', (): void => {
    const value = 'W'.repeat(120)
    const markup = renderInput({ target: 'word', value })
    assert.match(markup, new RegExp(`data-word-slot-input-measure="true"[^>]*>${value}<\\/span>`))
    assert.match(
        markup,
        new RegExp(`data-word-slot-placeholder="true"[^>]*>${value.toLowerCase()}<\\/span>`),
    )
    assert.match(markup, new RegExp(`data-word-slot-answer="true"[^>]*>${value}<\\/span>`))
    assert.match(markup, /data-word-slot-scroll="0"/)
})

test('可视滚动节点保留原生UTF-16边界，已剥离标点不混入可见文本', (): void => {
    const markup = renderInput({ target: 'first “word.”', value: 'first “W😀W.”' })
    assert.match(markup, /data-word-slot-scroll="1"/)
    assert.match(
        markup,
        /data-word-slot="1"[^>]*data-word-slot-value="W😀W"[^>]*data-word-slot-start="6"[^>]*data-word-slot-end="13"/,
    )
    assert.match(markup, /data-word-slot-answer="true"[^>]*>W😀W<\/span>/)
    assert.match(markup, /<input[^>]*value="first “W😀W.”"/)
})
