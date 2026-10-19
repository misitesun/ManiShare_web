/** 自制技术验证片段，固定同源 URL；不是课程音视频或设置音色。 */
export const practiceTechnicalMediaSources = {
    audio: '/practice-demo/technical-tone.wav',
    video: '/practice-demo/technical-video.mp4',
} as const

export const practiceTechnicalMediaLabel = '技术验证片段，非课程音视频'

export function isPracticeTechnicalSample(source: string | undefined): boolean {
    return (
        source === practiceTechnicalMediaSources.audio ||
        source === practiceTechnicalMediaSources.video
    )
}
