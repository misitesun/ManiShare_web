import type { RoomCreation } from '../../../features/pk-create-room'
import type { ArenaRoom } from './lobby-state'

export function createdRoomSummary(configuration: RoomCreation): Omit<ArenaRoom, 'id' | 'number'> {
    return {
        host: '漫奇宝宝2908',
        online: true,
        createdAgo: '刚刚创建',
        course: configuration.course.title,
        imageSource: configuration.course.imageSource,
        chapter: `已选${configuration.chapters.length}章：${configuration.chapters.map(({ title }) => title).join('；')}`,
        mode:
            configuration.mode === 'translation'
                ? '中译英模式'
                : configuration.mode === 'dictation'
                  ? '听写模式'
                  : '选词拼块',
        writing:
            configuration.writing === null
                ? ''
                : configuration.writing === 'recall'
                  ? '默写'
                  : '抄写',
        configuration,
    }
}
