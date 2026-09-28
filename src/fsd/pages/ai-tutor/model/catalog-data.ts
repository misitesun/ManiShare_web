export const mentors = [
    { id: 'sarah', name: 'Sarah', voice: '美式女音', accent: 'american' },
    { id: 'jason', name: 'Jason', voice: '美式女音', accent: 'american' },
    { id: 'ryan', name: 'Ryan', voice: '英式男音', accent: 'british' },
    {
        id: 'sarah-british',
        name: 'Sarah',
        voice: '英式男音',
        accent: 'british',
    },
] as const

export const scenes = [
    { id: 'daily', label: '日常闲聊' },
    { id: 'restaurant', label: '餐厅点餐' },
    { id: 'phone', label: '电话预约' },
    { id: 'taxi', label: '打车出行' },
    { id: 'photo', label: '旅游拍照' },
    { id: 'metro', label: '地铁购票' },
    { id: 'luggage', label: '行李丢失' },
    { id: 'directions', label: '旅行问路' },
] as const

export function getAiTutorChatParams(): { mentorId: string; sceneId: string }[] {
    return mentors.flatMap((mentor) =>
        scenes.map((scene) => ({ mentorId: mentor.id, sceneId: scene.id })),
    )
}
