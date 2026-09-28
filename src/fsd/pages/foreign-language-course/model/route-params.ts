export const supportedForeignLanguageCourseId = 'winter-speaking'
export function getForeignLanguageCourseParams(): { courseId: string }[] {
    return [{ courseId: supportedForeignLanguageCourseId }]
}
