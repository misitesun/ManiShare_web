export interface NotebookRecordLine {
    readonly id: string
    readonly text: string
}

export interface NotebookRecord {
    readonly id: string
    readonly lines: readonly NotebookRecordLine[]
}

export interface NotebookGroup {
    readonly id: string
    readonly sentence: string
    readonly translation: string
    readonly records: readonly NotebookRecord[]
    readonly isMuted?: boolean
}

export interface NotebookCoursePackage {
    readonly id: string
    readonly coursePackageId: string
    readonly noteCount: number
}

function createRecord(id: string): NotebookRecord {
    return {
        id,
        lines: [
            { id: `${id}-line-1`, text: '翻译：西游记第一章：猴子' },
            { id: `${id}-line-2`, text: '翻译：西游记第一章：猴子' },
        ],
    }
}

const designNoteGroups: readonly NotebookGroup[] = [
    {
        id: 'journey-west-1',
        sentence: 'Journey to the West Chapter 1: The Monkey',
        translation: '西游记第一章：猴子',
        records: [createRecord('journey-west-1-record-1'), createRecord('journey-west-1-record-2')],
        isMuted: true,
    },
    {
        id: 'journey-west-2',
        sentence: 'Journey to the West Chapter 1: The Monkey',
        translation: '西游记第一章：猴子',
        records: [
            createRecord('journey-west-2-record-1'),
            createRecord('journey-west-2-record-2'),
            createRecord('journey-west-2-record-3'),
        ],
    },
    {
        id: 'journey-west-3',
        sentence: 'Journey to the West Chapter 1: The Monkey',
        translation: '西游记第一章：猴子',
        records: [createRecord('journey-west-3-record-1')],
    },
]

function createContinuationGroup(group: NotebookGroup): NotebookGroup {
    return {
        ...group,
        id: `${group.id}-continuation`,
        records: group.records.map((record) => ({
            ...record,
            id: `${record.id}-continuation`,
            lines: record.lines.map((line) => ({
                ...line,
                id: `${line.id}-continuation`,
            })),
        })),
    }
}

export const notebookGroupPages: readonly (readonly NotebookGroup[])[] = [
    designNoteGroups,
    designNoteGroups.map(createContinuationGroup),
]

const designCoursePackages: readonly NotebookCoursePackage[] = [
    {
        id: 'english-learning-map',
        coursePackageId: 'english-learning-map',
        noteCount: 4,
    },
    {
        id: 'ocean-vocabulary',
        coursePackageId: 'ocean-vocabulary',
        noteCount: 2,
    },
    {
        id: 'writing-practice',
        coursePackageId: 'writing-practice',
        noteCount: 6,
    },
    {
        id: 'listening-practice',
        coursePackageId: 'listening-practice',
        noteCount: 4,
    },
    {
        id: 'daily-english',
        coursePackageId: 'daily-english',
        noteCount: 9,
    },
    {
        id: 'time-expression',
        coursePackageId: 'time-expression',
        noteCount: 6,
    },
    {
        id: 'vocabulary-association',
        coursePackageId: 'vocabulary-association',
        noteCount: 2,
    },
    {
        id: 'speaking-practice',
        coursePackageId: 'speaking-practice',
        noteCount: 5,
    },
    {
        id: 'alphabet-review',
        coursePackageId: 'alphabet-review',
        noteCount: 4,
    },
    {
        id: 'sports-english',
        coursePackageId: 'sports-english',
        noteCount: 1,
    },
    {
        id: 'travel-english',
        coursePackageId: 'travel-english',
        noteCount: 2,
    },
    {
        id: 'food-english',
        coursePackageId: 'food-english',
        noteCount: 3,
    },
]

function createContinuationPackage(coursePackage: NotebookCoursePackage): NotebookCoursePackage {
    return {
        ...coursePackage,
        id: `${coursePackage.id}-continuation`,
    }
}

export const notebookCoursePackagePages: readonly (readonly NotebookCoursePackage[])[] = [
    designCoursePackages,
    designCoursePackages.map(createContinuationPackage),
]

export function findNotebookCourse(
    coursePackageId: string | undefined,
): NotebookCoursePackage | undefined {
    return notebookCoursePackagePages.flat().find((course) => course.id === coursePackageId)
}

export function createCourseNoteGroups(course: NotebookCoursePackage): readonly NotebookGroup[] {
    return Array.from({ length: course.noteCount }, (_, index) => {
        const id = `${course.id}-group-${index + 1}`
        return {
            id,
            sentence: 'Journey to the West Chapter 1: The Monkey',
            translation: '西游记第一章：猴子',
            isMuted: index === 0,
            records:
                index === 0
                    ? [createRecord(`${id}-record-1`), createRecord(`${id}-record-2`)]
                    : [createRecord(`${id}-record-1`)],
        }
    })
}
