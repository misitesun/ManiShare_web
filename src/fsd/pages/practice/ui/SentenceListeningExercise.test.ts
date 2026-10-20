import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import type { ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import {
    LearningSettingsProvider,
    useLearningSettingsSnapshot,
} from '../../../features/learning-settings'
import { getDemoQuestions } from '../model/practice-demo'
import { SentenceListeningExercise } from './SentenceListeningExercise'

interface ListeningFixtureProps {
    readonly imageVisible?: boolean
    readonly translationVisible?: boolean
    readonly blocked?: boolean
    readonly oralEnabled?: boolean
}

function ignore(): void {}

function ListeningFixture({
    imageVisible = true,
    translationVisible = true,
    blocked = false,
    oralEnabled = true,
}: ListeningFixtureProps): ReactElement {
    const { values } = useLearningSettingsSnapshot()
    const question = getDemoQuestions('sentence')[0]
    if (!question) throw new Error('缺少听力示例题')
    return createElement(SentenceListeningExercise, {
        question,
        values,
        imageVisible,
        translationVisible,
        blocked,
        oralEnabled,
        reading: { status: 'pending-source', waveStyle: '波形线条' },
        onNote: ignore,
        onOral: ignore,
    })
}

function renderListening(props: ListeningFixtureProps): string {
    return renderToStaticMarkup(
        createElement(LearningSettingsProvider, null, createElement(ListeningFixture, props)),
    )
}

test('听力入口只组合题图、逐词解析、中文、笔记及一个受控口语入口', (): void => {
    const html = renderListening({})
    assert.match(html, /data-annotation-variant="sentence-listening"/)
    assert.match(html, /data-practice-translation/)
    assert.match(html, /data-practice-reading-overlay="pending-source"/)
    assert.equal(html.match(/data-practice-quick-oral/g)?.length, 1)
    assert.equal(html.match(/<button/g)?.length, 2)
    assert.doesNotMatch(html, /<audio|<input|完整|拆分/)
    assert.match(html, /音源待接入/)
})

test('图、中文及口语显隐独立，隐藏题图同时移除其声纹', (): void => {
    const html = renderListening({
        imageVisible: false,
        translationVisible: false,
        oralEnabled: false,
    })
    assert.doesNotMatch(
        html,
        /data-practice-media|data-practice-reading-overlay|data-practice-translation|data-practice-quick-oral/,
    )
    assert.match(html, /data-sentence-listening-note/)
    assert.match(html, /逐词解析/)
})

test('阻断时笔记和口语均禁用，首屏不申请媒体或权限', (): void => {
    const html = renderListening({ blocked: true })
    assert.equal(html.match(/<button[^>]*disabled=""/g)?.length, 2)
    assert.doesNotMatch(html, /<audio|<video|autoplay/)
})
