import assert from 'node:assert/strict'
import test from 'node:test'
import {
    accountKindForView,
    loginViewQuery,
    loginViews,
    parseLoginView,
    passwordViewForAccount,
    registrationViewForAccount,
} from './login-view'

test('登录入口只接受九种明确视图，未知参数返回介绍页', (): void => {
    for (const view of loginViews) assert.equal(parseLoginView(view), view)
    for (const value of [null, '', 'login', '../profile/', '<script>', 'PHONE-PASSWORD'])
        assert.equal(parseLoginView(value), 'welcome')
    assert.equal(loginViews.length, 9)
})

test('切换认证视图保留其他查询值，返回介绍只删除视图参数', (): void => {
    const next = loginViewQuery('keep=1&from=a%2Fb&view=phone-password', 'email-code')
    const query = new URLSearchParams(next)
    assert.equal(query.get('view'), 'email-code')
    assert.equal(query.get('keep'), '1')
    assert.equal(query.get('from'), 'a/b')
    assert.equal(loginViewQuery(next, 'welcome'), 'keep=1&from=a%2Fb')
    assert.equal(loginViewQuery('', 'welcome'), '')
})

test('账号类型及登录注册往返对应正确方式', (): void => {
    assert.equal(accountKindForView('email-password'), 'email')
    assert.equal(accountKindForView('email-code'), 'email')
    assert.equal(accountKindForView('register-email'), 'email')
    assert.equal(accountKindForView('phone-code'), 'phone')
    assert.equal(passwordViewForAccount('email'), 'email-password')
    assert.equal(passwordViewForAccount('phone'), 'phone-password')
    assert.equal(registrationViewForAccount('email'), 'register-email')
    assert.equal(registrationViewForAccount('phone'), 'register-phone')
})
