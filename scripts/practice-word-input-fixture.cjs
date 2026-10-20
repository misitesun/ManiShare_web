const { createElement } = require('react')
const { createRoot } = require('react-dom/client')
const { flushSync } = require('react-dom')
const { PracticeWordSlotsInput } = require('../src/fsd/pages/practice/ui/PracticeWordSlotsInput')

// 无产品路由或全局入口；只由隔离smoke宿主加载，实际渲染公共组件，不模拟其DOM。
exports.mount = function mount(host) {
    const root = createRoot(host)
    const inputRef = { current: null }
    let configuration = { target: 'cat', value: '', phase: 'answering', blocked: false }
    const submissions = []
    function render() {
        flushSync(() =>
            root.render(
                createElement(PracticeWordSlotsInput, {
                    ...configuration,
                    inputRef,
                    onChange(value) {
                        configuration = { ...configuration, value }
                        render()
                    },
                    onSubmit(value) {
                        submissions.push(value)
                    },
                }),
            ),
        )
    }
    render()
    return {
        update(next) {
            configuration = { ...configuration, ...next }
            render()
        },
        submissions,
        unmount() {
            flushSync(() => root.unmount())
        },
    }
}
