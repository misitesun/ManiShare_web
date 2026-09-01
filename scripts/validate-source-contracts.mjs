import { builtinModules } from 'node:module'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, extname, relative, resolve, sep } from 'node:path'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'

const businessLayers = new Set(['pages', 'widgets', 'features', 'entities'])
const layerRanks = new Map([
  ['shared', 0],
  ['entities', 1],
  ['features', 2],
  ['widgets', 3],
  ['pages', 4],
  ['app', 5],
])
const sharedPublicSegments = new Set(['api', 'config', 'constants', 'i18n', 'notification', 'theme'])
const sharedCapabilitySegments = new Set(['lib', 'ui'])
const rendererExtensions = new Set(['.ts', '.tsx'])
const sourceExtensions = ['.ts', '.tsx']
const nodeModules = new Set([...builtinModules, ...builtinModules.map((moduleName) => `node:${moduleName}`)])
const tailwindPaletteNames = new Set([
  'amber',
  'black',
  'blue',
  'cyan',
  'emerald',
  'fuchsia',
  'gray',
  'green',
  'indigo',
  'lime',
  'neutral',
  'orange',
  'pink',
  'purple',
  'red',
  'rose',
  'sky',
  'slate',
  'stone',
  'teal',
  'violet',
  'white',
  'yellow',
  'zinc',
])
const colorUtilities = new Set([
  'accent',
  'bg',
  'border',
  'caret',
  'decoration',
  'fill',
  'from',
  'outline',
  'ring',
  'shadow',
  'stroke',
  'text',
  'to',
  'via',
])
const rawColorPattern = /#[\da-f]{3,8}\b|(?:rgb|hsl)a?\s*\(/i
const namedColorPattern = /\b(?:black|blue|cyan|gray|green|orange|pink|purple|red|transparent|white|yellow)\b/i

function toPosixPath(filePath) {
  return filePath.split(sep).join('/')
}

function walkFiles(directoryPath) {
  if (!existsSync(directoryPath)) return []

  const files = []
  for (const entry of readdirSync(directoryPath, { withFileTypes: true })) {
    const entryPath = resolve(directoryPath, entry.name)
    if (entry.isDirectory()) files.push(...walkFiles(entryPath))
    if (entry.isFile()) files.push(entryPath)
  }
  return files
}

function getSourceContext(filePath, sourceRoot) {
  const sourceRelativePath = toPosixPath(relative(sourceRoot, filePath))
  const segments = sourceRelativePath.split('/')
  const firstSegment = segments[0]

  if (firstSegment === 'App.tsx' || firstSegment === 'main.tsx') {
    return { layer: 'app', ownerRoot: null }
  }

  if (!layerRanks.has(firstSegment)) return { layer: null, ownerRoot: null }

  if (businessLayers.has(firstSegment) && segments[1] !== undefined) {
    return { layer: firstSegment, ownerRoot: resolve(sourceRoot, firstSegment, segments[1]) }
  }

  if (firstSegment === 'shared' && segments[1] !== undefined) {
    if (sharedPublicSegments.has(segments[1])) {
      return { layer: firstSegment, ownerRoot: resolve(sourceRoot, firstSegment, segments[1]) }
    }
    if (sharedCapabilitySegments.has(segments[1]) && segments[2] !== undefined) {
      return { layer: firstSegment, ownerRoot: resolve(sourceRoot, firstSegment, segments[1], segments[2]) }
    }
  }

  return { layer: firstSegment, ownerRoot: null }
}

function resolveLocalImport(sourceFilePath, moduleSpecifier) {
  if (!moduleSpecifier.startsWith('.')) return null

  const unresolvedPath = resolve(dirname(sourceFilePath), moduleSpecifier)
  const candidates = []
  if (extname(unresolvedPath) === '') {
    for (const extension of sourceExtensions) candidates.push(`${unresolvedPath}${extension}`)
    for (const extension of sourceExtensions) candidates.push(resolve(unresolvedPath, `index${extension}`))
  } else {
    candidates.push(unresolvedPath)
  }
  if (unresolvedPath.endsWith('.js')) {
    candidates.push(unresolvedPath.slice(0, -3) + '.ts', unresolvedPath.slice(0, -3) + '.tsx')
  }

  return candidates.find((candidate) => existsSync(candidate) && statSync(candidate).isFile()) ?? unresolvedPath
}

