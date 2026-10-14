import assert from 'node:assert/strict'
import test from 'node:test'
import { initialLobbyState, isArenaRanking, lobbyReducer, visibleRooms } from './lobby-state'
import type { ArenaRoom } from './lobby-state'

const room: ArenaRoom = {
    id: 'my-room',
    number: '10',
    host: '示例房主',
    online: true,
    createdAgo: '1分钟前创建',
    course: '示例课程',
    chapter: '示例章节',
    mode: '听写模式',
    writing: '抄写',
}
const rooms = [room, { ...room, id: 'other-room', number: '1290', online: false }]

test('房号搜索忽略首尾空格，支持部分匹配、清空与无结果，不搜索昵称', (): void => {
    assert.equal(visibleRooms(rooms, initialLobbyState).length, 2)
    for (const query of [' 1290 ', '129'])
        assert.deepEqual(
            visibleRooms(rooms, lobbyReducer(initialLobbyState, { type: 'search', query })).map(
                ({ id }) => id,
            ),
            ['other-room'],
        )
    for (const query of ['999', '示例房主'])
        assert.deepEqual(
            visibleRooms(rooms, lobbyReducer(initialLobbyState, { type: 'search', query })),
            [],
        )
    assert.equal(
        visibleRooms(rooms, lobbyReducer(initialLobbyState, { type: 'search', query: '  ' }))
            .length,
        2,
    )
})

test('取消只移除目标房间；重复确认不重复记录，筛选和榜单状态保持', (): void => {
    const state = { ...initialLobbyState, query: '1', ranking: 'rate' as const, banner: 2 }
    const canceled = lobbyReducer(state, { type: 'cancel', roomId: room.id })
    assert.deepEqual(canceled, { ...state, canceledRoomIds: [room.id] })
    assert.deepEqual(
        visibleRooms(rooms, canceled).map(({ id }) => id),
        ['other-room'],
    )
    assert.equal(lobbyReducer(canceled, { type: 'cancel', roomId: room.id }), canceled)
    assert.deepEqual(initialLobbyState.canceledRoomIds, [])
})

test('三个轮播位置与三个排行榜选择独立，拒绝非法轮播位置', (): void => {
    const selected = lobbyReducer(initialLobbyState, { type: 'ranking', ranking: 'games' })
    for (let banner = 0; banner < 3; banner++) {
        const result = lobbyReducer(selected, { type: 'banner', banner })
        assert.equal(result.banner, banner)
        assert.equal(result.ranking, 'games')
    }
    for (const banner of [-1, 3, 0.5, Number.NaN])
        assert.equal(lobbyReducer(selected, { type: 'banner', banner }), selected)
    for (const value of ['wins', 'games', 'rate']) assert.equal(isArenaRanking(value), true)
    assert.equal(isArenaRanking('unknown'), false)
})

test('创建清搜索并替换自己的房间；他人房间、排行和轮播保持，取消后可重建', (): void => {
    const filtered = { ...initialLobbyState, query: '999', ranking: 'games' as const, banner: 0 }
    const first = lobbyReducer(filtered, {
        type: 'create',
        room: { ...room, course: '新课程' },
        previousRoomId: room.id,
    })
    assert.ok(first.createdRoom)
    assert.equal(first.query, '')
    assert.equal(first.createdRoom.number, '1297')
    assert.equal(first.ranking, 'games')
    assert.equal(first.banner, 0)
    assert.deepEqual(
        visibleRooms(rooms, first).map(({ number }) => number),
        ['1297', '1290'],
    )
    const second = lobbyReducer(first, {
        type: 'create',
        room: { ...room, course: '替换课程' },
        previousRoomId: first.createdRoom.id,
    })
    assert.ok(second.createdRoom)
    assert.equal(second.createdRoom.number, '1298')
    assert.deepEqual(
        visibleRooms(rooms, second).map(({ course }) => course),
        ['替换课程', room.course],
    )
    const canceled = lobbyReducer(second, { type: 'cancel', roomId: second.createdRoom.id })
    assert.deepEqual(
        visibleRooms(rooms, canceled).map(({ id }) => id),
        ['other-room'],
    )
    const recreated = lobbyReducer(canceled, {
        type: 'create',
        room,
        previousRoomId: second.createdRoom.id,
    })
    assert.deepEqual(
        visibleRooms(rooms, recreated).map(({ number }) => number),
        ['1299', '1290'],
    )
    assert.equal(initialLobbyState.createdRoom, null)
    assert.deepEqual(visibleRooms(rooms, initialLobbyState), rooms)
})

test('轮播左右切换在三个位置间首尾循环，保持搜索及榜单状态', (): void => {
    assert.equal(initialLobbyState.banner, 1)
    const initial = { ...initialLobbyState, query: '1290', ranking: 'rate' as const, banner: 0 }
    const previous = lobbyReducer(initial, { type: 'slide', direction: -1 })
    assert.equal(previous.banner, 2)
    assert.equal(previous.query, '1290')
    assert.equal(previous.ranking, 'rate')
    assert.equal(lobbyReducer(previous, { type: 'slide', direction: 1 }).banner, 0)
    assert.equal(lobbyReducer({ ...initial, banner: 2 }, { type: 'slide', direction: 1 }).banner, 0)
})
