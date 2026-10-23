import assert from 'node:assert/strict'
import test from 'node:test'
import type { OralAssessmentStage } from '../../../features/oral-assessment'
import { resolvePhoneticsOralCommand } from './phonetics-oral-command'

test('音标卡内V沿同一评测阶段执行开始、结束和重录，评测中不重复提交', (): void => {
    for (const [stage, action] of [
        ['idle', 'start'],
        ['recording', 'stop'],
        ['evaluating', 'none'],
        ['result', 'rerecord'],
    ] as const)
        assert.equal(resolvePhoneticsOralCommand(stage, 'practice.oral'), action)
})

test('空格和Enter在录制中结束、评测中忽略，结果空格回放，其余沿原题面命令', (): void => {
    for (const command of ['practice.contextual', 'practice.primary'] as const) {
        assert.equal(resolvePhoneticsOralCommand('idle', command), 'fallback')
        assert.equal(resolvePhoneticsOralCommand('recording', command), 'stop')
        assert.equal(resolvePhoneticsOralCommand('evaluating', command), 'none')
    }
    assert.equal(resolvePhoneticsOralCommand('result', 'practice.contextual'), 'replay')
    assert.equal(resolvePhoneticsOralCommand('result', 'practice.primary'), 'fallback')
    const stages: readonly OralAssessmentStage[] = ['idle', 'recording', 'evaluating', 'result']
    for (const stage of stages) {
        for (const command of [
            'question.next',
            'question.previous',
            'practice.dismiss',
            'practice.panel.show',
        ] as const)
            assert.equal(resolvePhoneticsOralCommand(stage, command), 'fallback')
        assert.equal(
            resolvePhoneticsOralCommand(stage, 'practice.readAloud'),
            stage === 'recording' || stage === 'evaluating' ? 'none' : 'fallback',
        )
    }
})