function isPublicRootEntry(targetFilePath, ownerRoot) {
  return dirname(targetFilePath) === ownerRoot && /^index\.tsx?$/.test(targetFilePath.slice(ownerRoot.length + 1))
}

function getNodeLocation(sourceFile, node) {
  const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile))
  return `${toPosixPath(sourceFile.fileName)}:${line + 1}:${character + 1}`
}

function collectConstInitializers(sourceFile) {
  const declarations = new Map()

  function findScope(node) {
    let current = node.parent
    while (current !== undefined) {
      if (ts.isBlock(current) || ts.isCaseBlock(current) || ts.isModuleBlock(current) || ts.isSourceFile(current)) return current
      current = current.parent
    }
    return sourceFile
  }

  function visit(node) {
    if (
      ts.isVariableDeclaration(node)
      && ts.isIdentifier(node.name)
      && node.initializer !== undefined
      && ts.isVariableDeclarationList(node.parent)
      && (node.parent.flags & ts.NodeFlags.Const) !== 0
    ) {
      const existing = declarations.get(node.name.text) ?? []
      existing.push({ initializer: node.initializer, scope: findScope(node) })
      declarations.set(node.name.text, existing)
    }
    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return declarations
}

function findVisibleConstInitializer(identifier, constInitializers) {
  const scopes = []
  let current = identifier.parent
  while (current !== undefined) {
    if (ts.isBlock(current) || ts.isCaseBlock(current) || ts.isModuleBlock(current) || ts.isSourceFile(current)) scopes.push(current)
    current = current.parent
  }

  const candidates = (constInitializers.get(identifier.text) ?? [])
    .filter((declaration) => declaration.initializer.pos < identifier.pos && scopes.includes(declaration.scope))
    .sort((left, right) => {
      const scopeDifference = scopes.indexOf(left.scope) - scopes.indexOf(right.scope)
      return scopeDifference === 0 ? right.initializer.pos - left.initializer.pos : scopeDifference
    })

  return candidates[0]?.initializer ?? null
}

function analyzeClassExpression(node, constInitializers, seenInitializers = new Set()) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return { isLiteral: true, values: [node.text] }
  }
  if (ts.isTemplateExpression(node)) return { isLiteral: false, values: [] }
  if (ts.isParenthesizedExpression(node) || ts.isAsExpression(node) || ts.isSatisfiesExpression(node)) {
    return analyzeClassExpression(node.expression, constInitializers, seenInitializers)
  }
  if (ts.isConditionalExpression(node)) {
    const whenTrue = analyzeClassExpression(node.whenTrue, constInitializers, seenInitializers)
    const whenFalse = analyzeClassExpression(node.whenFalse, constInitializers, seenInitializers)
    return { isLiteral: whenTrue.isLiteral && whenFalse.isLiteral, values: [...whenTrue.values, ...whenFalse.values] }
  }
  if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
    if (!ts.isBlock(node.body)) return analyzeClassExpression(node.body, constInitializers, seenInitializers)
    const returnExpressions = []
    function collectReturns(child) {
      if (ts.isReturnStatement(child) && child.expression !== undefined) returnExpressions.push(child.expression)
      ts.forEachChild(child, collectReturns)
    }
    collectReturns(node.body)
    const results = returnExpressions.map((expression) => analyzeClassExpression(expression, constInitializers, seenInitializers))
    return {
      isLiteral: results.length > 0 && results.every((result) => result.isLiteral),
      values: results.flatMap((result) => result.values),
    }
  }
  if (ts.isIdentifier(node)) {
    const initializer = findVisibleConstInitializer(node, constInitializers)
    if (initializer === null || seenInitializers.has(initializer.pos)) return { isLiteral: false, values: [] }
    const nextSeenInitializers = new Set(seenInitializers)
    nextSeenInitializers.add(initializer.pos)
    return analyzeClassExpression(initializer, constInitializers, nextSeenInitializers)
  }
  if (node.kind === ts.SyntaxKind.NullKeyword) return { isLiteral: true, values: [] }
  if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken) {
    return analyzeClassExpression(node.right, constInitializers, seenInitializers)
  }

  return { isLiteral: false, values: [] }
}

