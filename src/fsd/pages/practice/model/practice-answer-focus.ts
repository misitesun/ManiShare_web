interface PracticeAnswerFocusOptions {
    readonly canFocus: () => boolean
    readonly focus: () => void
    readonly schedule: (callback: () => void) => number
    readonly cancelFrame: (frame: number) => void
}

export interface PracticeAnswerFocusRequest {
    readonly request: () => void
    readonly cancel: () => void
}

/** 等待设置提交和控件自身归焦完成；合并请求，取消后不执行过期回调。 */
export function createPracticeAnswerFocusRequest({
    canFocus,
    focus,
    schedule,
    cancelFrame,
}: PracticeAnswerFocusOptions): PracticeAnswerFocusRequest {
    let frame: number | null = null
    let revision = 0
    function cancel(): void {
        revision += 1
        if (frame !== null) cancelFrame(frame)
        frame = null
    }
    function request(): void {
        cancel()
        const current = revision
        frame = schedule((): void => {
            if (current !== revision) return
            frame = null
            if (canFocus()) focus()
        })
    }
    return { request, cancel }
}
