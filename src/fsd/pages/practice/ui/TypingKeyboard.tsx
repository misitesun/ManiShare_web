'use client'

import { useId } from 'react'
import type { ReactElement, RefObject } from 'react'
import { typingKeyboardGeometry, typingKeyboardRows } from '../model/typing-keyboard'
import type { TypingKeyboardKey } from '../model/typing-keyboard'
import { useTypingKeyboardFeedback } from '../model/useTypingKeyboardFeedback'
import { TypingHands } from './TypingHands'

interface TypingKeyboardProps {
    readonly width: number
    readonly height: number
    readonly inputRef: RefObject<HTMLInputElement | null>
    readonly targetText?: string | undefined
    readonly input: string
    readonly cursor?: number | undefined
    readonly active: boolean
    readonly sessionKey: string
}

interface KeyFaceProps {
    readonly definition: TypingKeyboardKey
    readonly sheenId: string
}

function hasKeyLabel(code: string): boolean {
    return (
        code.startsWith('Key') ||
        code === 'Backspace' ||
        code === 'CapsLock' ||
        code === 'Space' ||
        code === 'Minus' ||
        code === 'Quote'
    )
}

function KeyFace({ definition, sheenId }: KeyFaceProps): ReactElement {
    const { x, y, width, height } = definition
    const tone = hasKeyLabel(definition.code) ? definition.tone : 'neutral'
    return (
        <g
            data-keyboard-face={definition.code}
            className={
                tone === 'rose'
                    ? 'text-practice-key-rose'
                    : tone === 'orange'
                      ? 'text-practice-key-orange'
                      : tone === 'amber'
                        ? 'text-practice-key-amber'
                        : tone === 'green'
                          ? 'text-practice-key-green'
                          : tone === 'cyan'
                            ? 'text-practice-key-cyan'
                            : tone === 'blue'
                              ? 'text-practice-key-blue'
                              : tone === 'violet'
                                ? 'text-practice-key-violet'
                                : tone === 'pink'
                                  ? 'text-practice-key-pink'
                                  : 'text-practice-key-neutral'
            }
        >
            <rect
                x={x}
                y={y + 4}
                width={width}
                height={height}
                rx={5}
                className="fill-current brightness-[0.65]"
            />
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                rx={5}
                className="fill-current stroke-practice-keyboard-sheen/45"
                strokeWidth={1}
            />
            <rect
                x={x + 1.5}
                y={y + 1.5}
                width={width - 3}
                height={height - 3}
                rx={4}
                fill={`url(#${sheenId})`}
            />
            <rect
                x={x + 3}
                y={y + 3}
                width={width - 6}
                height={height * 0.3}
                rx={4}
                className="fill-practice-keyboard-sheen/10"
            />
        </g>
    )
}

interface KeyLabelProps {
    readonly definition: TypingKeyboardKey
    readonly target: boolean
    readonly shiftTarget: boolean
    readonly pressed: boolean
    readonly error: boolean
    readonly capsLock: boolean | null
}

function KeyLabel({
    definition,
    target,
    shiftTarget,
    pressed,
    error,
    capsLock,
}: KeyLabelProps): ReactElement {
    const { x, y, width, height, label, code } = definition
    const showLabel = hasKeyLabel(code)
    return (
        <g
            data-keyboard-key={code}
            data-target={target || undefined}
            data-shift-target={shiftTarget || undefined}
            data-pressed={pressed || undefined}
            data-error={error || undefined}
        >
            {(target || shiftTarget) && (
                <rect
                    x={x - 1}
                    y={y - 1}
                    width={width + 2}
                    height={height + 3}
                    rx={6}
                    className="fill-none stroke-practice-keyboard-target"
                    strokeWidth={2}
                    strokeDasharray={shiftTarget ? '3 2' : undefined}
                />
            )}
            {pressed && (
                <rect
                    x={x + 1}
                    y={y + 1}
                    width={width - 2}
                    height={height - 2}
                    rx={4}
                    className="fill-practice-keyboard-pressed/25 stroke-practice-keyboard-pressed"
                    strokeWidth={2.5}
                />
            )}
            {error && (
                <rect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    rx={5}
                    className="fill-practice-keyboard-error/65 stroke-practice-keyboard-error"
                    strokeWidth={2}
                />
            )}
            {showLabel && (
                <text
                    x={x + width / 2}
                    y={y + height / 2 + 1}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={code === 'CapsLock' || code === 'Backspace' ? 9 : 12}
                    fontWeight={600}
                    className="fill-practice-keyboard-label"
                >
                    {code.startsWith('Key') ? label.toUpperCase() : label}
                </text>
            )}
            {(code === 'KeyF' || code === 'KeyJ') && (
                <path
                    d={`M ${x + width / 2 - 3} ${y + height - 5} h 6`}
                    className="stroke-practice-keyboard-label/65"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                />
            )}
            {code === 'CapsLock' && (
                <circle
                    cx={x + width - 7}
                    cy={y + 7}
                    r={2}
                    data-caps-lock={capsLock}
                    className={
                        capsLock
                            ? 'fill-practice-keyboard-pressed'
                            : 'fill-practice-keyboard-ink/70'
                    }
                />
            )}
        </g>
    )
}

