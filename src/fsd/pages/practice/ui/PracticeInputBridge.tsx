'use client'

import type { ComponentPropsWithRef, ReactElement } from 'react'

/** 共享原生输入载体；字母/句子状态、导航、IME提交与判题由各自业务组件负责。 */
export function PracticeInputBridge(props: ComponentPropsWithRef<'input'>): ReactElement {
    return (
        <input
            {...props}
            data-practice-answer-input
            type="text"
            lang="en"
            inputMode="text"
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            className="pointer-events-none absolute left-0 top-0 h-px w-px cursor-text border-0 bg-transparent p-0 text-[16px] opacity-0 outline-none disabled:cursor-default"
        />
    )
}
