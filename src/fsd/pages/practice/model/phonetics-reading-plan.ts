import type { PracticeQuestion } from './practice-demo'
import { practiceMediaSource } from './media-controller'

export type PhoneticsReadingStep = 'target-phonetic' | 'word' | 'phonics'

/** 用户确认的阶段顺序；phonics阶段需由题目提供多个真实音段，不在此生成音源。 */
export function createPhoneticsReadingPlan(
    naturalPhonics: boolean,
): readonly PhoneticsReadingStep[] {
    return naturalPhonics
        ? ['target-phonetic', 'word', 'phonics', 'word']
        : ['target-phonetic', 'word']
}

export function describePhoneticsReadingPlan(naturalPhonics: boolean): string {
    const labels: Readonly<Record<PhoneticsReadingStep, string>> = {
        'target-phonetic': '目标音标',
        word: '单词',
        phonics: '自然拼读音段',
    }
    return createPhoneticsReadingPlan(naturalPhonics)
        .map((step) => labels[step])
        .join(' → ')
}

export interface PhoneticsAudioStep {
    readonly id: string
    readonly kind: PhoneticsReadingStep
    readonly label: string
    readonly source: string
    readonly segmentId?: string
}

export type PhoneticsAudioPlan =
    | { readonly kind: 'ready'; readonly steps: readonly PhoneticsAudioStep[] }
    | { readonly kind: 'unavailable'; readonly message: string }

export type PhoneticsPlaybackRequest =
    | { readonly kind: 'sequence' }
    | { readonly kind: 'target' }
    | { readonly kind: 'word' }
    | { readonly kind: 'segment'; readonly segmentId: string }

function createWordAudioPlan(question: PracticeQuestion): PhoneticsAudioPlan {
    const source = practiceMediaSource(question.readingSource)
    if (!source) return { kind: 'unavailable', message: `${question.english} 缺少可用的整词音源。` }
    return {
        kind: 'ready',
        steps: [{ id: `${question.id}:word`, kind: 'word', label: question.english, source }],
    }
}

/** 按课程目标和显式字母音展开，缺源时整次提示，不跳过阶段伪装为完整朗读。 */
export function createPhoneticsAudioPlan(
    question: PracticeQuestion,
    naturalPhonics: boolean,
    request: PhoneticsPlaybackRequest = { kind: 'sequence' },
): PhoneticsAudioPlan {
    if (request.kind === 'word') return createWordAudioPlan(question)
    const content = question.phonetics
    if (!content) return { kind: 'unavailable', message: '当前词例缺少音标课程与音素数据。' }
    if (request.kind === 'segment') {
        const segment = content.segments.find((entry) => entry.id === request.segmentId)
        if (!segment) return { kind: 'unavailable', message: '当前词例没有对应的音素数据。' }
        const source = practiceMediaSource(segment.readingSource)
        if (!source) return { kind: 'unavailable', message: `音素 /${segment.ipa}/ 缺少可用音源。` }
        return {
            kind: 'ready',
            steps: [
                {
                    id: segment.id,
                    kind: 'phonics',
                    label: `/${segment.ipa}/`,
                    source,
                    segmentId: segment.id,
                },
            ],
        }
    }
    const target = practiceMediaSource(content.lesson.readingSource)
    if (!target)
        return {
            kind: 'unavailable',
            message: `目标音标 /${content.lesson.targetPhonetic}/ 缺少可用音源。`,
        }
    const steps: PhoneticsAudioStep[] = [
        {
            id: `${question.id}:target`,
            kind: 'target-phonetic',
            label: `/${content.lesson.targetPhonetic}/`,
            source: target,
        },
    ]
    if (request.kind === 'target') return { kind: 'ready', steps }
    const wordPlan = createWordAudioPlan(question)
    if (wordPlan.kind === 'unavailable') return wordPlan
    steps.push(...wordPlan.steps)
    if (naturalPhonics) {
        if (content.segments.length === 0)
            return { kind: 'unavailable', message: '当前词例缺少自然拼读音素数据。' }
        for (const segment of content.segments) {
            const source = practiceMediaSource(segment.readingSource)
            if (!source)
                return { kind: 'unavailable', message: `音素 /${segment.ipa}/ 缺少可用音源。` }
            steps.push({
                id: segment.id,
                kind: 'phonics',
                label: `/${segment.ipa}/`,
                source,
                segmentId: segment.id,
            })
        }
        for (const word of wordPlan.steps) steps.push({ ...word, id: `${question.id}:word-final` })
    }
    return { kind: 'ready', steps }
}
