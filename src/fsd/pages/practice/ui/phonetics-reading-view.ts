import type {
    PhoneticsReadingSnapshot,
    PhoneticsReadingSurface,
} from '../model/phonetics-reading-runtime'
import type { PracticeReadingView } from './PracticeReadingOverlay'

/** 遮罩跟随本次播放入口，不随目标音／整词／字母音切换位置。 */
export function getPhoneticsReadingView(
    reading: PhoneticsReadingSnapshot | undefined,
    surface: PhoneticsReadingSurface,
    waveStyle: string,
): PracticeReadingView | undefined {
    if (
        !reading?.playRequested ||
        reading.surface !== surface ||
        (reading.status !== 'playing' &&
            reading.status !== 'waiting' &&
            reading.status !== 'loading')
    )
        return undefined
    return { status: reading.status === 'playing' ? 'playing' : 'waiting', waveStyle }
}
