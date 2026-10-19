import assert from 'node:assert/strict'
import test from 'node:test'
import {
    getDraftPanelGeometry,
    getPracticeDraft,
    reducePracticeDrafts,
    type PracticeDraftMemory,
} from './practice-draft'

test('1920设计基准保持374×703与原稿坐标，宽屏保留右侧距离', (): void => {
    assert.deepEqual(getDraftPanelGeometry({ width: 1920, height: 1080 }), {
        x: 1515.19,
        y: 198,
        width: 374,
        height: 703,
    })
    assert.deepEqual(getDraftPanelGeometry({ width: 2560, height: 1080 }), {
        x: 2155.19,
        y: 198,
        width: 374,
        height: 703,
    })
    assert.deepEqual(getDraftPanelGeometry({ width: 1280, height: 900 }), {
        x: 894,
        y: 185,
        width: 374,
        height: 703,
    })
})

test('窄屏独立限制宽高，拖动和窗口缩小后始终保留可容纳的12px边距', (): void => {
    assert.deepEqual(getDraftPanelGeometry({ width: 390, height: 844 }), {
        x: 12,
        y: 129,
        width: 366,
        height: 703,
    })
    assert.deepEqual(getDraftPanelGeometry({ width: 1920, height: 1080 }, { x: -500, y: -50 }), {
        x: 12,
        y: 12,
        width: 374,
        height: 703,
    })
    assert.deepEqual(getDraftPanelGeometry({ width: 1920, height: 1080 }, { x: 9999, y: 9999 }), {
        x: 1534,
        y: 365,
        width: 374,
        height: 703,
    })
    assert.deepEqual(getDraftPanelGeometry({ width: 1280, height: 720 }, { x: 1515.19, y: 198 }), {
        x: 894,
        y: 12,
        width: 374,
        height: 696,
    })
})

test('非法视口和坐标安全退化，超小视口不会产生负值、NaN或可见区域外的面板', (): void => {
    assert.deepEqual(getDraftPanelGeometry({ width: Number.NaN, height: -1 }), {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
    })
    assert.deepEqual(
        getDraftPanelGeometry({
            width: Number.POSITIVE_INFINITY,
            height: Number.NEGATIVE_INFINITY,
        }),
        { x: 0, y: 0, width: 0, height: 0 },
    )
    assert.deepEqual(
        getDraftPanelGeometry(
            { width: 1920, height: 1080 },
            { x: Number.NaN, y: Number.POSITIVE_INFINITY },
        ),
        getDraftPanelGeometry({ width: 1920, height: 1080 }),
    )
    for (const width of [0, 1, 12, 23, 24, 25, 390, 768, 1920]) {
        for (const height of [0, 1, 12, 23, 24, 25, 640, 844, 1080]) {
            const geometry = getDraftPanelGeometry({ width, height }, { x: 99999, y: -99999 })
            assert.ok(
                Object.values(geometry).every((value) => Number.isFinite(value) && value >= 0),
            )
            assert.ok(geometry.x + geometry.width <= width)
            assert.ok(geometry.y + geometry.height <= height)
            if (width >= 24) {
                assert.ok(geometry.x >= 12)
                assert.ok(geometry.x + geometry.width <= width - 12)
            }
            if (height >= 24) {
                assert.ok(geometry.y >= 12)
                assert.ok(geometry.y + geometry.height <= height - 12)
            }
        }
    }
})

test('系统键盘平移的可视视口使用绝对CSS坐标，拖动与重新夹紧跟随偏移', (): void => {
    const keyboardViewport = { width: 390, height: 400, offsetY: 300 }
    assert.deepEqual(getDraftPanelGeometry(keyboardViewport), {
        x: 12,
        y: 312,
        width: 366,
        height: 376,
    })
    assert.deepEqual(getDraftPanelGeometry(keyboardViewport, { x: 12, y: 129 }), {
        x: 12,
        y: 312,
        width: 366,
        height: 376,
    })
    const pannedViewport = { width: 1200, height: 900, offsetX: 80, offsetY: 60 }
    assert.deepEqual(getDraftPanelGeometry(pannedViewport), {
        x: 894,
        y: 245,
        width: 374,
        height: 703,
    })
    assert.deepEqual(getDraftPanelGeometry(pannedViewport, { x: 0, y: 9999 }), {
        x: 92,
        y: 245,
        width: 374,
        height: 703,
    })
    assert.deepEqual(
        getDraftPanelGeometry({ width: 1920, height: 1080, offsetX: 10, offsetY: 20 }),
        { x: 1525.19, y: 218, width: 374, height: 703 },
    )
})

