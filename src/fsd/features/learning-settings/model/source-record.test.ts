import assert from 'node:assert/strict'
import test from 'node:test'
import { defaultPreferences, preferenceGroups, settingsTabs, shortcutFields } from './preferences'

// 独立转录自 2026-10-13 七 Tab 人工记录；答题卡片更新为 2026-10-15 Figma 2539:7828。
// 发音、专项、特效及快捷键以2026-10-15用户提供的4张截图与确认选项为准，系统Tab明确保留。
// 外观字段由2026-10-15确认的ManiShare 1150:76755和1150:76754覆盖。
// 答对动画由2026-10-19确认的哇学社当前7份原版Lottie覆盖，旧5项粒子值回退首项。
// 图片位置、视频位置按2026-10-15最新布局方案，在首项增加“默认”；已有初始值保留。
test('七 Tab 的字段、选项顺序和数值范围与来源记录逐项一致', (): void => {
    assert.deepEqual(
        settingsTabs.map(({ label }) => label),
        ['发音', '专项', '答题', '特效', '外观', '快捷键', '系统'],
    )
    const expectedKeys = {
        pronunciation: ['voice', 'speechRate', 'speechVolume', 'readCount', 'readInterval'],
        specialized: [
            'readAfterEvaluation',
            'showEvaluation',
            'autoReadOnCorrect',
            'imagePosition',
            'imageSize',
            'videoPosition',
            'maskSubtitles',
        ],
        effects: [
            'correctEffect',
            'correctEffectType',
            'completionEffect',
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
            'transitionSound',
            'evaluationSound',
        ],
        answer: [
            'showPhonetics',
            'ignoreCase',
            'ignoreNames',
            'autoNextOnCorrect',
            'answerAfterErrors',
        ],
        appearance: [
            'backgroundDim',
            'backgroundBlur',
            'answerColor',
            'textColor',
            'showPhonetics',
            'font',
            'border',
            'fontSize',
            'showAnswerPhonetics',
            'showPartOfSpeech',
            'showGrammarText',
            'showGrammarFill',
            'grammarBrightness',
            'grammarFontSize',
            'answerBlur',
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
        imagePosition: ['默认', '左', '右'],
        imageSize: ['大', '中', '小'],
        videoPosition: ['默认', '左侧', '右侧'],
        correctEffectType: [
            'lottie-0',
            'lottie-1',
            'lottie-2',
            'lottie-4',
            'lottie-5',
            'lottie-6',
            'lottie-7',
        ],
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
        completionTone: [
            '章节完成音效1',
            '落幕（默认）',
            '终章',
            '礼赞',
            '星河',
            '收束',
            '凯旋',
            '花火',
            '余韵',
        ],
        answerAfterErrors: [
            '从不',
            '错误1次后',
            '错误2次后',
            '错误3次后',
            '错误4次后',
            '错误5次后',
        ],
        font: ['默认字体', '圆体', '无衬线西文体', '现代体', '圆角黑体'],
        border: ['实线', '虚线'],
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
        backgroundDim: [0, 100],
        backgroundBlur: [0, 30],
        grammarBrightness: [1, 10],
        answerBlur: [1, 10],
    })
    assert.deepEqual(shortcutFields, [
        { key: 'playShortcut', label: '朗读' },
        { key: 'masteredShortcut', label: '掌握' },
        { key: 'unfamiliarShortcut', label: '不熟' },
        { key: 'previousShortcut', label: '上一题' },
        { key: 'nextShortcut', label: '下一题' },
    ])
    assert.deepEqual(
        [
            defaultPreferences.playShortcut,
            defaultPreferences.masteredShortcut,
            defaultPreferences.unfamiliarShortcut,
            defaultPreferences.previousShortcut,
            defaultPreferences.nextShortcut,
        ],
        ['Shift + L', 'Shift + J', 'Shift + K', 'Shift + ArrowLeft', 'Shift + ArrowRight'],
    )
})
