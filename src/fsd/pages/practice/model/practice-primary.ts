import type { PracticeFamily, PracticeMode, PracticePhase } from './practice-demo'
import type { OralDemoStage } from './oral-demo'
import { hasPracticeAnswerInput, isPracticeAnswerVisible } from './practice-visibility'

export type PracticePrimaryAction =
    'next' | 'submit' | 'reveal' | 'oral-start' | 'oral-stop' | 'oral-complete' | 'none'

export function resolvePracticePrimary({
    family,
    mode,
    phase,
    oralStage,
    quickOral,
}: {
    readonly family: PracticeFamily
    readonly mode: PracticeMode
    readonly phase: PracticePhase
    readonly oralStage: OralDemoStage
    readonly quickOral: boolean
}): PracticePrimaryAction {
    if (quickOral || mode === 'oral') {
        if (oralStage === 'idle') return 'oral-start'
        if (oralStage === 'recording') return 'oral-stop'
        if (oralStage === 'result') return quickOral ? 'oral-complete' : 'next'
        return 'none'
    }
    if (isPracticeAnswerVisible(phase)) return 'next'
    if (hasPracticeAnswerInput(mode)) return 'submit'
    if (mode === 'check' || (family === 'guess' && mode === 'guess')) return 'reveal'
    if (['spell', 'dictate', 'translate', 'blocks', 'meaning'].includes(mode)) return 'submit'
    return 'next'
}
