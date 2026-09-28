export const routePaths = {
    home: '/',
    aiTutor: '/ai-tutor/',
    aiTutorChat: '/ai-tutor/mentors/[mentorId]/scenes/[sceneId]/',
    awakening: '/awakening/',
    awakeningCourse: '/awakening/courses/[courseId]/',
    login: '/login/',
    profile: '/profile/',
    knowledgeGaps: '/profile/knowledge-gaps/',
    notebook: '/profile/notes/',
    notebookCourse: '/profile/notes/courses/[coursePackageId]/',
    notebookChapter: '/profile/notes/courses/[coursePackageId]/chapters/[chapterId]/',
    learningProgress: '/profile/learning-progress/',
    favorites: '/profile/favorites/',
    works: '/profile/works/',
    foreignLanguageGuide: '/foreign-language-guide/',
    foreignLanguageCourse: '/foreign-language-guide/courses/[courseId]/',
    collaboration: '/collaboration/',
    vipMembership: '/vip/',
    leaderboard: '/leaderboard/',
    prizeCenter: '/prize-center/',
    promotionRevenue: '/promotion/revenue/',
    branchCompany: '/branch-company/',
    courseSearch: '/courses/search/',
} as const

function segment(value: string): string {
    if (!/^[a-zA-Z0-9_-]+$/.test(value)) throw new Error('Invalid route segment')
    return encodeURIComponent(value)
}
export function aiTutorChatPath(mentorId: string, sceneId: string): string {
    return `/ai-tutor/mentors/${segment(mentorId)}/scenes/${segment(sceneId)}/`
}
export function awakeningCoursePath(courseId: string): string {
    return `/awakening/courses/${segment(courseId)}/`
}
export function notebookCoursePath(coursePackageId: string): string {
    return `/profile/notes/courses/${segment(coursePackageId)}/`
}
export function notebookChapterPath(coursePackageId: string, chapterId: string): string {
    return `${notebookCoursePath(coursePackageId)}chapters/${segment(chapterId)}/`
}
export function foreignLanguageCoursePath(courseId: string): string {
    return `/foreign-language-guide/courses/${segment(courseId)}/`
}
