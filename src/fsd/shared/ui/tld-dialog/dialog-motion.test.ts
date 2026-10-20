import assert from 'node:assert/strict'
import test from 'node:test'
import { getDialogExitPose } from './dialog-motion'

test('右侧面板从可见视口外进入，包含右侧留白和视觉视口偏移', (): void => {
    assert.deepEqual(getDialogExitPose('right', 1326, 1920), { x: 606, y: 0, scale: 1 })
    assert.deepEqual(getDialogExitPose('right', 12, 390), { x: 390, y: 0, scale: 1 })
    assert.deepEqual(getDialogExitPose('right', 44, 422), { x: 390, y: 0, scale: 1 })
})

test('居中弹窗保留原位移与缩放；尺寸变化按新的布局位置计算右侧终点', (): void => {
    assert.deepEqual(getDialogExitPose('center', 1326, 1920), { x: 0, y: 12, scale: 0.97 })
    assert.deepEqual(getDialogExitPose('right', 872, 1440), { x: 580, y: 0, scale: 1 })
})
