import { findNotebookCourse, notebookGroupPages } from './notebook-items'
import type { NotebookGroup } from './notebook-items'

export interface NotebookChapter {
    readonly id: string
    readonly coursePackageId: string
    readonly title: string
    readonly groups: readonly NotebookGroup[]
}

const chapterTitles = [
    '第一章',
    '第二章',
    '第三章',
    '第四章',
    '第五章',
    '第六章',
    '第七章',
    '第八章',
]

export function getNotebookChapters(
    coursePackageId: string | undefined,
): readonly NotebookChapter[] {
    const course = findNotebookCourse(coursePackageId)
    if (course === undefined) return []

    return chapterTitles.map((title, index) => {
        const id = `chapter-${index + 1}`
        const prefix = `${course.id}-${id}`
        const groups = (notebookGroupPages[0] ?? []).slice(0, 2).map((group) => ({
            ...group,
            id: `${prefix}-${group.id}`,
            records: group.records.map((record) => ({
                ...record,
                id: `${prefix}-${record.id}`,
                lines: record.lines.map((line) => ({
                    ...line,
                    id: `${prefix}-${line.id}`,
                })),
            })),
        }))

        return { id, coursePackageId: course.id, title, groups }
    })
}

export function findNotebookChapter(
    coursePackageId: string | undefined,
    chapterId: string | undefined,
): NotebookChapter | undefined {
    return getNotebookChapters(coursePackageId).find((chapter) => chapter.id === chapterId)
}
