import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { withdrawalRecordPages } from '../model/withdrawal-records'
import { WithdrawalRecordTable } from './WithdrawalRecordTable'

test('默认与对比外观保留同一提现字段、审核状态和收款码入口', (): void => {
    for (const appearance of ['default', 'contrasted'] as const) {
        const html = renderToStaticMarkup(
            createElement(WithdrawalRecordTable, {
                appearance,
                items: withdrawalRecordPages[0] ?? [],
                status: 'idle',
                onLoadNextPage: (): void => undefined,
            }),
        )
        for (const label of ['审核中', '审核失败', '审核通过', '收款码不清晰', '已打款']) {
            assert.ok(html.includes(label))
        }
        assert.match(html, /aria-label="查看提现 1 的收款码"/)
        assert.match(html, /aria-label="查看提现 3 的收款码"/)
        assert.match(html, /62109338<br\/>90934890/)
        assert.match(html, /¥100/)
        assert.doesNotMatch(html, /role="dialog"/)
    }
})
