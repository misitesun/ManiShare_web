export type RoomGame = 'sentence' | 'word'
export type RoomMode = 'translation' | 'dictation' | 'puzzle'
export type RoomWriting = 'recall' | 'copy'
export type RoomBattle = 'human' | 'bot'
export type RoomDifficulty = 'hard' | 'easy'
export type RoomBackground = 'default' | 'lightning'
export type RoomAccess = 'free' | 'gold' | 'lifetime'

export interface RoomChapterOption {
    readonly id: string
    readonly title: string
    readonly translation: string
    readonly game: RoomGame
    readonly access: RoomAccess
    readonly cornerSource: string
    readonly iconSource: string
}

export interface RoomCourseOption {
    readonly id: string
    readonly title: string
    readonly imageSource: string
    readonly access: RoomAccess
    readonly chapters: readonly RoomChapterOption[]
}

export interface RoomDraft {
    readonly battle: RoomBattle
    readonly difficulty: RoomDifficulty
    readonly game: RoomGame
    readonly courseId: string
    readonly chapterIds: readonly string[]
    readonly mode: RoomMode
    readonly translationWriting: RoomWriting
    readonly dictationWriting: RoomWriting
    readonly background: RoomBackground
}

export interface RoomCreation {
    readonly battle: RoomBattle
    readonly difficulty: RoomDifficulty
    readonly game: RoomGame
    readonly course: RoomCourseOption
    readonly chapters: readonly RoomChapterOption[]
    readonly mode: RoomMode
    readonly writing: RoomWriting | null
    readonly background: RoomBackground
}

export type RoomDraftAction =
    | { type: 'battle'; value: RoomBattle }
    | { type: 'difficulty'; value: RoomDifficulty }
    | { type: 'game'; value: RoomGame }
    | { type: 'course'; value: string }
    | { type: 'chapter'; value: string; checked: boolean }
    | { type: 'mode'; value: RoomMode }
    | { type: 'writing'; mode: 'translation' | 'dictation'; value: RoomWriting }
    | { type: 'background'; value: RoomBackground }

export function availableChapters(
    courses: readonly RoomCourseOption[],
    draft: RoomDraft,
): readonly RoomChapterOption[] {
    return (
        courses
            .find(({ id }) => id === draft.courseId)
            ?.chapters.filter(({ game }) => game === draft.game) ?? []
    )
}

export function initialRoomDraft(courses: readonly RoomCourseOption[]): RoomDraft {
    const course = courses[0]
    return {
        battle: 'human',
        difficulty: 'hard',
        game: 'sentence',
        courseId: course?.id ?? '',
        chapterIds:
            course?.chapters
                .filter(({ game }) => game === 'sentence')
                .slice(0, 2)
                .map(({ id }) => id) ?? [],
        mode: 'translation',
        translationWriting: 'recall',
        dictationWriting: 'recall',
        background: 'default',
    }
}

export function updateRoomDraft(
    draft: RoomDraft,
    action: RoomDraftAction,
    courses: readonly RoomCourseOption[],
): RoomDraft {
    switch (action.type) {
        case 'battle':
            return { ...draft, battle: action.value }
        case 'difficulty':
            return { ...draft, difficulty: action.value }
        case 'background':
            return { ...draft, background: action.value }
        case 'game':
            return draft.game === action.value
                ? draft
                : {
                      ...draft,
                      game: action.value,
                      chapterIds: [],
                      mode:
                          action.value === 'word' && draft.mode === 'puzzle'
                              ? 'translation'
                              : draft.mode,
                  }
        case 'course':
            return draft.courseId === action.value || !courses.some(({ id }) => id === action.value)
                ? draft
                : { ...draft, courseId: action.value, chapterIds: [] }
        case 'chapter': {
            if (!availableChapters(courses, draft).some(({ id }) => id === action.value))
                return draft
            const ids = new Set(draft.chapterIds)
            if (action.checked) ids.add(action.value)
            else ids.delete(action.value)
            return { ...draft, chapterIds: [...ids] }
        }
        case 'mode':
            return action.value === 'puzzle' && draft.game === 'word'
                ? draft
                : { ...draft, mode: action.value }
        case 'writing':
            return action.mode === 'translation'
                ? { ...draft, translationWriting: action.value }
                : { ...draft, dictationWriting: action.value }
    }
}

export function resolveRoomCreation(
    courses: readonly RoomCourseOption[],
    draft: RoomDraft,
): RoomCreation | null {
    const course = courses.find(({ id }) => id === draft.courseId)
    const chapters = availableChapters(courses, draft).filter(({ id }) =>
        draft.chapterIds.includes(id),
    )
    if (
        course === undefined ||
        chapters.length === 0 ||
        chapters.length !== new Set(draft.chapterIds).size ||
        (draft.game === 'word' && draft.mode === 'puzzle')
    )
        return null
    return {
        battle: draft.battle,
        difficulty: draft.difficulty,
        game: draft.game,
        course,
        chapters,
        mode: draft.mode,
        writing:
            draft.mode === 'puzzle'
                ? null
                : draft.mode === 'translation'
                  ? draft.translationWriting
                  : draft.dictationWriting,
        background: draft.background,
    }
}
