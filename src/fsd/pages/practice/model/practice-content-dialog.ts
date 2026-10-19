import type { PracticeFamily, PracticeQuestion } from './practice-demo'

export type PracticeContentDisplay = 'chinese' | 'english' | 'bilingual'

interface PracticeContentLine {
    readonly language: 'zh-CN' | 'en'
    readonly text: string
}

export const practiceContentDisplayOptions = [
    { id: 'chinese', label: '显示中文' },
    { id: 'english', label: '显示英文' },
    { id: 'bilingual', label: '双语显示' },
] as const

export function usesPracticeContentDialog(family: PracticeFamily): boolean {
    return family === 'word' || family === 'sentence'
}

export function resolvePracticeContentDisplay(value: string): PracticeContentDisplay {
    return value === 'english' || value === 'bilingual' ? value : 'chinese'
}

export function getPracticeContentLines(
    question: Pick<PracticeQuestion, 'english' | 'translation'>,
    display: PracticeContentDisplay,
): readonly PracticeContentLine[] {
    if (display === 'chinese') return [{ language: 'zh-CN', text: question.translation }]
    const english: PracticeContentLine = { language: 'en', text: question.english }
    return display === 'english'
        ? [english]
        : [english, { language: 'zh-CN', text: question.translation }]
}
