import type { OralAssessmentPlayback } from '../../../features/oral-assessment'
import type { PracticeReadingSnapshot } from './practice-reading-runtime'

/** 等提示音及媒体加载时保持静态；只把真实playing事件映射成播放动画。 */
export function getOralAssessmentPlaybackStatus(
    snapshot: PracticeReadingSnapshot,
): OralAssessmentPlayback['status'] {
    if (snapshot.status === 'playing') return 'playing'
    if (snapshot.playRequested) return 'pending'
    if (snapshot.status === 'error') return 'error'
    if (snapshot.status === 'paused' || snapshot.status === 'ended') return 'stopped'
    return 'idle'
}