test('非法或负可视视口偏移按零处理，缺省偏移保留原稿几何', (): void => {
    const viewport = { width: 1920, height: 1080 }
    const original = getDraftPanelGeometry(viewport)
    for (const offset of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, -300]) {
        assert.deepEqual(
            getDraftPanelGeometry({ ...viewport, offsetX: offset, offsetY: offset }),
            original,
        )
    }
    assert.deepEqual(getDraftPanelGeometry({ ...viewport, offsetX: 0, offsetY: 0 }), original)
    assert.ok(
        Object.values(
            getDraftPanelGeometry({
                width: Number.MAX_VALUE,
                height: Number.MAX_VALUE,
                offsetX: Number.MAX_VALUE,
                offsetY: Number.MAX_VALUE,
            }),
        ).every((value) => Number.isFinite(value) && value >= 0),
    )
})

test('整章scope保留编辑与已保存文本，清空后再保存才提交空文本', (): void => {
    const scope = 'course:phonetics:chapter-2'
    let memory: PracticeDraftMemory = {}
    assert.deepEqual(getPracticeDraft(memory, scope), { text: '', savedText: '' })
    memory = reducePracticeDrafts(memory, scope, { type: 'edit', text: '第一行\n第二行' })
    assert.deepEqual(getPracticeDraft(memory, scope), { text: '第一行\n第二行', savedText: '' })
    memory = reducePracticeDrafts(memory, scope, { type: 'save' })
    memory = reducePracticeDrafts(memory, scope, { type: 'edit', text: '继续编辑' })
    assert.deepEqual(getPracticeDraft(memory, scope), {
        text: '继续编辑',
        savedText: '第一行\n第二行',
    })
    memory = reducePracticeDrafts(memory, scope, { type: 'clear' })
    assert.deepEqual(getPracticeDraft(memory, scope), { text: '', savedText: '第一行\n第二行' })
    memory = reducePracticeDrafts(memory, scope, { type: 'save' })
    assert.deepEqual(getPracticeDraft(memory, scope), { text: '', savedText: '' })
})

test('不同章节隔离、切回读取原编辑，目录fallback与特殊scope不会读取原型属性', (): void => {
    const firstScope = 'course:phonetics:chapter-2'
    const otherScope = 'course:phonetics:chapter-3'
    const original: PracticeDraftMemory = {}
    let memory = reducePracticeDrafts(original, firstScope, { type: 'edit', text: '单词草稿' })
    memory = reducePracticeDrafts(memory, firstScope, { type: 'save' })
    const firstDraft = getPracticeDraft(memory, firstScope)
    memory = reducePracticeDrafts(memory, otherScope, { type: 'edit', text: '音频草稿' })
    memory = reducePracticeDrafts(memory, 'demo:word-basic', { type: 'edit', text: '目录草稿' })
    assert.equal(getPracticeDraft(memory, firstScope), firstDraft)
    assert.equal(getPracticeDraft(memory, otherScope).text, '音频草稿')
    assert.equal(getPracticeDraft(memory, 'demo:word-basic').text, '目录草稿')
    assert.deepEqual(original, {})
    for (const scope of ['constructor', '__proto__', 'toString']) {
        assert.deepEqual(getPracticeDraft(memory, scope), { text: '', savedText: '' })
        memory = reducePracticeDrafts(memory, scope, { type: 'edit', text: scope })
        assert.equal(getPracticeDraft(memory, scope).text, scope)
    }
    assert.equal(Object.getPrototypeOf(memory), Object.prototype)
    assert.equal(Object.hasOwn(Object.prototype, 'savedText'), false)
})

test('无内容变化时复用原内存快照，不新增空章节条目', (): void => {
    const memory: PracticeDraftMemory = {}
    assert.equal(reducePracticeDrafts(memory, 'demo:word-basic', { type: 'clear' }), memory)
    assert.equal(reducePracticeDrafts(memory, 'demo:word-basic', { type: 'save' }), memory)
    assert.equal(
        reducePracticeDrafts(memory, 'demo:word-basic', { type: 'edit', text: '' }),
        memory,
    )
    const edited = reducePracticeDrafts(memory, 'demo:word-basic', { type: 'edit', text: '草稿' })
    assert.equal(
        reducePracticeDrafts(edited, 'demo:word-basic', { type: 'edit', text: '草稿' }),
        edited,
    )
})
