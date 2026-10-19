import assert from 'node:assert/strict'
import test from 'node:test'
import {
    captureShortcut,
    defaultPreferences,
    getEffectiveShortcut,
    hasLegacyControlShortcut,
    isShortcut,
    matchesShortcut,
    parsePreferences,
    shortcutError,
    shortcutFields,
} from './preferences'
import type { ShortcutInput, ShortcutPreferences } from './preferences'

function keyInput(key: string, changes: Partial<ShortcutInput> = {}): ShortcutInput {
    return { key, ctrlKey: false, altKey: false, shiftKey: false, metaKey: false, ...changes }
}

test('五项默认使用Shift且与同一捕获格式匹配', (): void => {
    assert.equal(defaultPreferences.playShortcut, 'Shift + L')
    assert.equal(defaultPreferences.masteredShortcut, 'Shift + J')
    assert.equal(defaultPreferences.unfamiliarShortcut, 'Shift + K')
    assert.equal(defaultPreferences.previousShortcut, 'Shift + ArrowLeft')
    assert.equal(defaultPreferences.nextShortcut, 'Shift + ArrowRight')
    for (const [key, shortcut] of [
        ['l', defaultPreferences.playShortcut],
        ['j', defaultPreferences.masteredShortcut],
        ['k', defaultPreferences.unfamiliarShortcut],
        ['ArrowLeft', defaultPreferences.previousShortcut],
        ['ArrowRight', defaultPreferences.nextShortcut],
    ] as const) {
        assert.equal(captureShortcut(keyInput(key, { shiftKey: true })), shortcut)
        assert.equal(matchesShortcut(keyInput(key, { shiftKey: true }), shortcut), true)
    }
    for (const { key } of shortcutFields)
        assert.equal(getEffectiveShortcut(defaultPreferences, key), defaultPreferences[key])
})

test('旧Ctrl自定义迁移为Shift，缺少切题字段仅补默认，其他设置保持', (): void => {
    const restored = parsePreferences({
        version: 1,
        values: {
            playShortcut: 'Ctrl + P',
            masteredShortcut: 'Alt + M',
            unfamiliarShortcut: 'F8',
            speechRate: 1.4,
        },
    })
    assert.equal(restored.playShortcut, 'Shift + P')
    assert.equal(restored.masteredShortcut, 'Alt + M')
    assert.equal(restored.unfamiliarShortcut, 'F8')
    assert.equal(restored.previousShortcut, 'Shift + ArrowLeft')
    assert.equal(restored.nextShortcut, 'Shift + ArrowRight')
    assert.equal(restored.speechRate, 1.4)
})

test('五项Ctrl旧缓存都迁移；非法单项不抹掉其他合法快捷键', (): void => {
    const values = {
        ...defaultPreferences,
        previousShortcut: 'Ctrl + ArrowLeft',
        nextShortcut: 'Ctrl + ArrowRight',
        playShortcut: 'Ctrl + A',
        masteredShortcut: 'Ctrl + M',
        unfamiliarShortcut: 'Ctrl + Q',
    }
    const migrated = {
        ...values,
        previousShortcut: 'Shift + ArrowLeft',
        nextShortcut: 'Shift + ArrowRight',
        playShortcut: 'Shift + A',
        masteredShortcut: 'Shift + M',
        unfamiliarShortcut: 'Shift + Q',
    }
    assert.deepEqual(parsePreferences({ version: 1, values }), migrated)
    const restored = parsePreferences({
        version: 1,
        values: { ...values, previousShortcut: 'bad shortcut' },
    })
    assert.equal(restored.previousShortcut, defaultPreferences.previousShortcut)
    assert.equal(restored.nextShortcut, migrated.nextShortcut)
    assert.equal(restored.playShortcut, migrated.playShortcut)
    assert.equal(restored.masteredShortcut, migrated.masteredShortcut)
    assert.equal(restored.unfamiliarShortcut, migrated.unfamiliarShortcut)
})

test('迁移保留其他modifier、规范顺序并去重已有Shift，不接受损坏旧字段', (): void => {
    const cached = {
        version: 1,
        values: {
            playShortcut: 'Ctrl + Alt + Shift + Meta + P',
            masteredShortcut: 'Ctrl + Alt + M',
            unfamiliarShortcut: 'Ctrl + Shift + Q',
            previousShortcut: 'Meta + ArrowLeft',
            nextShortcut: 'F8',
        },
    }
    const migrated = parsePreferences(cached)
    assert.equal(migrated.playShortcut, 'Alt + Shift + Meta + P')
    assert.equal(migrated.masteredShortcut, 'Alt + Shift + M')
    assert.equal(migrated.unfamiliarShortcut, 'Shift + Q')
    assert.equal(migrated.previousShortcut, 'Meta + ArrowLeft')
    assert.equal(migrated.nextShortcut, 'F8')
    assert.equal(hasLegacyControlShortcut(cached), true)
    assert.equal(hasLegacyControlShortcut({ version: 1, values: migrated }), false)
    for (const value of [
        null,
        { version: 2, values: cached.values },
        { version: 1, values: { playShortcut: 'Ctrl + Ctrl + A' } },
        { version: 1, values: { playShortcut: 'Alt + Ctrl + A' } },
        { version: 1, values: { playShortcut: 'Ctrl + bad' } },
        { version: 1, values: { playShortcut: 1 } },
    ])
        assert.equal(hasLegacyControlShortcut(value), false)
})

