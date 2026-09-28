import assert from 'node:assert/strict'
import test from 'node:test'
import { aiTutorChatPath, notebookChapterPath, routePaths } from './routes'
test('route builders keep canonical paths and reject unsafe dynamic segments', (): void => {
    assert.equal(
        aiTutorChatPath('sarah-british', 'daily'),
        '/ai-tutor/mentors/sarah-british/scenes/daily/',
    )
    assert.equal(
        notebookChapterPath('course-1', 'chapter-8'),
        '/profile/notes/courses/course-1/chapters/chapter-8/',
    )
    for (const value of ['', '../secret', 'one/two', 'one?view=two', '%2f'])
        assert.throws(() => aiTutorChatPath(value, 'daily'))
    assert.equal(Object.keys(routePaths).length, 23)
})
