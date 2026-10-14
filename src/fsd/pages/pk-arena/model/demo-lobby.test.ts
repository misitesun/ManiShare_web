import assert from 'node:assert/strict'
import test from 'node:test'
import { arenaRankings, demoRankEntries, demoRooms, ownedRoom, rankValue } from './demo-lobby'
import { initialLobbyState, lobbyReducer, visibleRooms } from './lobby-state'

test('演示房间标识与房号唯一；我的创建与大厅引用同一房间，取消两处同步', (): void => {
    assert.equal(demoRooms.length, 8)
    assert.equal(new Set(demoRooms.map(({ id }) => id)).size, 8)
    assert.equal(new Set(demoRooms.map(({ number }) => number)).size, 8)
    assert.ok(demoRooms.includes(ownedRoom))
    const canceled = lobbyReducer(initialLobbyState, { type: 'cancel', roomId: ownedRoom.id })
    assert.equal(visibleRooms(demoRooms, canceled).length, 7)
    assert.equal(
        visibleRooms(demoRooms, canceled).some(({ id }) => id === ownedRoom.id),
        false,
    )
})

test('三个榜单读取各自示例指标，场数与百分比单位不混用，十二个条目标识稳定', (): void => {
    assert.deepEqual(
        arenaRankings.map(({ label }) => label),
        ['胜利榜', '场数榜', '胜率榜'],
    )
    assert.equal(demoRankEntries.length, 12)
    assert.equal(new Set(demoRankEntries.map(({ id }) => id)).size, 12)
    const first = demoRankEntries[0]
    assert.ok(first)
    assert.equal(rankValue(first, 'wins'), '30场')
    assert.equal(rankValue(first, 'games'), '50场')
    assert.equal(rankValue(first, 'rate'), '96%')
})
