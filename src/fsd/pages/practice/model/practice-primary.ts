import type { PracticeFamily, PracticeMode, PracticePhase } from './practice-demo'
import type { OralDemoStage } from './oral-demo'
import { hasPracticeAnswerInput, isPracticeAnswerVisible } from './practice-visibility'
import { resolveWordMeaningAction } from './word-meaning'
import type { WordMeaningState } from './word-meaning'

export type PracticePrimaryAction =
    | 'next'
    | 'submit'
    | 'reveal'
    | 'reveal-translation'
    | 'oral-start'
    | 'oral-stop'
    | 'oral-complete'
    | 'none'

export function resolvePracticePrimary({
    family,
    mode,
    phase,
    oralStage,
    quickOral,
    wordMeaning,
}: {
    readonly family: PracticeFamily
    readonly mode: PracticeMode
    readonly phase: PracticePhase
    readonly oralStage: OralDemoStage
    readonly quickOral: boolean
    readonly wordMeaning?: WordMeaningState
}): PracticePrimaryAction {
    if (family === 'video-reader' || family === 'audio-reader' || family === 'text-reader')
        return 'none'
    if (quickOral || mode === 'oral') {
        if (oralStage === 'idle') return 'oral-start'
        if (oralStage === 'recording') return 'oral-stop'
        if (oralStage === 'result') return quickOral ? 'oral-complete' : 'next'
        return 'none'
    }
    if (family === 'word' && mode === 'meaning' && wordMeaning) {
        const action = resolveWordMeaningAction(wordMeaning, phase)
        if (action !== 'answer') return action
    }
    if (isPracticeAnswerVisible(phase)) return 'next'
    if (family === 'guess' && mode === 'guess') return 'next'
    if (hasPracticeAnswerInput(mode)) return 'submit'
    if (mode === 'check') return 'reveal'
    if (['spell', 'dictate', 'translate', 'blocks', 'meaning'].includes(mode)) return 'submit'
    return 'next'
}
