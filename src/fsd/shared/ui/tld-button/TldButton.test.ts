import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { TldButton } from './TldButton'

test('笔记紧凑保存按钮保留原生禁用和表单语义', (): void => {
    const html = renderToStaticMarkup(
        createElement(TldButton, {
            size: 'note-action',
            variant: 'solid',
            disabled: true,
            type: 'submit',
            children: '保存',
        }),
    )
    assert.match(html, /type="submit"/)
    assert.match(html, /disabled=""/)
    assert.match(html, />保存<\/span>/)
})

test('小尺寸纯色按钮透传原生属性，不改变默认按钮的提交语义', (): void => {
    const html = renderToStaticMarkup(
        createElement(
            TldButton,
            {
                size: 'mini',
                variant: 'solid',
                disabled: true,
                'aria-label': '复制邀请链接',
            },
            '复制邀请链接',
        ),
    )
    assert.match(html, /<button[^>]*type="button"/)
    assert.match(html, /<button[^>]*disabled=""/)
    assert.match(html, /aria-label="复制邀请链接"/)
})

test('表单及描边按钮保留原生提交、禁用和可访问名称', (): void => {
    const markup = renderToStaticMarkup(
        createElement(
            TldButton,
            {
                size: 'form',
                variant: 'outline',
                type: 'submit',
                disabled: true,
                'aria-label': '注册账号',
            },
            '注册',
        ),
    )
    assert.match(markup, /<button[^>]*type="submit"/)
    assert.match(markup, /<button[^>]*disabled=""/)
    assert.match(markup, /aria-label="注册账号"/)
    assert.match(markup, />注册<\/span>/)
})

test('默认和弹窗操作尺寸都保留非提交按钮语义', (): void => {
    for (const props of [
        {},
        { size: 'dialog-action' as const },
        { size: 'dialog-compact' as const },
        { size: 'dialog-emphasis' as const },
        { size: 'dialog-slim' as const },
        { size: 'panel-action' as const },
    ]) {
        const markup = renderToStaticMarkup(createElement(TldButton, props, '确认'))
        assert.match(markup, /<button[^>]*type="button"/)
        assert.match(markup, />确认<\/span>/)
    }
})

test('紧凑弹窗主次操作保留原生禁用、访问描述及类型', (): void => {
    for (const variant of ['primary', 'soft'] as const) {
        const html = renderToStaticMarkup(
            createElement(
                TldButton,
                {
                    size: 'dialog-compact',
                    variant,
                    disabled: true,
                    'aria-describedby': 'unavailable-reason',
                    type: 'button',
                },
                '下一章',
            ),
        )
        assert.match(html, /<button[^>]*disabled=""/)
        assert.match(html, /<button[^>]*aria-describedby="unavailable-reason"/)
        assert.match(html, /<button[^>]*type="button"/)
    }
})

test('TldButton forwards native accessibility and disabled attributes', (): void => {
    const markup = renderToStaticMarkup(
        createElement(
            TldButton,
            {
                'aria-label': '提交练习',
                disabled: true,
                type: 'submit',
                variant: 'secondary',
            },
            '提交',
        ),
    )

    assert.match(markup, /<button[^>]*aria-label="提交练习"/)
    assert.match(markup, /<button[^>]*disabled=""/)
    assert.match(markup, /<button[^>]*type="submit"/)
})

test('套餐尺寸保留原生按钮属性及可访问名称', (): void => {
    const markup = renderToStaticMarkup(
        createElement(
            TldButton,
            { size: 'plan', disabled: true, 'aria-label': '购买学习卡' },
            '立即购买',
        ),
    )
    assert.match(markup, /<button[^>]*type="button"/)
    assert.match(markup, /<button[^>]*disabled=""/)
    assert.match(markup, /aria-label="购买学习卡"/)
    assert.match(markup, />立即购买<\/span>/)
})

test('轻表面与紧凑套餐按钮保持原生禁用和键盘提交语义', (): void => {
    const markup = renderToStaticMarkup(
        createElement(
            TldButton,
            {
                size: 'plan-compact',
                variant: 'subtle',
                disabled: true,
                type: 'submit',
                'aria-label': '已领取体验卡',
            },
            '已领取',
        ),
    )
    assert.match(markup, /<button[^>]*disabled=""/)
    assert.match(markup, /<button[^>]*type="submit"/)
    assert.match(markup, /aria-label="已领取体验卡"/)
    assert.match(markup, />已领取<\/span>/)
})

test('short soft action preserves native confirmation and disabled attributes', (): void => {
    const html = renderToStaticMarkup(
        createElement(
            TldButton,
            {
                size: 'short',
                variant: 'soft',
                type: 'button',
                disabled: true,
                'aria-label': '取消房间',
            },
            '取消房间',
        ),
    )
    assert.match(html, /type="button"/)
    assert.match(html, /disabled=""/)
    assert.match(html, /aria-label="取消房间"/)
    assert.match(html, />取消房间<\/span>/)
})

test('宽表单操作尺寸保持主次按钮的提交和禁用语义', (): void => {
    for (const variant of ['primary', 'soft'] as const) {
        const html = renderToStaticMarkup(
            createElement(
                TldButton,
                {
                    size: 'form-wide',
                    variant,
                    type: 'submit',
                    name: 'action',
                    value: 'confirm',
                    disabled: true,
                },
                '确认',
            ),
        )
        assert.match(html, /type="submit"/)
        assert.match(html, /name="action"/)
        assert.match(html, /value="confirm"/)
        assert.match(html, /disabled=""/)
        assert.match(html, />确认<\/span>/)
    }
})
