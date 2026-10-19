import type { ReactElement } from 'react'
import { typingHandAnchors, typingHandShapes } from '../assets/typing-hand-shapes'
import type { TypingHandPath, TypingHandShape } from '../assets/typing-hand-shapes'
import { typingKeyboardKeys } from '../model/typing-keyboard'

interface TypingHandsProps {
    readonly targetCode: string | null
    readonly shiftCode: 'ShiftLeft' | 'ShiftRight' | null
}

interface HandPose {
    readonly shape: TypingHandShape
    readonly code: string | null
}

const shapeByCode: Readonly<Record<string, TypingHandShape | undefined>> = {
    Backquote: 'tilda',
    Digit1: '1',
    Digit2: '2',
    Digit3: '3',
    Digit4: '4',
    Digit5: '5',
    Digit6: '6',
    Digit7: '7',
    Digit8: '8',
    Digit9: '9',
    Digit0: '0',
    Minus: 'minus',
    Equal: 'equal',
    Tab: 'tab',
    KeyQ: 'q',
    KeyW: 'w',
    KeyE: 'e',
    KeyR: 'r',
    KeyT: 't',
    KeyY: 'y',
    KeyU: 'u',
    KeyI: 'i',
    KeyO: 'o',
    KeyP: 'p',
    BracketLeft: 'left-center-bracket',
    BracketRight: 'right-center-bracket',
    Backslash: 'backslash',
    // 原资源没有 CapsLock 手型；仅借用相邻 A 键的小指轮廓作手指提示。
    CapsLock: 'a',
    KeyA: 'a',
    KeyS: 's',
    KeyD: 'd',
    KeyF: 'f',
    KeyG: 'g',
    KeyH: 'h',
    KeyJ: 'j',
    KeyK: 'k',
    KeyL: 'l',
    Semicolon: 'semicolon',
    Quote: 'single-quote',
    Enter: 'enter',
    ShiftLeft: 'shift-left',
    KeyZ: 'z',
    KeyX: 'x',
    KeyC: 'c',
    KeyV: 'v',
    KeyB: 'b',
    KeyN: 'n',
    KeyM: 'm',
    Comma: 'comma',
    Period: 'dot',
    Slash: 'slash',
    ShiftRight: 'shift-right',
    Space: 'space',
}

function HandPath({ path }: { readonly path: TypingHandPath }): ReactElement {
    if (path.role === 'surface') return <path d={path.d} className="fill-practice-hand-surface" />
    if (path.role === 'crease')
        return <path d={path.d} className="fill-practice-hand-outline opacity-50" />
    if (path.role === 'guide')
        return (
            <path
                d={path.d}
                className="fill-none stroke-practice-hand-guide"
                strokeWidth={3}
                strokeLinecap="round"
                strokeMiterlimit={10}
            />
        )
    return (
        <path
            d={path.d}
            className="fill-none stroke-practice-hand-outline"
            strokeWidth={2}
            strokeMiterlimit={10}
        />
    )
}

function HandShape({
    side,
    pose,
}: {
    readonly side: 'left' | 'right'
    readonly pose: HandPose
}): ReactElement {
    const anchor = typingHandAnchors[pose.shape]
    const key = typingKeyboardKeys.find((item) => item.code === pose.code)
    const scaleX = 1.56
    const scaleY = 1.2
    const offsetX = anchor && key ? key.x + key.width / 2 - anchor.x * scaleX : -158
    const offsetY = anchor && key ? key.y + key.height / 2 - anchor.y * scaleY : -56
    return (
        <g
            data-hand-side={side}
            data-hand-shape={pose.shape}
            data-hand-key={pose.code ?? undefined}
            data-hand-approximation={pose.code === 'CapsLock' ? 'adjacent-pinky' : undefined}
            transform={`translate(${offsetX} ${offsetY}) scale(${scaleX} ${scaleY})`}
        >
            {typingHandShapes[pose.shape].map((path) => (
                <HandPath key={`${path.role}:${path.d}`} path={path} />
            ))}
        </g>
    )
}

/** 键帽、双手和文字共享 720×260 的键盘坐标；本层只消费目标，不管理输入。 */
export function TypingHands({ targetCode, shiftCode }: TypingHandsProps): ReactElement {
    let left: HandPose = { shape: 'neutral-left', code: null }
    let right: HandPose = { shape: 'neutral-right', code: null }
    const shape = targetCode ? shapeByCode[targetCode] : undefined
    const key = typingKeyboardKeys.find((item) => item.code === targetCode)
    if (shape && key) {
        const pose = { shape, code: key.code }
        if (key.hand === 'left') left = pose
        else right = pose
    }
    if (shiftCode === 'ShiftLeft') left = { shape: 'shift-left', code: shiftCode }
    if (shiftCode === 'ShiftRight') right = { shape: 'shift-right', code: shiftCode }

    return (
        <svg
            data-typing-hands="true"
            aria-hidden="true"
            focusable="false"
            viewBox="0 0 720 260"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-0 z-10 h-full w-full overflow-hidden opacity-[0.45]"
        >
            <HandShape side="left" pose={left} />
            <HandShape side="right" pose={right} />
        </svg>
    )
}
