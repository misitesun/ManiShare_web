import assert from 'node:assert/strict'
import test from 'node:test'
import type { PracticeFamily, PracticeMode, PracticePhase } from './practice-demo'
import type { OralDemoStage } from './oral-demo'
import { resolvePracticePrimary } from './practice-primary'

function resolve(
    changes: Partial<Parameters<typeof resolvePracticePrimary>[0]> = {},
): ReturnType<typeof resolvePracticePrimary> {
    return resolvePracticePrimary({
        family: 'word',
        mode: 'spell',
        phase: 'answering',
        oralStage: 'idle',
        quickOral: false,
        ...changes,
    })
}

test('输入和拼块主动作只提交当前题，答错后仍提交，不直接判对或下一题', (): void => {
    for (const mode of ['spell', 'dictate', 'translate', 'blocks', 'meaning'] as const)
        for (const phase of ['answering', 'incorrect'] as const) {
            const context = Object.freeze({
                family: 'word' as const,
                mode,
                phase,
                oralStage: 'idle' as const,
                quickOral: false,
            })
            assert.equal(resolvePracticePrimary(context), 'submit')
            assert.equal(context.phase, phase)
        }
})

test('猜词输入交给通用校验，自查保留揭晓，已有答案时统一推进', (): void => {
    for (const phase of ['answering', 'incorrect'] as const) {
        assert.equal(resolve({ family: 'guess', mode: 'guess', phase }), 'submit')
        assert.equal(resolve({ family: 'sentence', mode: 'check', phase }), 'reveal')
    }
    for (const phase of ['revealed', 'correct'] as const)
        for (const mode of ['spell', 'translate', 'guess', 'check', 'blocks'] as const)
            assert.equal(resolve({ mode, phase }), 'next')
})

test('指法统一交给作答控制器校验，只有进入正确题态后才推进', (): void => {
    for (const family of ['word', 'sentence', 'audio', 'video', 'picture', 'typing'] as const) {
        assert.equal(resolve({ family, mode: 'typing', phase: 'answering' }), 'submit')
        assert.equal(resolve({ family, mode: 'typing', phase: 'incorrect' }), 'submit')
        assert.equal(resolve({ family, mode: 'typing', phase: 'correct' }), 'next')
    }
})

test('展示、听力、阅读与纯内容的主动作推进当前内容，不依赖底栏是否存在', (): void => {
    const cases: readonly { readonly family: PracticeFamily; readonly mode: PracticeMode }[] = [
        { family: 'word', mode: 'pronounce' },
        { family: 'sentence', mode: 'listen' },
        { family: 'phonetics', mode: 'pronounce' },
        { family: 'guess', mode: 'read' },
        { family: 'audio-reader', mode: 'read' },
        { family: 'video-reader', mode: 'read' },
        { family: 'picture-reader', mode: 'read' },
        { family: 'text-reader', mode: 'read' },
    ]
    for (const context of cases) assert.equal(resolve(context), 'next')
})

test('口语主动作按阶段推进，评测不重入，快捷结果返回原题而独立结果下一题', (): void => {
    const stages: readonly OralDemoStage[] = ['idle', 'recording', 'evaluating', 'result', 'error']
    for (const phase of ['answering', 'revealed', 'correct', 'incorrect'] as const)
        for (const quickOral of [false, true])
            for (const oralStage of stages) {
                const expected =
                    oralStage === 'idle'
                        ? 'oral-start'
                        : oralStage === 'recording'
                          ? 'oral-stop'
                          : oralStage === 'result'
                            ? quickOral
                                ? 'oral-complete'
                                : 'next'
                            : 'none'
                assert.equal(
                    resolve({ mode: quickOral ? 'spell' : 'oral', phase, quickOral, oralStage }),
                    expected,
                    `${phase}:${quickOral}:${oralStage}`,
                )
            }
})

test('主流程解析不改变调用者提供的题态或口语阶段', (): void => {
    const context: {
        readonly family: PracticeFamily
        readonly mode: PracticeMode
        readonly phase: PracticePhase
        readonly oralStage: OralDemoStage
        readonly quickOral: boolean
    } = Object.freeze({
        family: 'word',
        mode: 'oral',
        phase: 'correct',
        oralStage: 'result',
        quickOral: true,
    })
    assert.equal(resolvePracticePrimary(context), 'oral-complete')
    assert.equal(context.phase, 'correct')
    assert.equal(context.oralStage, 'result')
})
