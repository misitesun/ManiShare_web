import {
    correctAnimationOptions,
    defaultCorrectAnimationId,
    resolveCorrectAnimationId,
} from './feedback-animations'

export interface LearningPreferences {
    voice: string
    autoReadOnChange: boolean
    autoReadOnCorrect: boolean
    speechRate: number
    speechVolume: number
    readCount: number
    readInterval: number
    readAfterEvaluation: boolean
    imagePosition: string
    imageSize: string
    videoPosition: string
    maskSubtitles: boolean
    correctEffect: boolean
    correctEffectType: string
    completionEffect: boolean
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
    showAnswerPhonetics: boolean
    showPartOfSpeech: boolean
    showGrammarText: boolean
    showGrammarFill: boolean
    grammarBrightness: number
    answerBlur: number
    answerColor: string
    textColor: string
    backgroundPreset: string
    backgroundSource: string
    backgroundDim: number
    backgroundBlur: number
    recordingWave: string
    readingWave: string
    playShortcut: string
    masteredShortcut: string
    unfamiliarShortcut: string
    previousShortcut: string
    nextShortcut: string
}

type KeyOfValue<T> = {
    [K in keyof LearningPreferences]: LearningPreferences[K] extends T ? K : never
}[keyof LearningPreferences]
export type BooleanPreferenceKey = KeyOfValue<boolean>
export type NumberPreferenceKey = KeyOfValue<number>
export type StringPreferenceKey = KeyOfValue<string>
export type ColorPreferenceKey = 'answerColor' | 'textColor'
export type ShortcutPreferenceKey =
    'playShortcut' | 'masteredShortcut' | 'unfamiliarShortcut' | 'previousShortcut' | 'nextShortcut'
export type ShortcutPreferences = Pick<LearningPreferences, ShortcutPreferenceKey>
export type SettingsTab =
    'pronunciation' | 'specialized' | 'answer' | 'effects' | 'appearance' | 'shortcuts' | 'system'

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
    { id: 'specialized', label: '专项', panelId: 'settings-specialized' },
    { id: 'answer', label: '答题', panelId: 'settings-answer' },
    { id: 'effects', label: '特效', panelId: 'settings-effects' },
    { id: 'appearance', label: '外观', panelId: 'settings-appearance' },
    { id: 'shortcuts', label: '快捷键', panelId: 'settings-shortcuts' },
    { id: 'system', label: '系统', panelId: 'settings-system' },
] as const

