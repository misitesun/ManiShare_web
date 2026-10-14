import type { LearningPreferences } from './preferences'

interface PreviewAppearance {
    fontFamily: string
    fontSize: number
    grammarFontSize: number
    borderStyle: 'solid' | 'dashed' | 'dotted'
    grammarOpacity: number
    blur: number
    answerColor: string
    textColor: string
    backgroundColor: string
}

const fonts: Record<string, string> = {
    默认字体: 'var(--font-sans)',
    圆体: 'var(--font-brand)',
    无衬线西文体: 'Arial, Helvetica, sans-serif',
    现代体: 'Georgia, "Times New Roman", serif',
    圆角黑体: '"Arial Rounded MT Bold", ui-rounded, var(--font-sans)',
}
const sizes: Record<string, number> = {
    小二号: 22,
    小一号: 26,
    默认: 30,
    一号: 34,
    二号: 38,
    三号: 42,
    四号: 46,
    五号: 50,
    六号: 54,
    七号: 58,
}

export function getPreviewAppearance(values: LearningPreferences): PreviewAppearance {
    return {
        fontFamily: fonts[values.font] ?? 'var(--font-sans)',
        fontSize: sizes[values.fontSize] ?? 30,
        grammarFontSize: 12 + Math.max(0, fontSizeIndex(values.grammarFontSize)) * 2,
        borderStyle:
            values.border === '虚线' ? 'dashed' : values.border === '点线' ? 'dotted' : 'solid',
        grammarOpacity: 0.2 + values.grammarBrightness * 0.08,
        blur: values.answerBlur * 0.6,
        answerColor: values.answerColor === 'theme' ? 'var(--app-color-brand)' : values.answerColor,
        textColor:
            values.textColor === 'theme' ? 'var(--app-color-text-primary)' : values.textColor,
        backgroundColor:
            values.backgroundColor === 'theme' ? 'var(--app-color-canvas)' : values.backgroundColor,
    }
}

function fontSizeIndex(value: string): number {
    return ['默认', '一号', '二号', '三号', '四号', '五号', '六号', '七号'].indexOf(value)
}
