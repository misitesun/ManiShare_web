export const feedbackOptions = [
    {
        id: 'course',
        label: '增加课程（可提供课程名称，如有文件可直接发给客服）',
    },
    { id: 'feature', label: '增加功能' },
    { id: 'improvement', label: '优化现有功能' },
    { id: 'other', label: '其他建议' },
] as const

export type FeedbackCategory = (typeof feedbackOptions)[number]['id']
