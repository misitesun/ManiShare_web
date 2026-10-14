export interface LearningPreferences {
    voice: string
    autoReadOnChange: boolean
    autoReadOnCorrect: boolean
    speechRate: number
    speechVolume: number
    readCount: number
    readInterval: number
    readAfterEvaluation: boolean
    transitionSound: boolean
    evaluationSound: boolean
    typingSound: boolean
    typingTone: string
    typingVolume: number
    correctSound: boolean
    correctTone: string
    correctVolume: number
    errorSound: boolean
    errorTone: string
    errorVolume: number
    completionSound: boolean
    completionTone: string
    completionVolume: number
    showTranslation: boolean
    showPhonetics: boolean
    handwriting: boolean
    inputCompatibility: boolean
    showEvaluation: boolean
    autoNextOnCorrect: boolean
    ignoreNames: boolean
    ignoreCase: boolean
    autoShowAnswer: boolean
    answerAfterErrors: string
    chapterEnd: string
    autoNextOnRead: boolean
    font: string
    border: string
    fontSize: string
    grammarFontSize: string
    grammarColor: boolean
    grammarBrightness: number
    answerBlur: number
    correctEffect: boolean
    correctEffectType: string
    completionEffect: boolean
    answerColor: string
    textColor: string
    backgroundColor: string
    recordingWave: string
    readingWave: string
    playShortcut: string
    masteredShortcut: string
    unfamiliarShortcut: string
}

type KeyOfValue<T> = {
    [K in keyof LearningPreferences]: LearningPreferences[K] extends T ? K : never
}[keyof LearningPreferences]
export type BooleanPreferenceKey = KeyOfValue<boolean>
export type NumberPreferenceKey = KeyOfValue<number>
export type StringPreferenceKey = KeyOfValue<string>
export type ColorPreferenceKey = 'answerColor' | 'textColor' | 'backgroundColor'
export type ShortcutPreferenceKey = 'playShortcut' | 'masteredShortcut' | 'unfamiliarShortcut'
export type SettingsTab =
    'pronunciation' | 'sound' | 'answer' | 'listening' | 'appearance' | 'shortcuts' | 'system'

interface FieldBase {
    label: string
    description?: string
}
interface ToggleField extends FieldBase {
    kind: 'toggle'
    key: BooleanPreferenceKey
}
interface ChoiceField extends FieldBase {
    kind: 'select' | 'radio'
    key: StringPreferenceKey
    options: readonly string[]
}
interface RangeField extends FieldBase {
    kind: 'range'
    key: NumberPreferenceKey
    min: number
    max: number
    step: number
    unit?: string
}
interface ColorField extends FieldBase {
    kind: 'color'
    key: ColorPreferenceKey
}
export type PreferenceField = ToggleField | ChoiceField | RangeField | ColorField
export interface SettingsGroup {
    title: string
    fields: readonly PreferenceField[]
}

export const settingsTabs = [
    { id: 'pronunciation', label: '发音', panelId: 'settings-pronunciation' },
    { id: 'sound', label: '音效', panelId: 'settings-sound' },
    { id: 'answer', label: '答题', panelId: 'settings-answer' },
    { id: 'listening', label: '听力', panelId: 'settings-listening' },
    { id: 'appearance', label: '个性化', panelId: 'settings-appearance' },
    { id: 'shortcuts', label: '快捷键', panelId: 'settings-shortcuts' },
    { id: 'system', label: '系统', panelId: 'settings-system' },
] as const

export const defaultPreferences: LearningPreferences = {
    voice: '美式女音',
    autoReadOnChange: true,
    autoReadOnCorrect: true,
    speechRate: 1,
    speechVolume: 100,
    readCount: 1,
    readInterval: 1,
    readAfterEvaluation: true,
    transitionSound: true,
    evaluationSound: true,
    typingSound: true,
    typingTone: '原键（默认）',
    typingVolume: 100,
    correctSound: true,
    correctTone: '清音（默认）',
    correctVolume: 100,
    errorSound: true,
    errorTone: '轻警（默认）',
    errorVolume: 100,
    completionSound: true,
    completionTone: '落幕（默认）',
    completionVolume: 100,
    showTranslation: true,
    showPhonetics: false,
    handwriting: false,
    inputCompatibility: false,
    showEvaluation: true,
    autoNextOnCorrect: false,
    ignoreNames: true,
    ignoreCase: true,
    autoShowAnswer: false,
    answerAfterErrors: '错误3次后',
    chapterEnd: '结束朗读',
    autoNextOnRead: false,
    font: '默认字体',
    border: '实线',
    fontSize: '默认',
    grammarFontSize: '默认',
    grammarColor: true,
    grammarBrightness: 5,
    answerBlur: 10,
    correctEffect: true,
    correctEffectType: '🎊',
    completionEffect: true,
    answerColor: 'theme',
    textColor: 'theme',
    backgroundColor: 'theme',
    recordingWave: '默认竖条',
    readingWave: '默认竖条',
    playShortcut: 'Ctrl + A',
    masteredShortcut: 'Ctrl + M',
    unfamiliarShortcut: 'Ctrl + Q',
}