export const defaultPreferences: LearningPreferences = {
    voice: '美式男音',
    autoReadOnChange: true,
    autoReadOnCorrect: true,
    speechRate: 1,
    speechVolume: 100,
    readCount: 2,
    readInterval: 1,
    readAfterEvaluation: true,
    imagePosition: '左',
    imageSize: '大',
    videoPosition: '右侧',
    maskSubtitles: true,
    correctEffect: true,
    correctEffectType: defaultCorrectAnimationId,
    completionEffect: true,
    transitionSound: true,
    evaluationSound: true,
    typingSound: true,
    typingTone: '原键（默认）',
    typingVolume: 100,
    correctSound: true,
    correctTone: '清音（默认）',
    correctVolume: 100,
    errorSound: true,
    errorTone: '顿响',
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
    answerAfterErrors: '错误1次后',
    chapterEnd: '结束朗读',
    autoNextOnRead: false,
    font: '默认字体',
    border: '实线',
    fontSize: '默认',
    grammarFontSize: '默认',
    showAnswerPhonetics: true,
    showPartOfSpeech: true,
    showGrammarText: true,
    showGrammarFill: false,
    grammarBrightness: 4,
    answerBlur: 10,
    answerColor: 'theme',
    textColor: 'theme',
    backgroundPreset: 'default',
    backgroundSource: 'preset',
    backgroundDim: 25,
    backgroundBlur: 10,
    recordingWave: '默认竖条',
    readingWave: '默认竖条',
    playShortcut: 'Shift + L',
    masteredShortcut: 'Shift + J',
    unfamiliarShortcut: 'Shift + K',
    previousShortcut: 'Shift + ArrowLeft',
    nextShortcut: 'Shift + ArrowRight',
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
                    label: '音色',
                    options: ['美式女音', '美式男音', '英式女音', '英式男音'],
                },
                {
                    kind: 'range',
                    key: 'speechRate',
                    label: '倍速调节',
                    min: 0.5,
                    max: 2,
                    step: 0.1,
                    unit: 'x',
                },
                {
                    kind: 'range',
                    key: 'speechVolume',
                    label: '发音音量',
                    min: 1,
                    max: 100,
                    step: 1,
                },
                {
                    kind: 'range',
                    key: 'readCount',
                    label: '单题朗读循环次数',
                    min: 1,
                    max: 5,
                    step: 1,
                },
                {
                    kind: 'range',
                    key: 'readInterval',
                    label: '朗读间隔（秒）',
                    min: 1,
                    max: 3,
                    step: 1,
                    unit: '秒',
                },
            ],
        },
    ],
    specialized: [
        {
            title: '口语评测',
            fields: [
                { kind: 'toggle', key: 'readAfterEvaluation', label: '评测结束后自动播放发音' },
                { kind: 'toggle', key: 'showEvaluation', label: '显示快捷口语评测入口' },
                {
                    kind: 'toggle',
                    key: 'autoReadOnCorrect',
                    label: '答题正确后朗读',
                    description: '答题成功后自动朗读',
                },
            ],
        },
        {
            title: '图片设置（句子和音频游戏）',
            fields: [
                {
                    kind: 'select',
                    key: 'imagePosition',
                    label: '图片位置',
                    options: ['默认', '左', '右'],
                },
                {
                    kind: 'select',
                    key: 'imageSize',
                    label: '图片大小',
                    options: ['大', '中', '小'],
                },
            ],
        },
        {
            title: '视频设置（视频游戏）',
            fields: [
                {
                    kind: 'select',
                    key: 'videoPosition',
                    label: '视频位置',
                    options: ['默认', '左侧', '右侧'],
                },
                {
                    kind: 'toggle',
                    key: 'maskSubtitles',
                    label: '遮挡字幕',
                    description: '开启后可在视频上直接拖动调整',
                },
            ],
        },
    ],
    effects: [
        {
            title: '动画特效',
            fields: [
                {
                    kind: 'toggle',
                    key: 'correctEffect',
                    label: '答对动画特效',
                    description: '如遇卡顿，可尝试切换或关闭此功能',
                },
                {
                    kind: 'radio',
                    key: 'correctEffectType',
                    label: '答对特效类型',
                    options: correctAnimationOptions,
                },
                { kind: 'toggle', key: 'completionEffect', label: '章节完成动画特效' },
            ],
        },
        {
            title: '打字音效',
            fields: [
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
            ],
        },
        {
            title: '答对音效',
            fields: [
                { kind: 'toggle', key: 'correctSound', label: '答对音效' },
                {
                    kind: 'select',
                    key: 'correctTone',
                    label: '答对音效类型',
                    options: ['清音（默认）', '清悦'],
                },
                {
                    kind: 'range',
                    key: 'correctVolume',
                    label: '答对音效音量',
                    min: 1,
                    max: 100,
                    step: 1,
                },
            ],
        },
        {
            title: '答错音效',
            fields: [
                { kind: 'toggle', key: 'errorSound', label: '答错音效' },
                {
                    kind: 'select',
                    key: 'errorTone',
                    label: '答错音效类型',
                    options: ['轻警（默认）', '低鸣', '短促', '顿响', '警示', '闷扣'],
                },
                {
                    kind: 'range',
                    key: 'errorVolume',
                    label: '答错音效音量',
                    min: 1,
                    max: 100,
                    step: 1,
                },
            ],
        },
        {
            title: '章节完成音效',
            fields: [
                { kind: 'toggle', key: 'completionSound', label: '章节完成音效' },
                {
                    kind: 'select',
                    key: 'completionTone',
                    label: '章节完成音效类型',
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
                    label: '章节完成音效音量',
                    min: 1,
                    max: 100,
                    step: 1,
                },
            ],
        },
        {
            title: '其它',
            fields: [
                { kind: 'toggle', key: 'transitionSound', label: '切题音效' },
                { kind: 'toggle', key: 'evaluationSound', label: '口语评测结束音效' },
            ],
        },
    ],
    answer: [
        {
            title: '答题',
            fields: [
                { kind: 'toggle', key: 'showPhonetics', label: '显示音标' },
                {
                    kind: 'toggle',
                    key: 'ignoreCase',
                    label: '忽略大小写',
                    description: '校验答案时不校验大小写',
                },
                { kind: 'toggle', key: 'ignoreNames', label: '忽略人名' },
                { kind: 'toggle', key: 'autoNextOnCorrect', label: '答题正确后自动下一题' },
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
    appearance: [
        {
            title: '主题相关',
            fields: [
                {
                    kind: 'range',
                    key: 'backgroundDim',
                    label: '背景遮罩浓度',
                    min: 0,
                    max: 100,
                    step: 1,
                    unit: '%',
                },
                {
                    kind: 'range',
                    key: 'backgroundBlur',
                    label: '背景模糊',
                    min: 0,
                    max: 30,
                    step: 1,
                    unit: 'px',
                },
            ],
        },
        {
            title: '答题页面颜色',
            fields: [
                { kind: 'color', key: 'answerColor', label: '答题颜色' },
                { kind: 'color', key: 'textColor', label: '练习页面字体颜色' },
            ],
        },
        {
            title: '答题显示',
            fields: [
                {
                    kind: 'toggle',
                    key: 'showPhonetics',
                    label: '答题音标显示',
                    description: '默认关闭，沿用已有音标偏好。',
                },
                {
                    kind: 'select',
                    key: 'font',
                    label: '答题字体',
                    options: ['默认字体', '圆体', '无衬线西文体', '现代体', '圆角黑体'],
                },
                { kind: 'radio', key: 'border', label: '答题边框', options: ['实线', '虚线'] },
                {
                    kind: 'select',
                    key: 'fontSize',
                    label: '答题字号',
                    options: ['小二号', '小一号', ...fontSizes],
                },
            ],
        },
        {
            title: '答案显示',
            fields: [
                {
                    kind: 'toggle',
                    key: 'showAnswerPhonetics',
                    label: '答案音标显示',
                    description: '默认开启，用于沉浸听力和答题后的答案显示。',
                },
                {
                    kind: 'toggle',
                    key: 'showPartOfSpeech',
                    label: '词性显示',
                    description: '默认开启。',
                },
                {
                    kind: 'toggle',
                    key: 'showGrammarText',
                    label: '语法文字标注',
                    description: '默认开启。',
                },
                {
                    kind: 'toggle',
                    key: 'showGrammarFill',
                    label: '语法填充色显示',
                    description: '默认关闭，关闭后完全透明且没有边框。',
                },
                {
                    kind: 'range',
                    key: 'grammarBrightness',
                    label: '语法填充色彩亮度',
                    min: 1,
                    max: 10,
                    step: 1,
                },
                {
                    kind: 'select',
                    key: 'grammarFontSize',
                    label: '语法词性字号（整体字号）',
                    options: fontSizes,
                },
                {
                    kind: 'range',
                    key: 'answerBlur',
                    label: '答案模糊程度',
                    description: '具有答案模糊功能的模式生效。',
                    min: 1,
                    max: 10,
                    step: 1,
                },
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
    { key: 'playShortcut', label: '朗读' },
    { key: 'masteredShortcut', label: '掌握' },
    { key: 'unfamiliarShortcut', label: '不熟' },
    { key: 'previousShortcut', label: '上一题' },
    { key: 'nextShortcut', label: '下一题' },
]

const reservedPracticeShortcuts: ReadonlySet<string> = new Set([
    'Enter',
    'Space',
    'V',
    'Escape',
    'Esc',
    'ArrowUp',
    'ArrowDown',
])
const shortcutModifiers = ['Ctrl', 'Alt', 'Shift', 'Meta'] as const
const shiftedShortcutCharacters: Readonly<Record<string, string>> = {
    '~': '`',
    '!': '1',
    '@': '2',
    '#': '3',
    $: '4',
    '%': '5',
    '^': '6',
    '&': '7',
    '*': '8',
    '(': '9',
    ')': '0',
    _: '-',
    '+': '=',
    '{': '[',
    '}': ']',
    '|': '\\',
    ':': ';',
    '"': "'",
    '<': ',',
    '>': '.',
    '?': '/',
}

export function isSettingsTab(value: string | null): value is SettingsTab {
    return settingsTabs.some((tab) => tab.id === value)
}

export function resolveSettingsTab(value: string | null): SettingsTab {
    if (value === 'sound') return 'effects'
    if (value === 'listening') return 'specialized'
    return isSettingsTab(value) ? value : 'pronunciation'
}

export function isPreferenceColor(value: string): boolean {
    return value === 'theme' || /^#[0-9a-f]{6}$/i.test(value)
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
}

// 新设计不展示这些旧选项，恢复和后续保存仍保留合法的历史值。
const retainedBooleanKeys: readonly BooleanPreferenceKey[] = [
    'showTranslation',
    'handwriting',
    'inputCompatibility',
    'autoShowAnswer',
    'autoReadOnChange',
    'autoNextOnRead',
]

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
                (isPreferenceColor(candidate) ||
                    (field.key === 'answerColor' &&
                        (candidate === 'dark-default' || candidate === 'light-default')))
            )
                result[field.key] = candidate
        }
    }
    for (const key of retainedBooleanKeys) {
        if (typeof source[key] === 'boolean') result[key] = source[key]
    }
    result.correctEffectType =
        resolveCorrectAnimationId(source.correctEffectType) ?? defaultCorrectAnimationId
    if (
        typeof source.chapterEnd === 'string' &&
        ['结束朗读', '循环播放', '自动下一章'].includes(source.chapterEnd)
    )
        result.chapterEnd = source.chapterEnd
    if (
        typeof source.backgroundPreset === 'string' &&
        ['default', 'warm', 'green', 'blue'].includes(source.backgroundPreset)
    )
        result.backgroundPreset = source.backgroundPreset
    if (source.backgroundSource === 'preset' || source.backgroundSource === 'image')
        result.backgroundSource = source.backgroundSource
    // Legacy background colors only map to a known preset; the old combined grammar toggle is ignored.
    if (source.backgroundPreset === undefined && typeof source.backgroundColor === 'string') {
        const legacy = source.backgroundColor.toLowerCase()
        if (['#1c1914', '#fff8e8'].includes(legacy)) result.backgroundPreset = 'warm'
        if (['#111b16', '#d1e4d0'].includes(legacy)) result.backgroundPreset = 'green'
        if (['#1d2024', '#d5e8f2'].includes(legacy)) result.backgroundPreset = 'blue'
    }
    // 五项旧 Ctrl 组合逐项迁移到 Shift，保留主键与其他修饰键。
    // 迁移后的冲突值不静默覆盖：编辑器展示冲突，运行时停用冲突项。
    for (const { key } of shortcutFields) {
        const shortcut = source[key]
        if (typeof shortcut === 'string' && isShortcut(shortcut))
            result[key] = migrateControlShortcut(shortcut)
    }
    return result
}

/** 仅合法 v1 历史 Ctrl 字段需要挂载后回写；缺项或坏值不能触发默认值写入。 */
export function hasLegacyControlShortcut(value: unknown): boolean {
    if (!isRecord(value) || value.version !== 1 || !isRecord(value.values)) return false
    const source = value.values
    return shortcutFields.some(({ key }): boolean => {
        const shortcut = source[key]
        return typeof shortcut === 'string' && isShortcut(shortcut) && hasControlModifier(shortcut)
    })
}

/** 已删除的历史完成音色只迁移该字段，其他合法偏好照常保留。 */
export function hasLegacyCompletionTone(value: unknown): boolean {
    return (
        isRecord(value) &&
        value.version === 1 &&
        isRecord(value.values) &&
        value.values.completionTone === '章节完成音效1'
    )
}

function hasControlModifier(value: string): boolean {
    return value.split(' + ').slice(0, -1).includes('Ctrl')
}

function migrateControlShortcut(value: string): string {
    if (!hasControlModifier(value)) return normalizeShortcutIdentity(value)
    const parts = value.split(' + ')
    const key = parts.at(-1)
    const modifiers = parts
        .slice(0, -1)
        .map((modifier) => (modifier === 'Ctrl' ? 'Shift' : modifier))
    return normalizeShortcutIdentity(
        [...shortcutModifiers.filter((modifier) => modifiers.includes(modifier)), key].join(' + '),
    )
}

/** 只依据实际字符归一英文 Shift 字符对，不用物理 code 推测键盘布局。 */
function normalizeShortcutIdentity(value: string): string {
    const parts = value.split(' + ')
    const key = parts.at(-1)
    if (key === undefined) return value
    const modifiers = parts.slice(0, -1)
    const canonicalKey = modifiers.includes('Shift') ? (shiftedShortcutCharacters[key] ?? key) : key
    return [...modifiers, canonicalKey].join(' + ')
}

export function isShortcut(value: string): boolean {
    const parts = value.split(' + ')
    const key = parts.at(-1)
    if (key === undefined || !isShortcutKey(key)) return false
    const modifiers = parts.slice(0, -1)
    const canonicalModifiers = shortcutModifiers.filter((modifier) => modifiers.includes(modifier))
    if (modifiers.join('|') !== canonicalModifiers.join('|')) return false
    if (modifiers.length === 0 && /^[A-Z]$/.test(key)) return false
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
    if (event.ctrlKey) return null
    const key =
        event.key === ' ' ? 'Space' : event.key.length === 1 ? event.key.toUpperCase() : event.key
    if (!isShortcutKey(key)) return null
    const value = [
        event.altKey ? 'Alt' : '',
        event.shiftKey ? 'Shift' : '',
        event.metaKey ? 'Meta' : '',
        key,
    ]
        .filter(Boolean)
        .join(' + ')
    return isShortcut(value) ? normalizeShortcutIdentity(value) : null
}

export function shortcutError(
    values: ShortcutPreferences,
    key: ShortcutPreferenceKey,
    value: string,
): string | null {
    if (reservedPracticeShortcuts.has(value))
        return '此按键用于练习主流程或面板显隐，请选择其他快捷键。'
    if (hasControlModifier(value)) return '练习快捷键不支持 Ctrl 组合，请改用 Shift 组合。'
    if (!isShortcut(value)) return '请使用有效组合键；不能使用单个字母。'
    const identity = normalizeShortcutIdentity(value)
    if (
        shortcutFields.some(
            (field) =>
                field.key !== key &&
                isShortcut(values[field.key]) &&
                normalizeShortcutIdentity(values[field.key]) === identity,
        )
    )
        return '这个快捷键已用于其他操作，请换一个组合键。'
    return null
}

/** 有效绑定供提示与运行时共用；保留在缓存中的冲突值不参与派发。 */
export function getEffectiveShortcut(
    values: ShortcutPreferences,
    key: ShortcutPreferenceKey,
): string | null {
    return shortcutError(values, key, values[key]) === null
        ? normalizeShortcutIdentity(values[key])
        : null
}

/** 与编辑器使用同一格式，精确匹配全部修饰键；Ctrl 不参与练习动作。 */
export function matchesShortcut(event: ShortcutInput, value: string): boolean {
    if (
        event.ctrlKey ||
        hasControlModifier(value) ||
        !isShortcut(value) ||
        reservedPracticeShortcuts.has(value)
    )
        return false
    return captureShortcut(event) === normalizeShortcutIdentity(value)
}
