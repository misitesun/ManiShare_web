import {
    getAwakeningCourseParams,
    isAwakeningPracticeSource,
    getNextAwakeningPracticeChapter,
} from '../../pages/awakening'
import { resolvePracticeView } from '../../pages/practice'
import type { PracticeExitDestination } from '../../pages/practice'
import { awakeningCoursePath, routePaths } from '../config/routes'

function isSupportedCourse(courseId: string): boolean {
    return getAwakeningCourseParams().some((item) => item.courseId === courseId)
}

/** 仅记录本地演示的来源，不把来源课程当作已接入的题库。 */
export function buildPracticePath(
    courseId: string,
    demoId: string,
    mode: string,
    sourceChapter?: string,
): string {
    if (!isSupportedCourse(courseId)) throw new Error('Unsupported practice source course')
    const resolved = resolvePracticeView(demoId, mode)
    if (resolved.kind !== 'demo') throw new Error('Unsupported practice demo selection')
    const query = new URLSearchParams({
        demo: resolved.view.demo.id,
        mode: resolved.view.mode,
        sourceCourse: courseId,
    })
    if (sourceChapter !== undefined) {
        if (!isAwakeningPracticeSource(courseId, sourceChapter, resolved.view.demo.id))
            throw new Error('Unsupported practice source chapter')
        query.set('sourceChapter', sourceChapter)
    }
    return routePaths.practice + '?' + query.toString()
}

/** 章节共用草稿仅绑定白名单预览来源；旧链接和非法来源保持独立演示范围。 */
export function resolvePracticeDraftScope(
    sourceCourse: string | null,
    sourceChapter: string | null,
    demoId: string,
): string {
    return sourceCourse !== null &&
        sourceChapter !== null &&
        isAwakeningPracticeSource(sourceCourse, sourceChapter, demoId)
        ? `${sourceCourse}:${sourceChapter}`
        : `demo:${demoId}`
}

/** 独立演示、非法来源或课程末章均不提供自动下节入口。 */
export function resolvePracticeNextChapterPath(search: string): string | null {
    const query = new URLSearchParams(search)
    const courseId = query.get('sourceCourse')
    const chapterId = query.get('sourceChapter')
    const current = resolvePracticeView(query.get('demo'), query.get('mode'))
    if (courseId === null || chapterId === null || current.kind !== 'demo') return null
    const next = getNextAwakeningPracticeChapter(courseId, chapterId, current.view.demo.id)
    if (next === null || resolvePracticeView(next.demoId, next.defaultMode).kind !== 'demo')
        return null
    query.set('demo', next.demoId)
    query.set('mode', next.defaultMode)
    query.set('sourceChapter', next.chapterId)
    return routePaths.practice + '?' + query.toString()
}

export function resolvePracticeBackPath(sourceCourse: string | null): string {
    return sourceCourse !== null && isSupportedCourse(sourceCourse)
        ? awakeningCoursePath(sourceCourse)
        : routePaths.awakening
}

export function resolvePracticeExitPath(
    destination: PracticeExitDestination,
    sourceCourse: string | null,
): string {
    return destination === 'home' ? routePaths.home : resolvePracticeBackPath(sourceCourse)
}
