import assert from 'node:assert/strict'
import test from 'node:test'
import { defaultPreferences, preferenceGroups, settingsTabs, shortcutFields } from './preferences'

// 独立转录自 2026-10-13 哇学社七 Tab 人工记录，不从被测配置生成预期值。
test('七 Tab 的字段、选项顺序和数值范围与来源记录逐项一致', (): void => {
    assert.deepEqual(
        settingsTabs.map(({ label }) => label),
        ['发音', '音效', '答题', '听力', '个性化', '快捷键', '系统'],
    )
    const expectedKeys = {
        pronunciation: [
            'voice',
            'autoReadOnChange',
            'autoReadOnCorrect',
            'speechRate',
            'speechVolume',
            'readCount',
            'readInterval',
            'readAfterEvaluation',
        ],
        sound: [
            'transitionSound',
            'evaluationSound',
            'typingSound',
            'typingTone',
            'typingVolume',
            'correctSound',
            'correctTone',
            'correctVolume',
            'errorSound',
            'errorTone',
            'errorVolume',
            'completionSound',
            'completionTone',
            'completionVolume',
        ],
        answer: [
            'showTranslation',
            'showPhonetics',
            'handwriting',
            'inputCompatibility',
            'showEvaluation',
            'autoNextOnCorrect',
            'ignoreNames',
            'ignoreCase',
            'autoShowAnswer',
            'answerAfterErrors',
        ],
        listening: ['chapterEnd', 'autoNextOnRead'],
        appearance: [
            'font',
            'border',
            'fontSize',
            'grammarFontSize',
            'grammarColor',
            'grammarBrightness',
            'answerBlur',
            'correctEffect',
            'correctEffectType',
            'completionEffect',
            'answerColor',
            'textColor',
            'backgroundColor',
            'recordingWave',
            'readingWave',
        ],
        shortcuts: [],
        system: [],
    }
    for (const { id } of settingsTabs)
        assert.deepEqual(
            preferenceGroups[id].flatMap(({ fields }) => fields.map(({ key }) => key)),
            expectedKeys[id],
            id,
        )

    const fields = Object.values(preferenceGroups).flatMap((groups) =>
        groups.flatMap(({ fields }) => fields),
    )
    const options = Object.fromEntries(
        fields.flatMap((field) =>
            field.kind === 'select' || field.kind === 'radio' ? [[field.key, field.options]] : [],
        ),
    )
    assert.deepEqual(options, {
        voice: ['美式女音', '美式男音', '英式女音', '英式男音'],
        typingTone: [
            '原键（默认）',
            '跳音',
            '轻键',
            '清响',
            '短点',
            '木扣',
            '拖尾',
            '快键',
            '回弹',
            '明铃',
            '点按',
            '弹片',
            '暗扣',
        ],
        correctTone: ['清音（默认）', '清悦'],
        errorTone: ['轻警（默认）', '低鸣', '短促', '顿响', '警示', '闷扣'],
        completionTone: ['落幕（默认）', '终章', '礼赞', '星河', '收束', '凯旋', '花火', '余韵'],
        answerAfterErrors: [
            '从不',
            '错误1次后',
            '错误2次后',
            '错误3次后',
            '错误4次后',
            '错误5次后',
        ],
        chapterEnd: ['结束朗读', '循环播放', '自动下一章'],
        font: ['默认字体', '圆体', '无衬线西文体', '现代体', '圆角黑体'],
        border: ['实线', '虚线', '点线'],
        fontSize: [
            '小二号',
            '小一号',
            '默认',
            '一号',
            '二号',
            '三号',
            '四号',
            '五号',
            '六号',
            '七号',
        ],
        grammarFontSize: ['默认', '一号', '二号', '三号', '四号', '五号', '六号', '七号'],
        correctEffectType: ['🎊', '🎊🎊🎊', '🐸', '🎉', '✨'],
        recordingWave: ['默认竖条', '曲线频谱', '矩阵方块', '雨滴点阵', '波形线条'],
        readingWave: ['默认竖条', '曲线频谱', '矩阵方块', '雨滴点阵', '波形线条'],
    })
    const ranges = Object.fromEntries(
        fields.flatMap((field) =>
            field.kind === 'range' ? [[field.key, [field.min, field.max]]] : [],
        ),
    )
    assert.deepEqual(ranges, {
        speechRate: [0.5, 2],
        speechVolume: [1, 100],
        readCount: [1, 5],
        readInterval: [1, 3],
        typingVolume: [1, 100],
        correctVolume: [1, 100],
        errorVolume: [1, 100],
        completionVolume: [1, 100],
        grammarBrightness: [1, 10],
        answerBlur: [1, 10],
    })
    assert.deepEqual(shortcutFields, [
        { key: 'playShortcut', label: '播放朗读' },
        { key: 'masteredShortcut', label: '标记掌握' },
        { key: 'unfamiliarShortcut', label: '标记生词' },
    ])
    assert.deepEqual(
        [
            defaultPreferences.playShortcut,
            defaultPreferences.masteredShortcut,
            defaultPreferences.unfamiliarShortcut,
        ],
        ['Ctrl + A', 'Ctrl + M', 'Ctrl + Q'],
    )
})