/** 原生作答输入是唯一输入源；此视图不产生字符或练习命令。 */
export function TypingKeyboard({
    width,
    height,
    inputRef,
    targetText,
    input,
    cursor,
    active,
    sessionKey,
}: TypingKeyboardProps): ReactElement {
    const gradientId = useId().replaceAll(':', '')
    const state = useTypingKeyboardFeedback({
        inputRef,
        targetText,
        input,
        cursor,
        active,
        sessionKey,
    })
    const { target, feedback } = state
    const isLetter = target?.key.code.startsWith('Key') ?? false
    const shiftCode = target
        ? isLetter && state.capsLock === true
            ? target.shiftKey
                ? null
                : target.key.hand === 'left'
                  ? 'ShiftRight'
                  : 'ShiftLeft'
            : target.shiftKey?.code === 'ShiftLeft'
              ? 'ShiftLeft'
              : target.shiftKey?.code === 'ShiftRight'
                ? 'ShiftRight'
                : null
        : null
    const description = !active
        ? '键盘提示已暂停'
        : target
          ? `下一键：${shiftCode ? 'Shift 加 ' : ''}${target.key.label}`
          : targetText !== undefined && input === targetText
            ? '已完成输入，请确认'
            : '虚拟键盘随作答输入显示按键反馈'
    return (
        <section
            aria-label="指法键盘演示"
            data-typing-keyboard
            data-keyboard-active={active}
            className="mx-auto w-full max-w-full"
            style={{ maxWidth: width }}
        >
            <div
                data-keyboard-canvas
                className="pointer-events-none relative isolate w-full select-none overflow-hidden rounded-[3%]"
                style={{ aspectRatio: `${width}/${height}` }}
            >
                <svg
                    aria-hidden="true"
                    viewBox={`0 0 ${typingKeyboardGeometry.width} ${typingKeyboardGeometry.height}`}
                    preserveAspectRatio="none"
                    className="absolute inset-0 h-full w-full"
                >
                    <defs>
                        <linearGradient id={gradientId} x1="0" y1="0" x2="0.3" y2="1">
                            <stop
                                offset="0"
                                className="[stop-color:var(--app-color-practice-keyboard-sheen)]"
                                stopOpacity={0.5}
                            />
                            <stop
                                offset="0.38"
                                className="[stop-color:var(--app-color-practice-keyboard-sheen)]"
                                stopOpacity={0}
                            />
                            <stop
                                offset="1"
                                className="[stop-color:var(--app-color-practice-keyboard-ink)]"
                                stopOpacity={0.22}
                            />
                        </linearGradient>
                        <linearGradient id={`${gradientId}-frame`} x1="0" y1="0" x2="1" y2="0.6">
                            <stop
                                offset="0"
                                className="[stop-color:var(--app-color-practice-keyboard-sheen)]"
                                stopOpacity={0.7}
                            />
                            <stop
                                offset="0.4"
                                className="[stop-color:var(--app-color-practice-keyboard-sheen)]"
                                stopOpacity={0.04}
                            />
                            <stop
                                offset="1"
                                className="[stop-color:var(--app-color-practice-keyboard-ink)]"
                                stopOpacity={0.4}
                            />
                        </linearGradient>
                    </defs>
                    <rect
                        x={1}
                        y={1}
                        width={718}
                        height={258}
                        rx={15}
                        className="fill-practice-keyboard-frame stroke-practice-keyboard-rim"
                        strokeWidth={1.5}
                    />
                    <rect
                        x={2}
                        y={2}
                        width={716}
                        height={256}
                        rx={14}
                        fill={`url(#${gradientId}-frame)`}
                    />
                    {typingKeyboardRows.map((row, rowIndex) => (
                        <g key={row[0]?.code} data-keyboard-row={rowIndex}>
                            {row.map((key) => (
                                <KeyFace key={key.code} definition={key} sheenId={gradientId} />
                            ))}
                        </g>
                    ))}
                </svg>
                <TypingHands
                    targetCode={target?.key.code ?? feedback?.key?.code ?? null}
                    shiftCode={shiftCode}
                />
                <svg
                    aria-hidden="true"
                    viewBox={`0 0 ${typingKeyboardGeometry.width} ${typingKeyboardGeometry.height}`}
                    preserveAspectRatio="none"
                    className="absolute inset-0 z-20 h-full w-full"
                >
                    {typingKeyboardRows.flat().map((key) => (
                        <KeyLabel
                            key={key.code}
                            definition={key}
                            target={target?.key.code === key.code}
                            shiftTarget={shiftCode === key.code}
                            pressed={
                                (feedback?.kind !== 'error' && feedback?.key?.code === key.code) ||
                                (key.code === 'ShiftLeft' && state.shiftLeft) ||
                                (key.code === 'ShiftRight' && state.shiftRight)
                            }
                            error={feedback?.kind === 'error' && feedback.key?.code === key.code}
                            capsLock={state.capsLock}
                        />
                    ))}
                </svg>
            </div>
            <p className="sr-only" aria-live="polite">
                {description}
            </p>
        </section>
    )
}
