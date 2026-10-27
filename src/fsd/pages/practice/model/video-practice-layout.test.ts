import assert from 'node:assert/strict'
import test from 'node:test'
import { getVideoPracticeFrameLayout } from './video-practice-layout'

test('1280px窗口展开看图侧栏后，底栏不越过滚动视口覆盖侧栏', () => {
    const layout = getVideoPracticeFrameLayout({
        frameWidth: 1220,
        dockWidth: 1280,
        inset: 30,
        sidebarSpace: 470,
        edgeScroll: true,
    })
    assert.equal(layout.scrollViewportWidth, 780)
    assert.deepEqual(layout.controls, { width: 780, marginLeft: 0 })
    // 侧栏左缘803px，保留23px间距；原底栏810px会覆盖侧栏。
    assert.equal(803 - layout.controls.width, 23)
})

test('关闭侧栏或切入窄屏后，滚动区域恢复全宽且底栏保持居中限宽', () => {
    const desktop = getVideoPracticeFrameLayout({
        frameWidth: 1860,
        dockWidth: 1920,
        inset: 30,
        sidebarSpace: 0,
        edgeScroll: true,
    })
    assert.equal(desktop.scrollViewportWidth, 1920)
    assert.deepEqual(desktop.controls, { width: 1390, marginLeft: 265 })
    const compact = getVideoPracticeFrameLayout({
        frameWidth: 366,
        dockWidth: 390,
        inset: 12,
        sidebarSpace: 0,
        edgeScroll: true,
    })
    assert.equal(compact.scrollViewportWidth, 390)
    assert.deepEqual(compact.controls, { width: 390, marginLeft: 0 })
})

test('超宽屏展开侧栏时仍保留1390px内容上限', () => {
    const layout = getVideoPracticeFrameLayout({
        frameWidth: 2500,
        dockWidth: 2560,
        inset: 30,
        sidebarSpace: 470,
        edgeScroll: true,
    })
    assert.equal(layout.scrollViewportWidth, 2060)
    assert.deepEqual(layout.controls, { width: 1390, marginLeft: 335 })
})

test('原视频布局继续按题面和底栏各自的容器宽度收缩', () => {
    const layout = getVideoPracticeFrameLayout({
        frameWidth: 1220,
        dockWidth: 1280,
        inset: 30,
        sidebarSpace: 470,
        edgeScroll: false,
    })
    assert.deepEqual(layout.stage, { width: 750, marginLeft: 0 })
    assert.deepEqual(layout.controls, { width: 810, marginLeft: 0 })
})
