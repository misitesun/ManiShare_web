import assert from 'node:assert/strict'
import test from 'node:test'
import { i18n, defaultLanguage } from '../index'
import { sharedConfig } from '../../config'

test('应用只初始化中文词典，不加载英文或提供语言切换选项', (): void => {
    assert.equal(defaultLanguage, 'zh-CN')
    assert.deepEqual(sharedConfig.locale.supportedLanguages, ['zh-CN'])
    assert.equal(i18n.language, 'zh-CN')
    assert.equal(i18n.t('layout.playerClub'), '玩家俱乐部')
    assert.equal(i18n.t('layout.customerService'), '客服咨询')
    assert.equal(i18n.hasResourceBundle('en-US', 'translation'), false)
})
