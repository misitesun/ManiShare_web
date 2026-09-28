import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const errors = []
const requiredDocumentationSections = ['职责', '入口', '约束', '扩展', '验证']

function reportError(message) {
    errors.push(message)
}

function validateDocumentation(documentationPath, description) {
    const content = readFileSync(documentationPath, 'utf8')

    if (!/^#\s+\S/m.test(content))
        reportError(`${description}: documentation must contain a top-level heading`)

    for (const section of requiredDocumentationSections) {
        if (!content.includes(section))
            reportError(`${description}: documentation must describe ${section}`)
    }
}

function requireReadme(modulePath) {
    const readmePath = resolve(modulePath, 'README.md')

    if (!existsSync(readmePath)) {
        reportError(`${modulePath}: missing README.md`)
        return
    }

    validateDocumentation(readmePath, `${modulePath}: README.md`)
}

function hasPublicEntry(directoryPath) {
    return (
        existsSync(resolve(directoryPath, 'index.ts')) ||
        existsSync(resolve(directoryPath, 'index.tsx'))
    )
}

function requirePublicChildReadmes(parentPath) {
    if (!existsSync(parentPath)) return

    for (const entry of readdirSync(parentPath, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue
        const childPath = resolve(parentPath, entry.name)
        if (hasPublicEntry(childPath)) requireReadme(childPath)
    }
}

for (const modulePath of [
    'src/app',
    'src/fsd/app',
    'src/fsd/app/config',
    'src/fsd/app/router',
    'src/fsd/app/styles',
    'src/fsd/features',
    'src/fsd/shared/api',
    'src/fsd/shared/config',
    'src/fsd/shared/constants',
    'src/fsd/shared/i18n',
    'src/fsd/shared/notification',
    'src/fsd/shared/theme',
]) {
    requireReadme(modulePath)
}

for (const parentPath of [
    'src/fsd/entities',
    'src/fsd/features',
    'src/fsd/pages',
    'src/fsd/widgets',
    'src/fsd/shared/lib',
    'src/fsd/shared/ui',
]) {
    requirePublicChildReadmes(parentPath)
}

if (errors.length > 0) {
    for (const error of errors) console.error(`Module documentation validation: ${error}`)
    process.exitCode = 1
}
