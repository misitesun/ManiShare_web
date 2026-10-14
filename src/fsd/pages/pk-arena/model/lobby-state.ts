import type { RoomCreation } from '../../../features/pk-create-room'

export type ArenaRanking = 'wins' | 'games' | 'rate'

export interface ArenaRoom {
    readonly id: string
    readonly number: string
    readonly host: string
    readonly online: boolean
    readonly createdAgo: string
    readonly course: string
    readonly chapter: string
    readonly mode: string
    readonly writing: string
    readonly imageSource?: string
    readonly configuration?: RoomCreation
}

export interface LobbyState {
    readonly query: string
    readonly ranking: ArenaRanking
    readonly banner: number
    readonly canceledRoomIds: readonly string[]
    readonly createdRoom: ArenaRoom | null
    readonly nextRoomNumber: number
}

export type LobbyAction =
    | { type: 'search'; query: string }
    | { type: 'ranking'; ranking: ArenaRanking }
    | { type: 'banner'; banner: number }
    | { type: 'slide'; direction: -1 | 1 }
    | { type: 'cancel'; roomId: string }
    | { type: 'create'; room: Omit<ArenaRoom, 'id' | 'number'>; previousRoomId: string }

export const arenaBannerCount = 3

export const initialLobbyState: LobbyState = {
    query: '',
    ranking: 'wins',
    banner: 1,
    canceledRoomIds: [],
    createdRoom: null,
    nextRoomNumber: 1297,
}

export function lobbyReducer(state: LobbyState, action: LobbyAction): LobbyState {
    switch (action.type) {
        case 'search':
            return { ...state, query: action.query }
        case 'ranking':
            return { ...state, ranking: action.ranking }
        case 'banner':
            return Number.isInteger(action.banner) &&
                action.banner >= 0 &&
                action.banner < arenaBannerCount
                ? { ...state, banner: action.banner }
                : state
        case 'slide':
            return {
                ...state,
                banner: (state.banner + action.direction + arenaBannerCount) % arenaBannerCount,
            }
        case 'cancel':
            return state.canceledRoomIds.includes(action.roomId)
                ? state
                : { ...state, canceledRoomIds: [...state.canceledRoomIds, action.roomId] }
        case 'create': {
            const number = String(state.nextRoomNumber)
            return {
                ...state,
                query: '',
                nextRoomNumber: state.nextRoomNumber + 1,
                createdRoom: { ...action.room, id: `local-room-${number}`, number },
                canceledRoomIds: state.canceledRoomIds.includes(action.previousRoomId)
                    ? state.canceledRoomIds
                    : [...state.canceledRoomIds, action.previousRoomId],
            }
        }
    }
}

export function visibleRooms(rooms: readonly ArenaRoom[], state: LobbyState): readonly ArenaRoom[] {
    const query = state.query.trim()
    const currentRooms = state.createdRoom === null ? rooms : [state.createdRoom, ...rooms]
    return currentRooms.filter(
        (room) => !state.canceledRoomIds.includes(room.id) && room.number.includes(query),
    )
}

export function isArenaRanking(value: string): value is ArenaRanking {
    return value === 'wins' || value === 'games' || value === 'rate'
}