test('拒绝主流程与上下键冲突；语法合法的旧冲突值保留但不参与派发', (): void => {
    for (const reserved of ['Enter', 'Space', 'V', 'Escape', 'Esc', 'ArrowUp', 'ArrowDown']) {
        assert.ok(shortcutError(defaultPreferences, 'nextShortcut', reserved))
        assert.equal(matchesShortcut(keyInput(reserved), reserved), false)
    }
    for (const reserved of ['Space', 'ArrowUp', 'ArrowDown']) {
        const restored = parsePreferences({
            version: 1,
            values: { playShortcut: reserved, masteredShortcut: 'Alt + M' },
        })
        assert.equal(restored.playShortcut, reserved)
        assert.ok(shortcutError(restored, 'playShortcut', restored.playShortcut))
        assert.equal(getEffectiveShortcut(restored, 'playShortcut'), null)
        assert.equal(getEffectiveShortcut(restored, 'masteredShortcut'), 'Alt + M')
    }
})

test('旧合法组合与新增切题默认重复时保留双方、明确冲突且均不派发', (): void => {
    const restored = parsePreferences({
        version: 1,
        values: { playShortcut: 'Shift + ArrowLeft', unfamiliarShortcut: 'Ctrl + P' },
    })
    assert.equal(restored.playShortcut, 'Shift + ArrowLeft')
    assert.equal(restored.previousShortcut, 'Shift + ArrowLeft')
    assert.equal(getEffectiveShortcut(restored, 'playShortcut'), null)
    assert.equal(getEffectiveShortcut(restored, 'previousShortcut'), null)
    assert.equal(getEffectiveShortcut(restored, 'nextShortcut'), 'Shift + ArrowRight')
    assert.equal(getEffectiveShortcut(restored, 'unfamiliarShortcut'), 'Shift + P')
    const corrected: ShortcutPreferences = { ...restored, previousShortcut: 'Alt + ArrowLeft' }
    assert.equal(getEffectiveShortcut(corrected, 'playShortcut'), 'Shift + ArrowLeft')
    assert.equal(getEffectiveShortcut(corrected, 'previousShortcut'), 'Alt + ArrowLeft')
})

test('迁移产生的重复保留原字母并停用冲突双方，修正后恢复', (): void => {
    const restored = parsePreferences({
        version: 1,
        values: {
            playShortcut: 'Ctrl + A',
            masteredShortcut: 'Ctrl + Shift + A',
            unfamiliarShortcut: 'Alt + Q',
        },
    })
    assert.equal(restored.playShortcut, 'Shift + A')
    assert.equal(restored.masteredShortcut, 'Shift + A')
    assert.equal(getEffectiveShortcut(restored, 'playShortcut'), null)
    assert.equal(getEffectiveShortcut(restored, 'masteredShortcut'), null)
    assert.equal(getEffectiveShortcut(restored, 'unfamiliarShortcut'), 'Alt + Q')
    const corrected = { ...restored, masteredShortcut: 'Shift + M' }
    assert.equal(getEffectiveShortcut(corrected, 'playShortcut'), 'Shift + A')
    assert.equal(getEffectiveShortcut(corrected, 'masteredShortcut'), 'Shift + M')
})

test('Shift数字标点以基础键为身份，旧Ctrl主键与真实event.key匹配且兼容历史符号写法', (): void => {
    const characters = [
        ['`', '~'],
        ['1', '!'],
        ['2', '@'],
        ['3', '#'],
        ['4', '$'],
        ['5', '%'],
        ['6', '^'],
        ['7', '&'],
        ['8', '*'],
        ['9', '('],
        ['0', ')'],
        ['-', '_'],
        ['=', '+'],
        ['[', '{'],
        [']', '}'],
        ['\\', '|'],
        [';', ':'],
        ["'", '"'],
        [',', '<'],
        ['.', '>'],
        ['/', '?'],
    ] as const
    for (const [base, shifted] of characters) {
        const canonical = `Shift + ${base}`
        const explicitSymbol = `Shift + ${shifted}`
        const migrated = parsePreferences({
            version: 1,
            values: { playShortcut: `Ctrl + ${base}` },
        })
        const event = keyInput(shifted, { shiftKey: true })
        assert.equal(migrated.playShortcut, canonical)
        assert.equal(getEffectiveShortcut(migrated, 'playShortcut'), canonical)
        assert.equal(captureShortcut(event), canonical)
        assert.equal(matchesShortcut(event, canonical), true)
        assert.equal(matchesShortcut(event, explicitSymbol), true)
        assert.equal(
            parsePreferences({ version: 1, values: { playShortcut: explicitSymbol } }).playShortcut,
            canonical,
        )
    }
})

