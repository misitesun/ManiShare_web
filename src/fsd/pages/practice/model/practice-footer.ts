import type { ShortcutPreferences } from '../../../features/learning-settings'
import { isSentenceGameFamily } from './sentence-game-family'
import type { PracticeCommand } from './practice-command-types'
import { getPracticeCommandBindings } from './practice-bindings'
import type { PracticeFamily, PracticeMode, PracticePhase } from './practice-demo'
import type { WordMeaningState } from './word-meaning'

export type PracticeFooterPreferences = ShortcutPreferences

export type PracticeFooterOralStage = 'idle' | 'recording' | 'evaluating' | 'result' | 'error'

export interface PracticeFooterContext {
    readonly family: PracticeFamily
    readonly mode: PracticeMode
    readonly phase: PracticePhase
    readonly index: number
    readonly total: number
    readonly values: PracticeFooterPreferences
    readonly oralStage?: PracticeFooterOralStage
    readonly panelVisible?: boolean
    readonly wordMeaning?: WordMeaningState
}

export interface PracticeFooterItem {
    readonly id: string
    readonly label: string
    readonly action?: PracticeCommand
    readonly shortcuts: readonly string[]
    readonly disabled?: boolean
    readonly expanded?: boolean
    readonly kind?: 'action' | 'hint'
    readonly size?: 'direction' | 'standard' | 'panel' | 'primary' | 'hint' | 'playback'
}

type FooterSlot =
    | 'previous'
    | 'mastered'
    | 'read'
    | 'input'
    | 'primary'
    | 'contextual'
    | 'panel'
    | 'unfamiliar'
    | 'navigation'
    | 'next'
    | 'playback'

const reading: readonly FooterSlot[] = ['previous', 'playback', 'next']
const typing: readonly FooterSlot[] = ['previous', 'read', 'navigation', 'next']
const oral: readonly FooterSlot[] = [
    'previous',
    'mastered',
    'read',
    'primary',
    'unfamiliar',
    'navigation',
    'next',
]
const translate: readonly FooterSlot[] = [
    'previous',
    'input',
    'mastered',
    'read',
    'primary',
    'panel',
    'unfamiliar',
    'navigation',
    'next',
]
const check: readonly FooterSlot[] = [
    'previous',
    'mastered',
    'read',
    'primary',
    'unfamiliar',
    'navigation',
    'next',
]
const blocks: readonly FooterSlot[] = [
    'previous',
    'mastered',
    'read',
    'panel',
    'unfamiliar',
    'navigation',
    'next',
]
const listen: readonly FooterSlot[] = [
    'previous',
    'mastered',
    'read',
    'contextual',
    'panel',
    'unfamiliar',
    'navigation',
    'next',
]
const layouts: Readonly<
    Record<PracticeFamily, Readonly<Partial<Record<PracticeMode, readonly FooterSlot[]>>>>
> = {
    word: {
        pronounce: [
            'previous',
            'mastered',
            'read',
            'contextual',
            'unfamiliar',
            'navigation',
            'next',
        ],
        spell: [
            'previous',
            'mastered',
            'read',
            'primary',
            'panel',
            'unfamiliar',
            'navigation',
            'next',
        ],
        dictate: [
            'previous',
            'mastered',
            'read',
            'primary',
            'panel',
            'unfamiliar',
            'navigation',
            'next',
        ],
        meaning: [
            'previous',
            'primary',
            'mastered',
            'read',
            'panel',
            'unfamiliar',
            'navigation',
            'next',
        ],
        typing,
        oral,
    },
    sentence: { listen, read: reading, translate, check, typing, oral, blocks },
    audio: { listen, read: reading, translate, check, typing, oral, blocks },
    video: { listen: [], translate, check, typing, oral, blocks },
    picture: {
        listen: ['previous', 'mastered', 'read', 'panel', 'unfamiliar', 'navigation', 'next'],
        translate,
        typing,
        oral,
    },
    typing: { typing: ['previous', 'navigation', 'next'] },
    phonetics: {
        pronounce: ['previous', 'read', 'panel', 'navigation', 'next'],
        oral,
    },
    guess: {
        guess: ['previous', 'read', 'navigation', 'next'],
        read: reading,
        spell: ['previous', 'read', 'primary', 'panel', 'navigation', 'next'],
    },
    'audio-reader': { read: [] },
    'video-reader': { read: [] },
    'picture-reader': { read: ['previous', 'contextual', 'next'] },
    'text-reader': { read: [] },
}

export function supportsPracticeKnowledge(family: PracticeFamily, mode: PracticeMode): boolean {
    if (family === 'word') return mode !== 'typing' && Boolean(layouts.word[mode])
    if (family === 'sentence')
        return mode !== 'typing' && mode !== 'read' && Boolean(layouts.sentence[mode])
    return family === 'picture' && (mode === 'listen' || mode === 'translate' || mode === 'oral')
}

export function supportsPracticePanel(family: PracticeFamily, mode: PracticeMode): boolean {
    return (
        ['word', 'sentence', 'audio', 'video', 'picture', 'guess', 'phonetics'].includes(family) &&
        Boolean(layouts[family][mode])
    )
}

export function formatPracticeShortcut(shortcut: string): string {
    const symbols: Readonly<Record<string, string>> = {
        ArrowLeft: '←',
        ArrowRight: '→',
        ArrowUp: '↑',
        ArrowDown: '↓',
        Space: '空格',
        Escape: 'Esc',
    }
    return shortcut
        .split(' + ')
        .map((part) => symbols[part] ?? part)
        .join('+')
}