const fontSizes = ['默认', '一号', '二号', '三号', '四号', '五号', '六号', '七号']
export const waveStyles = ['默认竖条', '曲线频谱', '矩阵方块', '雨滴点阵', '波形线条'] as const
export const preferenceGroups: Record<SettingsTab, readonly SettingsGroup[]> = {
    pronunciation: [
        {
            title: '发音',
            fields: [
                {
                    kind: 'select',
                    key: 'voice',
                    label: '发音人',
                    description: '美音 KK 音标',
                    options: ['美式女音', '美式男音', '英式女音', '英式男音'],
                },
                {
                    kind: 'toggle',
                    key: 'autoReadOnChange',
                    label: '切题后自动朗读',
                    description: '继续练习、题目切换时自动朗读',
                },
                {
                    kind: 'toggle',
                    key: 'autoReadOnCorrect',
                    label: '答题正确后朗读',
                    description: '答题成功后自动朗读',
                },
                {
                    kind: 'range',
                    key: 'speechRate',
                    label: '发音人语速',
                    min: 0.5,
                    max: 2,
                    step: 0.1,
                    unit: 'x',
                },
                {
                    kind: 'range',
                    key: 'speechVolume',
                    label: '发音人音量',
                    min: 1,
                    max: 100,
                    step: 1,
                },
                { kind: 'range', key: 'readCount', label: '朗读次数', min: 1, max: 5, step: 1 },
                {
                    kind: 'range',
                    key: 'readInterval',
                    label: '朗读间隔',
                    min: 1,
                    max: 3,
                    step: 1,
                    unit: '秒',
                },
            ],
        },
        {
            title: '口语评测',
            fields: [
                {
                    kind: 'toggle',
                    key: 'readAfterEvaluation',
                    label: '评测结束后自动播放发音',
                    description: '口语模式生效',
                },
            ],
        },
    ],
    sound: [
        {
            title: '音效',
            fields: [
                { kind: 'toggle', key: 'transitionSound', label: '切题音效' },
                { kind: 'toggle', key: 'evaluationSound', label: '口语评测结束音效' },
                { kind: 'toggle', key: 'typingSound', label: '打字音效' },
                {
                    kind: 'select',
                    key: 'typingTone',
                    label: '打字音效类型',
                    options: [
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
                },
                {
                    kind: 'range',
                    key: 'typingVolume',
                    label: '打字音效音量',
                    min: 1,
                    max: 100,
                    step: 1,
                },
                { kind: 'toggle', key: 'correctSound', label: '答题正确音效' },
                {
                    kind: 'select',
                    key: 'correctTone',
                    label: '答题正确音效类型',
                    options: ['清音（默认）', '清悦'],
                },
                {
                    kind: 'range',
                    key: 'correctVolume',
                    label: '答题正确音效音量',
                    min: 1,
                    max: 100,
                    step: 1,
                },
                { kind: 'toggle', key: 'errorSound', label: '答题错误音效' },
                {
                    kind: 'select',
                    key: 'errorTone',
                    label: '答题错误音效类型',
                    options: ['轻警（默认）', '低鸣', '短促', '顿响', '警示', '闷扣'],
                },
                {
                    kind: 'range',
                    key: 'errorVolume',
                    label: '答题错误音效音量',
                    min: 1,
                    max: 100,
                    step: 1,
                },
                { kind: 'toggle', key: 'completionSound', label: '课程完成音效' },
                {
                    kind: 'select',
                    key: 'completionTone',
                    label: '课程完成音效类型',
                    options: [
                        '落幕（默认）',
                        '终章',
                        '礼赞',
                        '星河',
                        '收束',
                        '凯旋',
                        '花火',
                        '余韵',
                    ],
                },
                {
                    kind: 'range',
                    key: 'completionVolume',
                    label: '课程完成音效音量',
                    min: 1,
                    max: 100,
                    step: 1,
                },
            ],
        },
    ],
    answer: [
        {
            title: '答题',
            fields: [
                { kind: 'toggle', key: 'showTranslation', label: '显示翻译' },
                { kind: 'toggle', key: 'showPhonetics', label: '显示音标' },
                {
                    kind: 'toggle',
                    key: 'handwriting',
                    label: '平板手写模式',
                    description:
                        '使用触控笔在答题横线上手写。默认关闭，关闭后恢复原输入方式；需设备和输入法支持手写转文字。',
                },
                {
                    kind: 'toggle',
                    key: 'inputCompatibility',
                    label: '打字练习输入兼容',
                    description: '单词、句子课程通用。输入异常时可关闭，切回原输入方式。',
                },
                { kind: 'toggle', key: 'showEvaluation', label: '答题后显示口语评测' },
                { kind: 'toggle', key: 'autoNextOnCorrect', label: '答题正确后自动下一题' },
                { kind: 'toggle', key: 'ignoreNames', label: '忽略人名' },
                {
                    kind: 'toggle',
                    key: 'ignoreCase',
                    label: '忽略大小写',
                    description: '校验答案时不校验大小写',
                },
                {
                    kind: 'toggle',
                    key: 'autoShowAnswer',
                    label: '答案自动显示',
                    description: '答案弹窗自动显示出来',
                },
                {
                    kind: 'select',
                    key: 'answerAfterErrors',
                    label: '错误几次时显示答案',
                    options: [
                        '从不',
                        '错误1次后',
                        '错误2次后',
                        '错误3次后',
                        '错误4次后',
                        '错误5次后',
                    ],
                },
            ],
        },
    ],
    listening: [
        {
            title: '朗读模式',
            fields: [
                {
                    kind: 'select',
                    key: 'chapterEnd',
                    label: '当前课程章节朗读结束后朗读操作',
                    options: ['结束朗读', '循环播放', '自动下一章'],
                },
            ],
        },
        {
            title: '自动切题',
            fields: [{ kind: 'toggle', key: 'autoNextOnRead', label: '朗读结束后自动下一题' }],
        },
    ],
    appearance: [
        {
            title: '答题时样式',
            fields: [
                {
                    kind: 'radio',
                    key: 'font',
                    label: '答题字体类型',
                    options: ['默认字体', '圆体', '无衬线西文体', '现代体', '圆角黑体'],
                },
                {
                    kind: 'radio',
                    key: 'border',
                    label: '答题边框样式',
                    options: ['实线', '虚线', '点线'],
                },
                {
                    kind: 'select',
                    key: 'fontSize',
                    label: '答题字号',
                    options: ['小二号', '小一号', ...fontSizes],
                },
                {
                    kind: 'select',
                    key: 'grammarFontSize',
                    label: '语法词性字号',
                    options: fontSizes,
                },
                {
                    kind: 'toggle',
                    key: 'grammarColor',
                    label: '语法词性颜色',
                    description: '句子练习答题成功页语法词性色彩',
                },
                {
                    kind: 'range',
                    key: 'grammarBrightness',
                    label: '语法词性色彩亮度',
                    min: 1,
                    max: 10,
                    step: 1,
                },
                {
                    kind: 'range',
                    key: 'answerBlur',
                    label: '答案模糊程度',
                    description: '具有答案模糊功能的模式生效',
                    min: 1,
                    max: 10,
                    step: 1,
                },
            ],
        },
        {
            title: '答题反馈特效',
            fields: [
                {
                    kind: 'toggle',
                    key: 'correctEffect',
                    label: '答题正确特效',
                    description: '如遇卡顿，可尝试切换或关闭此功能',
                },
                {
                    kind: 'radio',
                    key: 'correctEffectType',
                    label: '答题正确特效类型',
                    options: ['🎊', '🎊🎊🎊', '🐸', '🎉', '✨'],
                },
                {
                    kind: 'toggle',
                    key: 'completionEffect',
                    label: '课程完成特效',
                    description: '课程完成时的弹窗特效',
                },
            ],
        },
        {
            title: '答题页面颜色',
            fields: [
                { kind: 'color', key: 'answerColor', label: '答题颜色' },
                { kind: 'color', key: 'textColor', label: '练习页面字体颜色' },
                { kind: 'color', key: 'backgroundColor', label: '练习页面背景颜色' },
            ],
        },
        {
            title: '声纹设置',
            fields: [
                { kind: 'select', key: 'recordingWave', label: '录音样式', options: waveStyles },
                { kind: 'select', key: 'readingWave', label: '朗读样式', options: waveStyles },
            ],
        },
    ],
    shortcuts: [],
    system: [],
}

export const shortcutFields: readonly { key: ShortcutPreferenceKey; label: string }[] = [
    { key: 'playShortcut', label: '播放朗读' },
    { key: 'masteredShortcut', label: '标记掌握' },
    { key: 'unfamiliarShortcut', label: '标记生词' },
]

export function isSettingsTab(value: string | null): value is SettingsTab {
    return settingsTabs.some((tab) => tab.id === value)
}

export function isPreferenceColor(value: string): boolean {
    return value === 'theme' || /^#[0-9a-f]{6}$/i.test(value)
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function parsePreferences(value: unknown): LearningPreferences {
    const result = { ...defaultPreferences }
    if (!isRecord(value) || value.version !== 1 || !isRecord(value.values)) return result
    const source = value.values
    for (const group of Object.values(preferenceGroups).flat()) {
        for (const field of group.fields) {
            const candidate = source[field.key]
            if (field.kind === 'toggle' && typeof candidate === 'boolean')
                result[field.key] = candidate
            if (
                field.kind === 'range' &&
                typeof candidate === 'number' &&
                Number.isFinite(candidate) &&
                candidate >= field.min &&
                candidate <= field.max &&
                Math.abs(
                    (candidate - field.min) / field.step -
                        Math.round((candidate - field.min) / field.step),
                ) < 0.000001
            )
                result[field.key] = candidate
            if (
                (field.kind === 'select' || field.kind === 'radio') &&
                typeof candidate === 'string' &&
                field.options.includes(candidate)
            )
                result[field.key] = candidate
            if (
                field.kind === 'color' &&
                typeof candidate === 'string' &&
                isPreferenceColor(candidate)
            )
                result[field.key] = candidate
        }
    }
    const shortcuts = shortcutFields.map(({ key }) => source[key])
    if (
        shortcuts.every((shortcut) => typeof shortcut === 'string' && isShortcut(shortcut)) &&
        new Set(shortcuts).size === shortcuts.length
    ) {
        for (const { key } of shortcutFields) {
            const shortcut = source[key]
            if (typeof shortcut === 'string') result[key] = shortcut
        }
    }
    return result
}

export function resetPreferenceColors(values: LearningPreferences): LearningPreferences {
    return { ...values, answerColor: 'theme', textColor: 'theme', backgroundColor: 'theme' }
}

export function isShortcut(value: string): boolean {
    const parts = value.split(' + ')
    const key = parts.at(-1)
    if (key === undefined || !isShortcutKey(key)) return false
    const modifiers = parts.slice(0, -1)
    const canonicalModifiers = ['Ctrl', 'Alt', 'Shift', 'Meta'].filter((modifier) =>
        modifiers.includes(modifier),
    )
    if (modifiers.join('|') !== canonicalModifiers.join('|')) return false
    if (modifiers.length === 0 && /^[A-Z]$/.test(key)) return false
    if (modifiers.length === 1 && modifiers[0] === 'Shift' && key.length === 1) return false
    return true
}

function isShortcutKey(value: string): boolean {
    return (
        (/^[!-~]$/.test(value) && !/^[a-z]$/.test(value)) ||
        /^(?:F(?:[1-9]|1[0-9]|2[0-4])|Space|Arrow(?:Up|Down|Left|Right)|Backspace|Delete|Home|End|PageUp|PageDown|Insert)$/.test(
            value,
        )
    )
}

export interface ShortcutInput {
    key: string
    ctrlKey: boolean
    altKey: boolean
    shiftKey: boolean
    metaKey: boolean
}

export function captureShortcut(event: ShortcutInput): string | null {
    const key =
        event.key === ' ' ? 'Space' : event.key.length === 1 ? event.key.toUpperCase() : event.key
    if (!isShortcutKey(key)) return null
    const value = [
        event.ctrlKey ? 'Ctrl' : '',
        event.altKey ? 'Alt' : '',
        event.shiftKey ? 'Shift' : '',
        event.metaKey ? 'Meta' : '',
        key,
    ]
        .filter(Boolean)
        .join(' + ')
    return isShortcut(value) ? value : null
}

export function shortcutError(
    values: LearningPreferences,
    key: ShortcutPreferenceKey,
    value: string,
): string | null {
    if (!isShortcut(value)) return '请使用有效组合键；不能使用单个字母或 Shift + 字母、字符。'
    if (shortcutFields.some((field) => field.key !== key && values[field.key] === value))
        return '这个快捷键已用于其他操作，请换一个组合键。'
    return null
}
