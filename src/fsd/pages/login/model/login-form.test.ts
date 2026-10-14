import assert from 'node:assert/strict'
import test from 'node:test'
import {
    emptyLoginDraft,
    hasLoginFormErrors,
    validateLoginAccount,
    validateLoginDraft,
} from './login-form'

test('基础账号校验忽略首尾空白，拒绝空值与明显无效格式', (): void => {
    assert.equal(validateLoginAccount(' 13800138000 ', 'phone'), undefined)
    assert.equal(validateLoginAccount(' demo@example.com ', 'email'), undefined)
    for (const phone of ['', '123', '138001380000', '23800138000', 'abcdefghijk'])
        assert.ok(validateLoginAccount(phone, 'phone'))
    for (const email of ['', 'demo', '@example.com', 'demo@', 'de mo@example.com'])
        assert.ok(validateLoginAccount(email, 'email'))
})

test('密码登录只要求账号及密码，验证码登录只要求账号及验证码', (): void => {
    const phonePassword = {
        ...emptyLoginDraft,
        account: '13800138000',
        password: 'example-password',
    }
    assert.equal(hasLoginFormErrors(validateLoginDraft('phone-password', phonePassword)), false)
    assert.equal(validateLoginDraft('phone-password', emptyLoginDraft).password, '请输入登录密码')
    assert.equal(validateLoginDraft('phone-password', phonePassword).code, undefined)
    const emailCode = { ...emptyLoginDraft, account: 'demo@example.com', code: 'example-code' }
    assert.equal(hasLoginFormErrors(validateLoginDraft('email-code', emailCode)), false)
    assert.equal(
        validateLoginDraft('email-code', { ...emailCode, code: '  ' }).code,
        '请输入验证码',
    )
    assert.equal(validateLoginDraft('email-password', emailCode).password, '请输入登录密码')
    assert.equal(validateLoginDraft('phone-code', phonePassword).code, '请输入验证码')
})

test('注册校验账号、验证码、密码及协议，邀请码可以留空', (): void => {
    const draft = {
        ...emptyLoginDraft,
        account: '13800138000',
        code: 'example-code',
        password: 'example-password',
        agreed: true,
    }
    assert.equal(hasLoginFormErrors(validateLoginDraft('register-phone', draft)), false)
    assert.equal(
        hasLoginFormErrors(
            validateLoginDraft('register-email', { ...draft, account: 'demo@example.com' }),
        ),
        false,
    )
    assert.ok(validateLoginDraft('register-phone', { ...draft, agreed: false }).agreed)
    assert.ok(validateLoginDraft('register-phone', { ...draft, password: '' }).password)
    assert.ok(validateLoginDraft('register-phone', { ...draft, code: '' }).code)
    assert.equal(draft.invitation, '')
})

test('介绍与微信预览不产生虚构的表单要求', (): void => {
    for (const view of ['welcome', 'wechat', 'register-wechat'] as const)
        assert.deepEqual(validateLoginDraft(view, emptyLoginDraft), {})
})