test('Shift基础键与显式符号按同一身份检测碰撞，其他modifier仍区分', (): void => {
    const aliases = {
        ...defaultPreferences,
        playShortcut: 'Shift + 1',
        masteredShortcut: 'Shift + !',
    }
    assert.ok(shortcutError(aliases, 'playShortcut', aliases.playShortcut))
    assert.ok(shortcutError(aliases, 'masteredShortcut', aliases.masteredShortcut))
    assert.equal(getEffectiveShortcut(aliases, 'playShortcut'), null)
    assert.equal(getEffectiveShortcut(aliases, 'masteredShortcut'), null)
    const migrated = parsePreferences({
        version: 1,
        values: { playShortcut: 'Ctrl + ;', masteredShortcut: 'Shift + :' },
    })
    assert.equal(migrated.playShortcut, 'Shift + ;')
    assert.equal(migrated.masteredShortcut, 'Shift + ;')
    assert.equal(getEffectiveShortcut(migrated, 'playShortcut'), null)
    assert.equal(getEffectiveShortcut(migrated, 'masteredShortcut'), null)
    const distinct = { ...aliases, masteredShortcut: 'Alt + Shift + !' }
    assert.equal(getEffectiveShortcut(distinct, 'playShortcut'), 'Shift + 1')
    assert.equal(getEffectiveShortcut(distinct, 'masteredShortcut'), 'Alt + Shift + 1')
    assert.equal(
        matchesShortcut(keyInput('!', { altKey: true, shiftKey: true }), 'Alt + Shift + 1'),
        true,
    )
    assert.equal(matchesShortcut(keyInput('!', { shiftKey: true }), 'Alt + Shift + 1'), false)
})

test('Alt与Meta旧自定义无Shift时保留符号，有Shift时仅归一明确字符而不猜物理code', (): void => {
    const restored = parsePreferences({
        version: 1,
        values: {
            playShortcut: 'Alt + !',
            masteredShortcut: 'Meta + :',
            unfamiliarShortcut: 'Shift + Meta + ?',
            previousShortcut: 'Ctrl + Alt + Shift + Meta + ;',
            nextShortcut: 'F8',
        },
    })
    assert.equal(restored.playShortcut, 'Alt + !')
    assert.equal(restored.masteredShortcut, 'Meta + :')
    assert.equal(restored.unfamiliarShortcut, 'Shift + Meta + /')
    assert.equal(restored.previousShortcut, 'Alt + Shift + Meta + ;')
    assert.equal(restored.nextShortcut, 'F8')
    assert.equal(matchesShortcut(keyInput('!', { altKey: true }), 'Alt + !'), true)
    assert.equal(matchesShortcut(keyInput(':', { metaKey: true }), 'Meta + :'), true)
    const differentPhysicalKey = { ...keyInput(':', { shiftKey: true }), code: 'Digit2' }
    assert.equal(captureShortcut(differentPhysicalKey), 'Shift + ;')
})

test('Ctrl只用于旧缓存语法，不可录入、注册或触发；Shift及其他合法自定义精确匹配', (): void => {
    assert.equal(isShortcut('Ctrl + P'), true)
    assert.equal(captureShortcut(keyInput('p', { ctrlKey: true })), null)
    assert.equal(captureShortcut(keyInput('p', { ctrlKey: true, shiftKey: true })), null)
    assert.match(shortcutError(defaultPreferences, 'playShortcut', 'Ctrl + P') ?? '', /Shift/)
    assert.equal(
        getEffectiveShortcut({ ...defaultPreferences, playShortcut: 'Ctrl + P' }, 'playShortcut'),
        null,
    )
    assert.equal(matchesShortcut(keyInput('p', { ctrlKey: true }), 'Ctrl + P'), false)
    assert.equal(matchesShortcut(keyInput('p', { ctrlKey: true }), 'Shift + P'), false)
    assert.equal(matchesShortcut(keyInput('p', { shiftKey: true }), 'Shift + P'), true)
    assert.equal(matchesShortcut(keyInput('P', { metaKey: true }), 'Meta + P'), true)
    assert.equal(matchesShortcut(keyInput('p', { altKey: true }), 'Alt + P'), true)
    assert.equal(matchesShortcut(keyInput('F8'), 'F8'), true)
    assert.equal(matchesShortcut(keyInput('p', { metaKey: true }), 'Shift + P'), false)
    assert.equal(
        matchesShortcut(keyInput('p', { ctrlKey: true, shiftKey: true }), 'Shift + P'),
        false,
    )
    assert.equal(matchesShortcut(keyInput('ArrowLeft'), 'Shift + ArrowLeft'), false)
    assert.equal(
        matchesShortcut(keyInput('ArrowDown', { shiftKey: true }), 'Shift + ArrowDown'),
        true,
    )
    assert.equal(matchesShortcut(keyInput(' '), 'Space'), false)
    assert.equal(matchesShortcut(keyInput('k', { ctrlKey: true }), 'Alt + Ctrl + K'), false)
})
