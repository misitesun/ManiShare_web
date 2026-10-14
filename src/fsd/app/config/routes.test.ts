import assert from 'node:assert/strict'
import test from 'node:test'
import { aiTutorChatPath, notebookChapterPath, routePaths } from './routes'
import { navigationItems } from './navigation'

test('首页改版的导航强调和中文名称沿用已有路径及语言契约', (): void => {
    const collaboration = navigationItems.find(
        (item) => item.labelKey === 'navigation.collaboration',
    )
    const revenue = navigationItems.find((item) => item.labelKey === 'navigation.revenue')
    assert.ok(collaboration && 'accent' in collaboration)
    assert.equal(collaboration.accent, 'brand')
    assert.equal(collaboration.to, routePaths.collaboration)
    assert.ok(revenue && 'label' in revenue)
    assert.equal(revenue.label, '我的推广奖励')
    assert.equal(revenue.to, routePaths.promotionRevenue)
})
test('route builders keep canonical paths and reject unsafe dynamic segments', (): void => {
    assert.equal(
        aiTutorChatPath('sarah-british', 'daily'),
        '/ai-tutor/mentors/sarah-british/scenes/daily/',
    )
    assert.equal(
        notebookChapterPath('course-1', 'chapter-8'),
        '/profile/notes/courses/course-1/chapters/chapter-8/',
    )
    for (const value of ['', '../secret', 'one/two', 'one?view=two', '%2f'])
        assert.throws(() => aiTutorChatPath(value, 'daily'))
    assert.equal(routePaths.settings, '/settings/')
    assert.equal(routePaths.pkArena, '/pk/')
    assert.equal(routePaths.pkMatching, '/pk/matching/')
    assert.equal(routePaths.pkLoading, '/pk/loading/')
    assert.equal(Object.keys(routePaths).length, 28)
})

test('风采大赛通过独立路由进入暂未开放页，保留排行榜后的导航顺序', (): void => {
    const competitionIndex = navigationItems.findIndex(
        (item) => item.labelKey === 'navigation.competition',
    )
    const competition = navigationItems[competitionIndex]
    assert.ok(competition && 'to' in competition && 'pageLabel' in competition)
    assert.equal(routePaths.competition, '/competition/')
    assert.equal(competition.to, routePaths.competition)
    assert.equal(competition.pageLabel, '风采大赛')
    assert.equal(competition.end, true)
    assert.equal(navigationItems[competitionIndex - 1]?.labelKey, 'navigation.leaderboard')
    assert.equal(navigationItems[competitionIndex + 1]?.labelKey, 'navigation.prizeCenter')
})
