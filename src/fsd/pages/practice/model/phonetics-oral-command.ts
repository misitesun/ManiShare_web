import type { OralAssessmentStage } from '../../../features/oral-assessment'
import type { PracticeCommand } from './practice-command-types'

export type PhoneticsOralCommandAction =
    'start' | 'stop' | 'rerecord' | 'replay' | 'none' | 'fallback'

/** 卡内评测只接管自身快捷操作；未开始时保留空格朗读和Enter切题。 */
export function resolvePhoneticsOralCommand(
    stage: OralAssessmentStage,
    command: PracticeCommand,
): PhoneticsOralCommandAction {
    if (command === 'practice.oral') {
        if (stage === 'idle') return 'start'
        if (stage === 'recording') return 'stop'
        if (stage === 'result') return 'rerecord'
        return 'none'
    }
    if (command === 'practice.contextual' || command === 'practice.primary') {
        if (stage === 'recording') return 'stop'
        if (stage === 'evaluating') return 'none'
        if (stage === 'result' && command === 'practice.contextual') return 'replay'
    }
    if (command === 'practice.readAloud' && (stage === 'recording' || stage === 'evaluating'))
        return 'none'
    return 'fallback'
}
