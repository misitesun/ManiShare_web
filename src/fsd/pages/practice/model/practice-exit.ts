export type PracticeExitDestination = 'home' | 'course'
export type PracticeExitAction = PracticeExitDestination | 'continue'

interface PracticeExitFlow {
    readonly request: (action: PracticeExitAction) => boolean
    readonly complete: () => PracticeExitAction | null
}

/** 先记录意图再开始退场；同一轮只接受一次动作，动画结束才交给页面执行。 */
export function createPracticeExitFlow(): PracticeExitFlow {
    let pending: PracticeExitAction | null = null
    return {
        request(action): boolean {
            if (pending !== null) return false
            pending = action
            return true
        },
        complete(): PracticeExitAction | null {
            const action = pending
            pending = null
            return action
        },
    }
}
