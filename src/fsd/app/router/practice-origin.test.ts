import assert from 'node:assert/strict'
import test from 'node:test'
import {
    buildPracticePath,
    resolvePracticeBackPath,
    resolvePracticeDraftScope,
    resolvePracticeExitPath,
} from './practice-origin'
import { practiceViewQuery } from '../../pages/practice'

test('退出分为项目首页和经校验的来源课程，不接收任意返回URL', (): void => {
    assert.equal(resolvePracticeExitPath('home', 'phonetics'), '/')
    assert.equal(resolvePracticeExitPath('course', 'phonetics'), '/awakening/courses/phonetics/')
    assert.equal(
        resolvePracticeExitPath('course', 'phonetics-continuation'),
        '/awakening/courses/phonetics-continuation/',
    )
    for (const source of [
        null,
        '',
        'missing',
        '//example.com',
        'https://example.com',
        '../settings',
        'phonetics?next=/settings/',
    ]) {
        assert.equal(resolvePracticeExitPath('course', source), '/awakening/')
        assert.equal(resolvePracticeExitPath('home', source), '/')
    }
})

test('单词演示只携带模式和白名单课程来源，不伪造章节题库ID', (): void => {
    const path = buildPracticePath('phonetics', 'word-basic', 'spell')
    const [pathname, search] = path.split('?')
    const query = new URLSearchParams(search)
    assert.equal(pathname, '/practice/')
    assert.equal(query.get('demo'), 'word-basic')
    assert.equal(query.get('mode'), 'spell')
    assert.equal(query.get('sourceCourse'), 'phonetics')
    assert.equal(query.has('chapterId'), false)
    assert.equal(query.has('sourceChapter'), false)
    assert.equal(
        resolvePracticeBackPath(query.get('sourceCourse')),
        '/awakening/courses/phonetics/',
    )
    assert.equal(
        resolvePracticeBackPath('phonetics-continuation'),
        '/awakening/courses/phonetics-continuation/',
    )
    assert.throws(() => buildPracticePath('unknown', 'word-basic', 'pronounce'))
})

test('十二类本地演示可从课程进入，来源只用于返回，不更改目标模式', (): void => {
    const entries = [
        ['word-basic', 'pronounce'],
        ['sentence-basic', 'listen'],
        ['audio-basic', 'listen'],
        ['video-basic', 'listen'],
        ['typing-basic', 'typing'],
        ['phonetics-basic', 'pronounce'],
        ['picture-reader', 'read'],
        ['guess-basic', 'guess'],
        ['video-reader', 'read'],
        ['audio-reader', 'read'],
        ['text-reader', 'read'],
        ['picture-basic', 'listen'],
    ] as const
    for (const [demoId, mode] of entries) {
        const path = buildPracticePath('phonetics-continuation', demoId, mode)
        const query = new URLSearchParams(path.split('?')[1])
        assert.equal(query.get('demo'), demoId)
        assert.equal(query.get('mode'), mode)
        assert.equal(query.get('sourceCourse'), 'phonetics-continuation')
    }
    const oralQuery = new URLSearchParams(
        buildPracticePath('phonetics', 'phonetics-basic', 'oral').split('?')[1],
    )
    assert.equal(oralQuery.get('mode'), 'oral')
})

test('未知演示或模式组合拒绝生成URL，不静默跳成其他模式', (): void => {
    for (const [demoId, mode] of [
        ['unknown', 'pronounce'],
        ['word-basic', 'listen'],
        ['video-basic', 'read'],
        ['picture-basic', 'guess'],
        ['typing-basic', 'spell'],
        ['text-reader', 'typing'],
        ['word-basic', ''],
        ['word-basic', 'pronounce&sourceCourse=unknown'],
        ['../settings', 'read'],
    ]) {
        assert.throws(() => buildPracticePath('phonetics', demoId, mode))
    }
})

test('缺失或非法来源只返回课程列表，不接受任意返回URL', (): void => {
    for (const source of [
        null,
        '',
        'unknown',
        '../settings',
        '/settings/',
        'https://example.com',
        'javascript:alert(1)',
        'phonetics?tab=other',
        '%2Fsettings%2F',
    ]) {
        assert.equal(resolvePracticeBackPath(source), '/awakening/')
    }
})

test('章节来源可选且必须与合法课程和演示匹配，区分同类型的第一和第四章', (): void => {
    const scopes = ['chapter-1', 'chapter-4'].map((chapterId) => {
        const path = buildPracticePath('phonetics', 'sentence-basic', 'translate', chapterId)
        const query = new URLSearchParams(path.split('?')[1])
        assert.equal(query.get('sourceChapter'), chapterId)
        assert.equal(query.has('chapterId'), false)
        return resolvePracticeDraftScope(
            query.get('sourceCourse'),
            query.get('sourceChapter'),
            'sentence-basic',
        )
    })
    assert.deepEqual(scopes, ['phonetics:chapter-1', 'phonetics:chapter-4'])
    for (const chapterId of ['', 'chapter-0', 'chapter-2', 'chapter-14', '../chapter-1']) {
        assert.throws(() => buildPracticePath('phonetics', 'sentence-basic', 'listen', chapterId))
    }
    assert.equal(
        resolvePracticeDraftScope('phonetics-continuation', 'chapter-4', 'sentence-basic'),
        'phonetics-continuation:chapter-4',
    )
})

test('章节草稿范围排除小模式，来源缺失、非法或与演示不匹配时独立回退', (): void => {
    const path = buildPracticePath('phonetics', 'sentence-basic', 'listen', 'chapter-4')
    const query = new URLSearchParams(path.split('?')[1])
    const changed = new URLSearchParams(
        practiceViewQuery(query.toString(), 'sentence-basic', 'oral'),
    )
    assert.equal(changed.get('mode'), 'oral')
    assert.equal(changed.get('sourceChapter'), 'chapter-4')
    assert.equal(
        resolvePracticeDraftScope(
            changed.get('sourceCourse'),
            changed.get('sourceChapter'),
            'sentence-basic',
        ),
        'phonetics:chapter-4',
    )
    for (const [course, chapter] of [
        [null, null],
        ['phonetics', null],
        [null, 'chapter-4'],
        ['', 'chapter-4'],
        ['unknown', 'chapter-4'],
        ['https://example.com', 'chapter-4'],
        ['phonetics', 'chapter-2'],
        ['phonetics', 'chapter-14'],
        ['phonetics', '../chapter-4'],
    ]) {
        assert.equal(
            resolvePracticeDraftScope(course, chapter, 'sentence-basic'),
            'demo:sentence-basic',
        )
    }
    assert.equal(
        resolvePracticeDraftScope('phonetics', 'chapter-4', 'word-basic'),
        'demo:word-basic',
    )
})
