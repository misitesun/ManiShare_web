export type OralDemoStage = 'idle' | 'recording' | 'evaluating' | 'result' | 'error'

export interface OralDemoState {
    readonly stage: OralDemoStage
    readonly elapsed: number
}

export type OralDemoAction =
    'start' | 'stopAndEvaluate' | 'rerecord' | 'reset' | 'showResult' | 'showError' | 'tick'

export const initialOralDemoState: OralDemoState = Object.freeze({ stage: 'idle', elapsed: 0 })

/** 仅管理显式演示阶段，不生成录音、评分或自动完成事件。 */
export function reduceOralDemo(state: OralDemoState, action: OralDemoAction): OralDemoState {
    if (action === 'reset') return initialOralDemoState
    if (action === 'start' && state.stage === 'idle') return { stage: 'recording', elapsed: 0 }
    if (action === 'rerecord' && (state.stage === 'result' || state.stage === 'error'))
        return { stage: 'recording', elapsed: 0 }
    if (action === 'stopAndEvaluate' && state.stage === 'recording')
        return { ...state, stage: 'evaluating' }
    if (action === 'showResult' && state.stage === 'evaluating')
        return { ...state, stage: 'result' }
    if (action === 'showError' && state.stage === 'evaluating') return { ...state, stage: 'error' }
    if (action === 'tick' && state.stage === 'recording')
        return { ...state, elapsed: state.elapsed + 1 }
    return state
}

export interface OralDemoClock {
    readonly setInterval: (callback: () => void, milliseconds: number) => number
    readonly clearInterval: (timer: number) => void
}

/** 效果清理后连已排队的旧回调也不再推进计时；阻断期间只暂停，不改题内阶段。 */
export function scheduleOralDemoTimer(
    stage: OralDemoStage,
    blocked: boolean,
    onTick: () => void,
    clock: OralDemoClock,
): () => void {
    let active = stage === 'recording' && !blocked
    let disposed = false
    const timer = active
        ? clock.setInterval((): void => {
              if (active) onTick()
          }, 1000)
        : null
    return (): void => {
        if (disposed) return
        disposed = true
        active = false
        if (timer !== null) clock.clearInterval(timer)
    }
}
