export type KnowledgeGapAudioIcon = 'default' | 'wide'

export interface KnowledgeGapItem {
    readonly id: string
    readonly english: string
    readonly chinese: string
    readonly createdAt: string
    readonly mistakeCount: number
    readonly progress: number
    readonly progressMax: number
    readonly audioIcon: KnowledgeGapAudioIcon
}

export interface KnowledgeGapPage {
    readonly id: string
    readonly items: readonly KnowledgeGapItem[]
}

const designItems: readonly KnowledgeGapItem[] = [
    {
        id: 'pens-1',
        english: 'Two pens are in my bag.',
        chinese: '两支钢笔在我的包里。',
        createdAt: '2026-08-31 13:01:23',
        mistakeCount: 1,
        progress: 1,
        progressMax: 3,
        audioIcon: 'default',
    },
    {
        id: 'shoes-1',
        english: 'Put your shoes by the door.',
        chinese: '把你的鞋子放在门边。',
        createdAt: '2026-08-31 13:01:23',
        mistakeCount: 1,
        progress: 0,
        progressMax: 3,
        audioIcon: 'default',
    },
    {
        id: 'school-1',
        english: 'I had a great time at school today.',
        chinese: '我今天在学校玩的很开心。',
        createdAt: '2026-08-31 13:01:23',
        mistakeCount: 2,
        progress: 2,
        progressMax: 3,
        audioIcon: 'default',
    },
    {
        id: 'vegetables-1',
        english: 'Eat your vegetables.',
        chinese: '吃你的蔬菜。',
        createdAt: '2026-08-31 13:01:23',
        mistakeCount: 1,
        progress: 2,
        progressMax: 3,
        audioIcon: 'default',
    },
    {
        id: 'lunch-1',
        english: 'I have vegetables for lunch.',
        chinese: '我午餐吃蔬菜。',
        createdAt: '2026-08-31 13:01:23',
        mistakeCount: 2,
        progress: 3,
        progressMax: 3,
        audioIcon: 'wide',
    },
    {
        id: 'restaurant-1',
        english: 'Go to the restaurant.',
        chinese: '去餐厅。',
        createdAt: '2026-08-31 13:01:23',
        mistakeCount: 2,
        progress: 2,
        progressMax: 3,
        audioIcon: 'wide',
    },
    {
        id: 'pens-2',
        english: 'Two pens are in my bag.',
        chinese: '两支钢笔在我的包里。',
        createdAt: '2026-08-31 13:01:23',
        mistakeCount: 1,
        progress: 1,
        progressMax: 3,
        audioIcon: 'default',
    },
    {
        id: 'shoes-2',
        english: 'Put your shoes by the door.',
        chinese: '把你的鞋子放在门边。',
        createdAt: '2026-08-31 13:01:23',
        mistakeCount: 1,
        progress: 0,
        progressMax: 3,
        audioIcon: 'default',
    },
    {
        id: 'school-2',
        english: 'I had a great time at school today.',
        chinese: '我今天在学校玩的很开心。',
        createdAt: '2026-08-31 13:01:23',
        mistakeCount: 2,
        progress: 2,
        progressMax: 3,
        audioIcon: 'default',
    },
    {
        id: 'vegetables-2',
        english: 'Eat your vegetables.',
        chinese: '吃你的蔬菜。',
        createdAt: '2026-08-31 13:01:23',
        mistakeCount: 1,
        progress: 2,
        progressMax: 3,
        audioIcon: 'default',
    },
]

const continuationItems = designItems.map((item) => ({
    ...item,
    id: `${item.id}-continuation`,
}))

export const knowledgeGapPages: readonly KnowledgeGapPage[] = [
    { id: 'page-1', items: designItems },
    { id: 'page-2', items: continuationItems },
]
