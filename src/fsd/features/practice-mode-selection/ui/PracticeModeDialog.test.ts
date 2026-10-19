import assert from 'node:assert/strict'
import test from 'node:test'
import { Children, createElement, isValidElement } from 'react'
import type { ReactElement, ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { practiceModeSelections } from '../model/practice-mode-selections'
import type {
    PracticeSelectionMode,
    SelectablePracticeFamily,
} from '../model/practice-mode-selections'
import { PracticeModeDialog, PracticeModeDialogContent } from './PracticeModeDialog'
import { getPracticeModeDialogFrame } from '../model/practice-mode-selection-layout'

interface SelectionElementProps {
    readonly children?: ReactNode
    readonly onClick?: () => void
    readonly 'data-practice-mode-option'?: string
    readonly 'data-practice-mode-start'?: boolean
    readonly 'data-practice-mode-cancel-label'?: boolean
}

const families: readonly SelectablePracticeFamily[] = [
    'word',
    'sentence',
    'audio',
    'video',
    'guess',
    'picture',
]

function ignore(): void {}

function findElement(
    node: ReactNode,
    predicate: (element: ReactElement<SelectionElementProps>) => boolean,
): ReactElement<SelectionElementProps> | null {
    if (!isValidElement<SelectionElementProps>(node)) return null
    if (predicate(node)) return node
    for (const child of Children.toArray(node.props.children)) {
        const found = findElement(child, predicate)
        if (found) return found
    }
    return null
}

test('六族逐项预览只有一个选中态且大图、标题随草稿变化，不触发开始', (): void => {
    let starts = 0
    for (const family of families) {
        const config = practiceModeSelections[family]
        for (const option of config.options) {
            const markup = renderToStaticMarkup(
                createElement(PracticeModeDialogContent, {
                    family,
                    selectedMode: option.id,
                    onSelect: ignore,
                    onCancel: ignore,
                    onStart: (): void => {
                        starts += 1
                    },
                }),
            )
            assert.equal(markup.match(/aria-pressed="true"/g)?.length, 1)
            assert.equal(markup.match(/data-practice-mode-option=/g)?.length, config.options.length)
            const preview = markup.match(/<img\b[^>]*data-practice-mode-preview[^>]*>/)?.[0]
            assert.ok(preview?.includes(`src="${option.preview}"`))
            assert.ok(markup.includes(`data-practice-mode-selected="${option.id}"`))
            assert.equal(markup.includes('data-word-mode-selector='), family === 'word')
        }
    }
    assert.equal(starts, 0)
})

test('点击模式只提交待选值，开始和取消互不触发；跨族非法初选显示默认项', (): void => {
    for (const family of families) {
        const config = practiceModeSelections[family]
        let selected: PracticeSelectionMode = config.defaultMode
        let starts = 0
        let cancels = 0
        const tree = PracticeModeDialogContent({
            family,
            selectedMode: selected,
            onSelect: (mode): void => {
                selected = mode
            },
            onStart: (): void => {
                starts += 1
            },
            onCancel: (): void => {
                cancels += 1
            },
        })
        const lastOption = config.options.at(-1)
        assert.ok(lastOption)
        const option = findElement(
            tree,
            (element) => element.props['data-practice-mode-option'] === lastOption.id,
        )
        assert.ok(option?.props.onClick)
        option.props.onClick()
        assert.equal(selected, lastOption.id)
        assert.equal(starts, 0)
        assert.equal(cancels, 0)
        const start = findElement(
            tree,
            (element) => element.props['data-practice-mode-start'] === true,
        )
        assert.ok(start?.props.onClick)
        start.props.onClick()
        assert.equal(starts, 1)
        const cancel = findElement(
            tree,
            (element) => element.props['data-practice-mode-cancel-label'] === true,
        )
        assert.ok(cancel?.props.onClick)
        cancel.props.onClick()
        assert.equal(cancels, 1)
        assert.equal(starts, 1)
    }
    const invalid = renderToStaticMarkup(
        createElement(PracticeModeDialogContent, {
            family: 'picture',
            selectedMode: 'pronounce',
            onSelect: ignore,
            onCancel: ignore,
            onStart: ignore,
        }),
    )
    assert.ok(invalid.includes('data-practice-mode-selected="listen"'))
})

test('每个族开启与关闭的预渲染均延迟Portal，不读取浏览器或自动开始', (): void => {
    let callbacks = 0
    for (const family of families)
        for (const open of [false, true]) {
            assert.equal(
                renderToStaticMarkup(
                    createElement(PracticeModeDialog, {
                        family,
                        open,
                        initialMode: 'pronounce',
                        onOpenChange: (): void => {
                            callbacks += 1
                        },
                        onStart: (): void => {
                            callbacks += 1
                        },
                    }),
                ),
                '',
            )
        }
    assert.equal(callbacks, 0)
})

test('原稿坐标转换保留半像素与非居中的看图位置，不统一四舍五入', (): void => {
    assert.deepEqual(getPracticeModeDialogFrame({ width: 819, height: 547, x: 550, y: 266 }), {
        width: 819,
        offsetX: -0.5,
        offsetY: -0.5,
    })
    assert.deepEqual(getPracticeModeDialogFrame({ width: 819, height: 621, x: 550, y: 229 }), {
        width: 819,
        offsetX: -0.5,
        offsetY: -0.5,
    })
    assert.deepEqual(getPracticeModeDialogFrame({ width: 819, height: 547, x: 551, y: 267 }), {
        width: 819,
        offsetX: 0.5,
        offsetY: 0.5,
    })
    assert.deepEqual(getPracticeModeDialogFrame({ width: 820, height: 536, x: 551, y: 230 }), {
        width: 820,
        offsetX: 1,
        offsetY: -42,
    })
})