function findTailwindColorViolation(classValue) {
  for (const token of classValue.split(/\s+/).filter(Boolean)) {
    if (token.includes('dark:') || token.includes('light:')) return `theme variant "${token}"`
    if (/\[(?:#|(?:rgb|hsl)a?\s*\()/i.test(token)) return `raw arbitrary color "${token}"`

    const utility = token.slice(token.lastIndexOf(':') + 1)
    const parts = utility.split('-')
    const utilityName = parts[0]
    const paletteName = parts[1]?.split('/')[0]
    if (utilityName !== undefined && paletteName !== undefined && colorUtilities.has(utilityName) && tailwindPaletteNames.has(paletteName)) {
      return `raw Tailwind palette color "${token}"`
    }
  }
  return null
}

function validateImports(sourceFile, sourceRoot, errors) {
  const sourceContext = getSourceContext(sourceFile.fileName, sourceRoot)
  const isTestFile = /\.test\.tsx?$/.test(sourceFile.fileName)

  function inspectModuleSpecifier(moduleSpecifierNode) {
    const moduleSpecifier = moduleSpecifierNode.text
    const location = getNodeLocation(sourceFile, moduleSpecifierNode)

    if (!isTestFile && (moduleSpecifier === 'electron' || nodeModules.has(moduleSpecifier))) {
      errors.push(`${location} renderer source must not import Node.js or Electron module "${moduleSpecifier}"`)
    }

    const targetFilePath = resolveLocalImport(sourceFile.fileName, moduleSpecifier)
    if (targetFilePath === null) return

    const targetContext = getSourceContext(targetFilePath, sourceRoot)
    const sourceRank = sourceContext.layer === null ? null : layerRanks.get(sourceContext.layer)
    const targetRank = targetContext.layer === null ? null : layerRanks.get(targetContext.layer)
    if (sourceRank !== null && sourceRank !== undefined && targetRank !== null && targetRank !== undefined && sourceRank < targetRank) {
      errors.push(`${location} FSD dependency violation: ${sourceContext.layer} must not import higher layer ${targetContext.layer}`)
    }

    if (
      sourceContext.layer !== null
      && sourceContext.layer === targetContext.layer
      && businessLayers.has(sourceContext.layer)
      && sourceContext.ownerRoot !== null
      && targetContext.ownerRoot !== null
      && sourceContext.ownerRoot !== targetContext.ownerRoot
    ) {
      errors.push(`${location} same-layer slices must not import each other: ${toPosixPath(relative(sourceRoot, sourceContext.ownerRoot))} -> ${toPosixPath(relative(sourceRoot, targetContext.ownerRoot))}`)
    }

    if (
      targetContext.ownerRoot !== null
      && sourceContext.ownerRoot !== targetContext.ownerRoot
      && !isPublicRootEntry(targetFilePath, targetContext.ownerRoot)
    ) {
      errors.push(`${location} cross-module imports must use the root public entry for ${toPosixPath(relative(sourceRoot, targetContext.ownerRoot))}`)
    }
  }

  function visit(node) {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier !== undefined && ts.isStringLiteral(node.moduleSpecifier)) {
      inspectModuleSpecifier(node.moduleSpecifier)
    }
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword && node.arguments.length === 1) {
      const argument = node.arguments[0]
      if (argument !== undefined && ts.isStringLiteral(argument)) inspectModuleSpecifier(argument)
    }
    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
}

function validateRendererSource(sourceFile, sourceRoot, errors) {
  const apiRoot = resolve(sourceRoot, 'shared', 'api')
  const isApiImplementation = sourceFile.fileName === apiRoot || sourceFile.fileName.startsWith(`${apiRoot}${sep}`)
  const isTestFile = /\.test\.tsx?$/.test(sourceFile.fileName)
  const constInitializers = collectConstInitializers(sourceFile)

  function visit(node) {
    if (!isApiImplementation && !isTestFile && ts.isCallExpression(node)) {
      const isGlobalFetch = ts.isIdentifier(node.expression) && node.expression.text === 'fetch'
      const isWindowFetch = ts.isPropertyAccessExpression(node.expression)
        && node.expression.name.text === 'fetch'
        && ts.isIdentifier(node.expression.expression)
        && (node.expression.expression.text === 'window' || node.expression.expression.text === 'globalThis')
      if (isGlobalFetch || isWindowFetch) {
        errors.push(`${getNodeLocation(sourceFile, node.expression)} use shared/api instead of calling fetch directly`)
      }
    }

    if (ts.isJsxAttribute(node) && node.name.text === 'className' && node.initializer !== undefined) {
      let analysis
      if (ts.isStringLiteral(node.initializer)) {
        analysis = { isLiteral: true, values: [node.initializer.text] }
      } else if (ts.isJsxExpression(node.initializer) && node.initializer.expression !== undefined) {
        analysis = analyzeClassExpression(node.initializer.expression, constInitializers)
      } else {
        analysis = { isLiteral: false, values: [] }
      }

      if (!analysis.isLiteral) {
        errors.push(`${getNodeLocation(sourceFile, node)} className must use complete literal strings or complete literal conditional branches`)
      }
      for (const classValue of analysis.values) {
        const violation = findTailwindColorViolation(classValue)
        if (violation !== null) errors.push(`${getNodeLocation(sourceFile, node)} className contains ${violation}; use a semantic theme utility`)
      }
    }

    if (ts.isJsxAttribute(node) && node.name.text === 'style' && node.initializer !== undefined) {
      const styleText = node.initializer.getText(sourceFile)
      if (rawColorPattern.test(styleText) || namedColorPattern.test(styleText)) {
        errors.push(`${getNodeLocation(sourceFile, node)} inline style contains a raw color; use a semantic theme utility`)
      }
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
}

function validateStyles(sourceRoot, themeStylesPath, errors) {
  const styleFiles = walkFiles(sourceRoot).filter((filePath) => ['.css', '.scss', '.sass'].includes(extname(filePath)))
  for (const styleFile of styleFiles) {
    if (styleFile !== themeStylesPath) {
      errors.push(`${toPosixPath(styleFile)} component or module stylesheet is not allowed; use literal Tailwind classes`)
      continue
    }

    const styleContent = readFileSync(styleFile, 'utf8')
    if (!styleContent.includes('@import "tailwindcss" source("../..");')) {
      errors.push(`${toPosixPath(styleFile)} must restrict Tailwind source detection to the src tree with source("../..")`)
    }

    const lines = styleContent.split(/\r?\n/)
    lines.forEach((line, index) => {
      if (!rawColorPattern.test(line)) return
      if (/^\s*--app-(?:color|shadow)-[\w-]+\s*:/.test(line)) return
      errors.push(`${toPosixPath(styleFile)}:${index + 1}: raw colors are only allowed in --app-color-* or --app-shadow-* theme tokens`)
    })
  }
}

export function validateSourceContracts(options = {}) {
  const sourceRoot = resolve(options.sourceRoot ?? 'src')
  const themeStylesPath = resolve(options.themeStylesPath ?? resolve(sourceRoot, 'app', 'styles', 'index.css'))
  const errors = []
  const sourceFiles = walkFiles(sourceRoot).filter((filePath) => rendererExtensions.has(extname(filePath)))

  for (const sourceFilePath of sourceFiles) {
    const scriptKind = sourceFilePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
    const sourceFile = ts.createSourceFile(sourceFilePath, readFileSync(sourceFilePath, 'utf8'), ts.ScriptTarget.Latest, true, scriptKind)
    validateImports(sourceFile, sourceRoot, errors)
    validateRendererSource(sourceFile, sourceRoot, errors)
  }
  validateStyles(sourceRoot, themeStylesPath, errors)

  return errors
}

function runCli() {
  const errors = validateSourceContracts()
  if (errors.length === 0) return

  for (const error of errors) console.error(`Source contract validation: ${error}`)
  process.exitCode = 1
}

const invokedPath = process.argv[1] === undefined ? null : pathToFileURL(resolve(process.argv[1])).href
if (invokedPath === import.meta.url) runCli()
