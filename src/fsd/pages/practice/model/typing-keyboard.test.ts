import assert from 'node:assert/strict'
import test from 'node:test'
import {
    getTypingInputChange,
    getTypingInputFeedback,
    getTypingTarget,
    mapTypingCharacter,
    typingKeyboardGeometry,
    typingKeyboardKeys,
    typingKeyboardRows,
} from './typing-keyboard'

test('完整 ANSI 五行具有唯一键标识、稳定几何且每行无重叠或越界', (): void => {
    assert.equal(typingKeyboardRows.length, 5)
    assert.equal(new Set(typingKeyboardKeys.map((key) => key.code)).size, typingKeyboardKeys.length)
    for (const row of typingKeyboardRows) {
        let previousRight = 0
        for (const key of row) {
            assert.ok(key.x >= previousRight)
            assert.ok(key.width > 0 && key.height > 0)
            assert.ok(key.x + key.width <= typingKeyboardGeometry.width)
            assert.ok(key.y >= 0 && key.y + key.height <= typingKeyboardGeometry.height)
            previousRight = key.x + key.width
        }
        assert.ok(Math.abs(previousRight - 712) < 0.001)
    }
    for (const code of ['CapsLock', 'ShiftLeft', 'ShiftRight', 'Space', 'Enter', 'Backspace'])
        assert.ok(
            typingKeyboardKeys.some((key) => key.code === code),
            code,
        )
})

test('全部可打印 ASCII 字符都能映射唯一键位；字母和所有标准符号均保留', (): void => {
    for (let code = 32; code <= 126; code += 1) {
        const character = String.fromCharCode(code)
        const mapped = mapTypingCharacter(character)
        assert.ok(mapped, character)
        assert.equal(mapped.character, character)
        assert.ok(mapped.key.base === character || mapped.key.shift === character)
    }
    for (const [base, shifted, code] of [
        [';', ':', 'Semicolon'],
        ["'", '"', 'Quote'],
        ['-', '_', 'Minus'],
    ] as const) {
        assert.equal(mapTypingCharacter(base)?.key.code, code)
        assert.equal(mapTypingCharacter(shifted)?.key.code, code)
        assert.equal(mapTypingCharacter(base)?.shiftKey, null)
        assert.equal(mapTypingCharacter(shifted)?.shiftKey?.code, 'ShiftLeft')
    }
})

test('大小写共用字母键，Shift 建议使用目标手的对侧且空格不暗示修饰键', (): void => {
    assert.equal(mapTypingCharacter('a')?.key.code, 'KeyA')
    assert.equal(mapTypingCharacter('a')?.shiftKey, null)
    assert.equal(mapTypingCharacter('A')?.shiftKey?.code, 'ShiftRight')
    assert.equal(mapTypingCharacter('J')?.shiftKey?.code, 'ShiftLeft')
    assert.equal(mapTypingCharacter(' ')?.key.code, 'Space')
    assert.equal(mapTypingCharacter(' ')?.shiftKey, null)
    assert.equal(mapTypingCharacter(''), null)
    assert.equal(mapTypingCharacter('ab'), null)
    assert.equal(mapTypingCharacter('中'), null)
    assert.equal(mapTypingCharacter('😀'), null)
    assert.equal(mapTypingCharacter('’'), null)
})

test('下一目标只取原始输入首错或首缺字符，不改大小写空格或标点', (): void => {
    assert.equal(getTypingTarget('Ab c.', '')?.character, 'A')
    assert.equal(getTypingTarget('Ab c.', 'a')?.index, 0)
    assert.equal(getTypingTarget('Ab c.', 'Ab')?.key.code, 'Space')
    assert.equal(getTypingTarget('Ab c.', 'Ab xc')?.character, 'c')
    assert.equal(getTypingTarget('Ab c.', 'Ab c')?.key.code, 'Period')
    assert.equal(getTypingTarget('Ab c.', 'Ab c.'), null)
    // 多余字符不凭空生成目标键，也不代表输入完成或判对。
    assert.equal(getTypingTarget('a', 'ab'), null)
    assert.equal(getTypingTarget('', 'a'), null)
    assert.equal(getTypingTarget(undefined, 'a'), null)
    assert.equal(getTypingTarget('中a', ''), null)
    assert.equal(getTypingTarget('中a', '中')?.index, 1)
})

test('完整输入差异覆盖追加粘贴、删除、中间选择替换、重复字符和 Unicode', (): void => {
    assert.deepEqual(getTypingInputChange('', 'abc'), { index: 0, inserted: 'abc', removed: '' })
    assert.deepEqual(getTypingInputChange('abcd', 'abd'), { index: 2, inserted: '', removed: 'c' })
    assert.deepEqual(getTypingInputChange('abcd', 'aXYd'), {
        index: 1,
        inserted: 'XY',
        removed: 'bc',
    })
    assert.deepEqual(getTypingInputChange('aaaa', 'aaa'), { index: 3, inserted: '', removed: 'a' })
    assert.deepEqual(getTypingInputChange('a😀z', 'a😀bz'), {
        index: 2,
        inserted: 'b',
        removed: '',
    })
    assert.equal(getTypingInputChange('same', 'same'), null)
})

test('输入反馈提示首个插入错误或最后一个正确字符，粘贴不伪造连续物理按下', (): void => {
    const pasted = getTypingInputFeedback('', 'abc', 'abc')
    assert.equal(pasted?.kind, 'actual')
    assert.equal(pasted?.character, 'c')
    const incorrect = getTypingInputFeedback('', 'axc', 'abc')
    assert.equal(incorrect?.kind, 'error')
    assert.equal(incorrect?.character, 'x')
    assert.equal(incorrect?.key?.code, 'KeyX')
    assert.equal(getTypingInputFeedback('abc', 'ab', 'abc')?.kind, 'delete')
    assert.equal(getTypingInputFeedback('abc', 'ab', 'abc')?.key?.code, 'Backspace')
    assert.equal(getTypingInputFeedback('abc', 'aBc', 'abc')?.kind, 'error')
    assert.equal(getTypingInputFeedback('a', 'ab', 'a')?.kind, 'error')
    assert.equal(getTypingInputFeedback('', '中', undefined)?.kind, 'actual')
    assert.equal(getTypingInputFeedback('', '中', undefined)?.key, null)
    assert.equal(getTypingInputFeedback('', 'x', undefined)?.kind, 'actual')
    assert.equal(getTypingInputFeedback('abc', 'abc', 'abc'), null)
})
