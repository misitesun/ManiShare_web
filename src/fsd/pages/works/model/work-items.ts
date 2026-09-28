import { coursePackages } from '../../../entities/course-package'

export type WorkCategoryTone = 'awakening' | 'blue' | 'cyan' | 'magenta' | 'stories' | 'wisdom'
export type WorkSharingStatus = 'shared' | 'unshared'

export interface WorkItem {
    readonly categoryLabel: string
    readonly categoryTone: WorkCategoryTone
    readonly id: string
    readonly imageSource: string
    readonly noteCount: number
    readonly sharingStatus: WorkSharingStatus
    readonly title: string
}

const designWorkItems: readonly WorkItem[] = [
    {
        ...coursePackages['english-learning-map'],
        categoryLabel: '言灵觉醒-18章节',
        categoryTone: 'awakening',
        noteCount: 4,
        sharingStatus: 'shared',
    },
    {
        ...coursePackages['ocean-vocabulary'],
        categoryLabel: '智慧殿堂-12章节',
        categoryTone: 'wisdom',
        noteCount: 2,
        sharingStatus: 'shared',
    },
    {
        ...coursePackages['writing-practice'],
        categoryLabel: '智慧殿堂-12章节',
        categoryTone: 'wisdom',
        noteCount: 6,
        sharingStatus: 'unshared',
    },
    {
        ...coursePackages['listening-practice'],
        categoryLabel: '漫说故事-20章节',
        categoryTone: 'stories',
        noteCount: 4,
        sharingStatus: 'unshared',
    },
    {
        ...coursePackages['daily-english'],
        categoryLabel: '漫说故事-20章节',
        categoryTone: 'cyan',
        noteCount: 9,
        sharingStatus: 'unshared',
    },
    {
        ...coursePackages['time-expression'],
        categoryLabel: '秒记万词-16章节',
        categoryTone: 'blue',
        noteCount: 6,
        sharingStatus: 'unshared',
    },
    {
        ...coursePackages['vocabulary-association'],
        categoryLabel: '入门特训-22章节',
        categoryTone: 'magenta',
        noteCount: 2,
        sharingStatus: 'shared',
    },
    {
        ...coursePackages['speaking-practice'],
        categoryLabel: '言灵觉醒-18章节',
        categoryTone: 'awakening',
        noteCount: 5,
        sharingStatus: 'unshared',
    },
]

function createContinuationWork(workItem: WorkItem): WorkItem {
    return { ...workItem, id: `${workItem.id}-continuation` }
}

export const workItemPages: readonly (readonly WorkItem[])[] = [
    designWorkItems,
    designWorkItems.map(createContinuationWork),
]
