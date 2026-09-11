import { coursePackages } from '../../../entities/course-package'
import type { CoursePackageSummary } from '../../../entities/course-package'

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

export interface NotebookCoursePackage extends CoursePackageSummary {
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
        ...coursePackages['english-learning-map'],
        noteCount: 4,
    },
    {
        ...coursePackages['ocean-vocabulary'],
        noteCount: 2,
    },
    {
        ...coursePackages['writing-practice'],
        noteCount: 6,
    },
    {
        ...coursePackages['listening-practice'],
        noteCount: 4,
    },
    {
        ...coursePackages['daily-english'],
        noteCount: 9,
    },
    {
        ...coursePackages['time-expression'],
        noteCount: 6,
    },
    {
        ...coursePackages['vocabulary-association'],
        noteCount: 2,
    },
    {
        ...coursePackages['speaking-practice'],
        noteCount: 5,
    },
    {
        ...coursePackages['alphabet-review'],
        noteCount: 4,
    },
    {
        ...coursePackages['sports-english'],
        noteCount: 1,
    },
    {
        ...coursePackages['travel-english'],
        noteCount: 2,
    },
    {
        ...coursePackages['food-english'],
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
