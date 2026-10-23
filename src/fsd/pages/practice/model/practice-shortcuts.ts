import { matchesShortcut } from '../../../features/learning-settings'
import { isSentenceGameFamily } from './sentence-game-family'
import type { ShortcutInput, ShortcutPreferences } from '../../../features/learning-settings'
import type { PracticeCommand } from './practice-command-types'
import type { PracticeFamily, PracticeMode, PracticePhase } from './practice-demo'
import { getPracticeCommandBindings } from './practice-bindings'
import {
    canShowQuickOral,
    hasPracticeAnswerInput,
    isPracticeAnswerVisible,
} from './practice-visibility'
import { supportsPracticeKnowledge, supportsPracticePanel } from './practice-footer'
import type { OralDemoStage } from './oral-demo'
import type { WordMeaningVariant } from './word-meaning'

export type PracticeKeyboardTarget = 'content' | 'answer-input' | 'editor' | 'native'
export interface PracticeShortcutContext {
    readonly family: PracticeFamily
    readonly mode: PracticeMode
    readonly phase: PracticePhase
    readonly oralStage: OralDemoStage
    readonly hasTarget: boolean
    readonly showEvaluation: boolean
    readonly panelVisible: boolean
    readonly scope: 'question' | 'oral' | 'finish' | 'blocked'
    readonly ready: boolean
    readonly values: ShortcutPreferences
    /** 全部真实练习作答输入显式启用；普通编辑器保留原生行为。 */
    readonly answerInputCommands?: boolean
    readonly wordMeaningVariant?: WordMeaningVariant
}
export interface PracticeKeyInput extends ShortcutInput {
    readonly repeat?: boolean
    readonly isComposing?: boolean
    readonly defaultPrevented?: boolean
}

function matches(
    event: ShortcutInput,
    command: PracticeCommand,
    values: ShortcutPreferences,
): boolean {
    return getPracticeCommandBindings(command, values).some((key) => {
        if (['Enter', 'Space', 'V', 'Escape', 'ArrowDown', 'ArrowUp'].includes(key)) {
            const normalized =
                event.key === ' '
                    ? 'Space'
                    : event.key.length === 1
                      ? event.key.toUpperCase()
                      : event.key
            return (
                !event.ctrlKey &&
                !event.altKey &&
                !event.shiftKey &&
                !event.metaKey &&
                normalized === key
            )
        }
        return matchesShortcut(event, key)
    })
}

/** 这里只解析意图；点击和按键最终都交给页面的同一个执行入口。 */
export function resolvePracticeShortcut(
    event: PracticeKeyInput,
    context: PracticeShortcutContext,
    target: PracticeKeyboardTarget,
): PracticeCommand | null {
    if (
        !context.ready ||
        event.repeat ||
        event.isComposing ||
        event.defaultPrevented ||
        context.scope === 'blocked' ||
        target === 'editor'
    )
        return null
    const { values, family, mode, phase } = context
    const answerCommands =
        context.answerInputCommands === true &&
        hasPracticeAnswerInput(mode, context.wordMeaningVariant)
    const plain = !event.ctrlKey && !event.altKey && !event.shiftKey && !event.metaKey
    if (
        target === 'answer-input' &&
        plain &&
        (event.key === 'ArrowLeft' || event.key === 'ArrowRight')
    )
        return null
    // 原生控件的 Enter / 空格 / 方向键由控件激活一次，不由全局再执行。
    if (
        target === 'native' &&
        plain &&
        (event.key === 'Enter' || event.key === ' ' || event.key.startsWith('Arrow'))
    )
        return null
    if (context.scope === 'finish') {
        if (matches(event, 'session.replay', values)) return 'session.replay'
        if (matches(event, 'session.nextChapter', values)) return 'session.nextChapter'
        return null
    }
    if (context.scope === 'oral') {
        if (target === 'answer-input') return null
        if (matches(event, 'practice.oral', values))
            return context.oralStage === 'evaluating' || context.oralStage === 'error'
                ? null
                : 'practice.oral'
        if (matches(event, 'practice.primary', values))
            return context.oralStage === 'evaluating' || context.oralStage === 'error'
                ? null
                : 'practice.primary'
        if (matches(event, 'practice.contextual', values))
            return context.oralStage === 'evaluating' || context.oralStage === 'error'
                ? null
                : 'practice.contextual'
        return null
    }
    if (matches(event, 'practice.dismiss', values)) return 'practice.dismiss'
    if (
        target === 'answer-input' &&
        (event.ctrlKey || event.metaKey) &&
        !event.altKey &&
        ['a', 'c', 'x', 'v', 'z', 'y'].includes(event.key.toLowerCase())
    )
        return null
    // Shift字符仍属于原生文本输入，避免朗读或知识快捷键吞掉大写字母。
    // Shift方向键等显式组合仍可执行用户配置的切题动作。
    if (
        target === 'answer-input' &&
        !answerCommands &&
        event.shiftKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !event.metaKey &&
        event.key.length === 1
    )
        return null
    for (const command of ['question.previous', 'question.next', 'practice.readAloud'] as const) {
        if (family === 'typing' && command === 'practice.readAloud') continue
        if (matches(event, command, values)) return command
    }
    if (target === 'answer-input' && !answerCommands && plain && event.key.startsWith('Arrow'))
        return null
    if (supportsPracticeKnowledge(family, mode))
        for (const command of ['practice.markMastered', 'practice.markUnfamiliar'] as const)
            if (matches(event, command, values)) return command
    if (
        supportsPracticePanel(family, mode) &&
        !(
            (isSentenceGameFamily(family) &&
                (mode === 'read' || mode === 'check' || mode === 'typing' || mode === 'oral')) ||
            (family === 'video' && (mode === 'check' || mode === 'typing' || mode === 'oral'))
        )
    ) {
        if (matches(event, 'practice.panel.hide', values) && context.panelVisible)
            return 'practice.panel.hide'
        if (matches(event, 'practice.panel.show', values)) return 'practice.panel.show'
    }
    if (matches(event, 'practice.oral', values)) {
        if (target === 'answer-input' && !answerCommands) return null
        if (mode === 'oral')
            return context.oralStage === 'evaluating' || context.oralStage === 'error'
                ? null
                : 'practice.oral'
        return canShowQuickOral(
            family,
            mode,
            phase,
            context.hasTarget,
            context.showEvaluation,
            context.wordMeaningVariant,
        )
            ? 'practice.oral'
            : null
    }
    if (matches(event, 'practice.primary', values)) return 'practice.primary'
    if (matches(event, 'practice.contextual', values)) {
        if (target === 'answer-input') return null
        if (isSentenceGameFamily(family) && mode === 'read') return 'practice.readAloud'
        if (family === 'word' && mode === 'meaning' && context.wordMeaningVariant === 'context')
            return 'practice.contextual'
        if (
            answerCommands &&
            hasPracticeAnswerInput(mode, context.wordMeaningVariant) &&
            !isPracticeAnswerVisible(phase)
        )
            return 'practice.contextual'
        // 其他阅读保留滚动；词块空格只由当前聚焦的真实词块按钮处理。
        if (family === 'text-reader' || (mode === 'read' && !family.endsWith('-reader')))
            return null
        if (mode === 'blocks' && !isPracticeAnswerVisible(phase)) return null
        if (
            ['spell', 'dictate', 'translate', 'meaning', 'typing'].includes(mode) &&
            !isPracticeAnswerVisible(phase)
        )
            return null
        if (
            mode === 'oral' &&
            (context.oralStage === 'evaluating' || context.oralStage === 'error')
        )
            return null
        return 'practice.contextual'
    }
    return null
}
