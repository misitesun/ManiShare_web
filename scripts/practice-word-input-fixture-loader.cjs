const { transpileModule, ScriptTarget, ModuleKind, JsxEmit } = require('typescript')

// 仅供隔离运行时夹具打包真实组件；产品仍由环境runner构建并单独进行类型检查。
module.exports = function transform(source) {
    return transpileModule(source, {
        fileName: this.resourcePath,
        compilerOptions: {
            target: ScriptTarget.ES2022,
            module: ModuleKind.ESNext,
            jsx: JsxEmit.ReactJSX,
            verbatimModuleSyntax: true,
        },
    }).outputText
}