function bindings(
    context: PracticeFooterContext,
    ...commands: PracticeCommand[]
): readonly string[] {
    return [
        ...new Set(
            commands.flatMap((command) => getPracticeCommandBindings(command, context.values)),
        ),
    ]
}

function action(
    id: string,
    label: string,
    command: PracticeCommand,
    context: PracticeFooterContext,
    size: PracticeFooterItem['size'] = 'standard',
): PracticeFooterItem {
    return {
        id,
        label,
        action: command,
        shortcuts: bindings(context, command),
        size,
        kind: 'action',
    }
}

function finished(context: PracticeFooterContext): boolean {
    return context.phase === 'revealed' || context.phase === 'correct'
}

function primaryItems(context: PracticeFooterContext): readonly PracticeFooterItem[] {
    if (
        context.family === 'word' &&
        context.mode === 'meaning' &&
        context.wordMeaning?.variant === 'context'
    )
        return [
            {
                ...action(
                    'primary',
                    context.wordMeaning.translationVisible ? '下一题' : '显示中文',
                    'practice.contextual',
                    context,
                    'primary',
                ),
                shortcuts: bindings(context, 'practice.contextual', 'practice.primary'),
            },
        ]
    if (context.mode === 'oral') {
        const stage = context.oralStage ?? 'idle'
        if (stage === 'result')
            return [
                action('primary', '下一题', 'practice.primary', context, 'primary'),
                action('contextual', '回放录音', 'practice.contextual', context, 'primary'),
                action('oral', '重新录制', 'practice.oral', context, 'primary'),
            ]
        if (stage === 'evaluating')
            return [
                { id: 'primary', label: '评测中', shortcuts: [], disabled: true, size: 'primary' },
            ]
        if (stage === 'error')
            return [
                {
                    id: 'primary',
                    label: '请使用上方重试',
                    shortcuts: [],
                    kind: 'hint',
                    size: 'primary',
                },
            ]
        return [
            {
                ...action(
                    'primary',
                    stage === 'recording' ? '结束录音' : '开始录音',
                    'practice.primary',
                    context,
                    'primary',
                ),
                shortcuts: bindings(
                    context,
                    'practice.primary',
                    'practice.contextual',
                    'practice.oral',
                ),
            },
        ]
    }
    const next = finished(context)
    const reveal = context.mode === 'check' || context.mode === 'guess'
    const item = action(
        'primary',
        next ? '下一题' : reveal ? '显示答案' : context.mode === 'typing' ? '确认' : '提交',
        'practice.primary',
        context,
        'primary',
    )
    return [
        {
            ...item,
            shortcuts:
                next ||
                reveal ||
                (context.family === 'word' &&
                    (context.mode === 'spell' || context.mode === 'meaning'))
                    ? bindings(context, 'practice.primary', 'practice.contextual')
                    : item.shortcuts,
        },
    ]
}

function slotItems(
    slot: FooterSlot,
    context: PracticeFooterContext,
): readonly PracticeFooterItem[] {
    switch (slot) {
        case 'previous':
            return [
                {
                    ...action('previous', '上一题', 'question.previous', context, 'direction'),
                    shortcuts: [],
                    disabled: context.index <= 0 || context.total <= 0,
                },
            ]
        case 'next':
            return [
                {
                    ...action('next', '下一题', 'question.next', context, 'direction'),
                    shortcuts: [],
                    disabled: context.total <= 0,
                },
            ]
        case 'mastered':
        case 'unfamiliar': {
            if (!supportsPracticeKnowledge(context.family, context.mode)) return []
            return [
                action(
                    slot,
                    slot === 'mastered' ? '掌握' : '不熟',
                    slot === 'mastered' ? 'practice.markMastered' : 'practice.markUnfamiliar',
                    context,
                ),
            ]
        }
        case 'read':
            return [action('read-aloud', '朗读', 'practice.readAloud', context)]
        case 'playback':
            return [
                {
                    ...action('playback', '播放', 'practice.readAloud', context, 'playback'),
                    shortcuts: [],
                },
            ]
        case 'primary':
            return primaryItems(context)
        case 'input':
            return finished(context)
                ? []
                : [
                      {
                          id: 'input',
                          label: '跳格',
                          shortcuts:
                              isSentenceGameFamily(context.family) && context.mode === 'translate'
                                  ? ['Space', '← / →']
                                  : ['← / →'],
                          kind: 'hint',
                          size: 'hint',
                      },
                  ]
        case 'panel':
            return supportsPracticePanel(context.family, context.mode)
                ? [
                      {
                          ...action(
                              'panel',
                              context.family === 'phonetics' ? '详情' : '答案',
                              'practice.panel.toggle',
                              context,
                              'panel',
                          ),
                          expanded: context.panelVisible ?? false,
                      },
                  ]
                : []
        case 'contextual':
            return [
                action(
                    'contextual',
                    context.family === 'picture-reader' ? '翻页' : '播放/暂停',
                    'practice.contextual',
                    context,
                    'primary',
                ),
            ]
        case 'navigation':
            return [
                {
                    id: 'navigation',
                    label: '切题',
                    shortcuts: bindings(context, 'question.previous', 'question.next'),
                    kind: 'hint',
                    size: 'hint',
                },
            ]
    }
}

export function getPracticeFooter(context: PracticeFooterContext): readonly PracticeFooterItem[] {
    const slots: readonly FooterSlot[] =
        context.family === 'word' &&
        context.mode === 'meaning' &&
        context.wordMeaning?.variant === 'context'
            ? ['previous', 'mastered', 'read', 'primary', 'unfamiliar', 'navigation', 'next']
            : (layouts[context.family][context.mode] ?? [])
    return slots.flatMap((slot) => slotItems(slot, context))
}
