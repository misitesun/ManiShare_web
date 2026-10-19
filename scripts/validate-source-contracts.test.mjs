import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import test from 'node:test'
import { validateSourceContracts } from './validate-source-contracts.mjs'

const invalidPaletteClass = ['bg', 'red', '500'].join('-')
const invalidThemeClass = ['dark', ['text', 'white'].join('-')].join(':')

function createFixture(files) {
    const fixtureRoot = mkdtempSync(resolve(tmpdir(), 'learning-web-source-contracts-'))
    const sourceRoot = resolve(fixtureRoot, 'src')

    for (const [relativePath, content] of Object.entries(files)) {
        const filePath = resolve(sourceRoot, relativePath)
        mkdirSync(resolve(filePath, '..'), { recursive: true })
        writeFileSync(filePath, content)
    }

    return { fixtureRoot, sourceRoot }
}

test('accepts FSD root imports and complete literal Tailwind branches', () => {
    const fixture = createFixture({
        'fsd/app/styles/index.css':
            '@import "tailwindcss" source("../../..");\n:root {\n  --app-color-canvas: #fff;\n}',
        'fsd/pages/course/index.ts': "export { CoursePage } from './ui/CoursePage'\n",
        'fsd/pages/course/ui/CoursePage.tsx': [
            "import { TldButton } from '../../../shared/ui/tld-button'",
            'function SecondaryPanel(): JSX.Element {',
            "  const className = 'bg-surface-raised text-muted'",
            '  return <aside className={className} />',
            '}',
            'export function CoursePage(): JSX.Element {',
            "  const className = true ? 'bg-surface text-primary' : 'bg-canvas text-secondary'",
            '  return <main className={className}><TldButton /><SecondaryPanel /></main>',
            '}',
        ].join('\n'),
        'fsd/shared/ui/tld-button/index.ts': "export { TldButton } from './TldButton'\n",
        'fsd/shared/ui/tld-button/TldButton.tsx':
            'export function TldButton(): JSX.Element { return <button className="bg-brand text-inverse" /> }\n',
    })

    try {
        assert.deepEqual(validateSourceContracts({ sourceRoot: fixture.sourceRoot }), [])
    } finally {
        rmSync(fixture.fixtureRoot, { recursive: true, force: true })
    }
})

test('allows only the gradient text outer wrapper to forward a caller class name', () => {
    const fixture = createFixture({
        'fsd/app/styles/index.css':
            '@import "tailwindcss" source("../../..");\n:root {\n  --app-color-canvas: #fff;\n}',
        'fsd/shared/ui/tld-gradient-text/index.ts':
            "export { TldGradientText } from './TldGradientText'\n",
        'fsd/shared/ui/tld-gradient-text/TldGradientText.tsx': [
            'interface Props { className?: string }',
            "export function TldGradientText({ className = '' }: Props): JSX.Element {",
            '  return <span className={className}><span className="text-primary" /></span>',
            '}',
        ].join('\n'),
    })

    try {
        assert.deepEqual(validateSourceContracts({ sourceRoot: fixture.sourceRoot }), [])
    } finally {
        rmSync(fixture.fixtureRoot, { recursive: true, force: true })
    }
})

test('reports architecture, renderer API and Tailwind contract violations', () => {
    const fixture = createFixture({
        'fsd/app/styles/index.css':
            '@import "tailwindcss" source("../../..");\n:root {\n  --app-color-canvas: #fff;\n}',
        'fsd/features/save-course/index.ts': "export { SaveCourse } from './ui/SaveCourse'\n",
        'fsd/features/save-course/ui/SaveCourse.tsx': [
            "import { CoursePage } from '../../../pages/course'",
            "import { TldButton } from '../../../shared/ui/tld-button/TldButton'",
            "import { readFile } from 'node:fs'",
            'export function SaveCourse(): JSX.Element {',
            "  fetch('/api/courses')",
            `  return <div className={\`${invalidPaletteClass} \${readFile.name}\`}><CoursePage /><TldButton /></div>`,
            '}',
        ].join('\n'),
        'fsd/pages/course/index.ts': "export { CoursePage } from './ui/CoursePage'\n",
        'fsd/pages/course/ui/CoursePage.tsx':
            'export function CoursePage(): JSX.Element { return <main /> }\n',
        'fsd/shared/ui/tld-button/index.ts': "export { TldButton } from './TldButton'\n",
        'fsd/shared/ui/tld-button/TldButton.tsx':
            'export function TldButton(): JSX.Element { return <button /> }\n',
        'fsd/shared/ui/tld-button/styles.css': '.button { color: red; }',
    })

    try {
        const errors = validateSourceContracts({ sourceRoot: fixture.sourceRoot })
        assert.ok(errors.some((error) => error.includes('FSD dependency violation')))
        assert.ok(errors.some((error) => error.includes('root public entry')))
        assert.ok(errors.some((error) => error.includes('Node.js or Electron')))
        assert.ok(errors.some((error) => error.includes('calling fetch directly')))
        assert.ok(errors.some((error) => error.includes('complete literal strings')))
        assert.ok(errors.some((error) => error.includes('stylesheet is not allowed')))
    } finally {
        rmSync(fixture.fixtureRoot, { recursive: true, force: true })
    }
})

test('reports raw Tailwind palette colors even when the class branch is literal', () => {
    const fixture = createFixture({
        'fsd/app/styles/index.css':
            '@import "tailwindcss" source("../../..");\n:root {\n  --app-color-canvas: #fff;\n}',
        'fsd/pages/course/index.ts': "export { CoursePage } from './ui/CoursePage'\n",
        'fsd/pages/course/ui/CoursePage.tsx': `export function CoursePage(): JSX.Element { return <main className="${invalidPaletteClass} ${invalidThemeClass}" /> }\n`,
    })

    try {
        const errors = validateSourceContracts({ sourceRoot: fixture.sourceRoot })
        assert.ok(
            errors.some(
                (error) =>
                    error.includes('raw Tailwind palette color') || error.includes('theme variant'),
            ),
        )
    } finally {
        rmSync(fixture.fixtureRoot, { recursive: true, force: true })
    }
})

test('requires custom transitions to include the Tailwind v4 translate property', () => {
    const fixture = createFixture({
        'fsd/app/styles/index.css':
            '@import "tailwindcss" source("../../..");\n:root {\n  --app-color-canvas: #fff;\n}',
        'fsd/pages/course/ui/CoursePage.tsx': [
            'export function CoursePage(): JSX.Element {',
            '  return <main className="-translate-x-full transition-[transform,width]" />',
            '}',
        ].join('\n'),
    })

    try {
        const errors = validateSourceContracts({ sourceRoot: fixture.sourceRoot })
        assert.ok(
            errors.some((error) =>
                error.includes('Tailwind v4 translate utilities animate the translate property'),
            ),
        )
    } finally {
        rmSync(fixture.fixtureRoot, { recursive: true, force: true })
    }
})

test('reports a Tailwind entry that scans outside the renderer source tree', () => {
    const fixture = createFixture({
        'fsd/app/styles/index.css':
            '@import "tailwindcss";\n:root {\n  --app-color-canvas: #fff;\n}',
    })

    try {
        const errors = validateSourceContracts({ sourceRoot: fixture.sourceRoot })
        assert.ok(errors.some((error) => error.includes('restrict Tailwind source detection')))
    } finally {
        rmSync(fixture.fixtureRoot, { recursive: true, force: true })
    }
})

test('requires GSAP imports to pass through the shared animation boundary', () => {
    const fixture = createFixture({
        'fsd/app/styles/index.css':
            '@import "tailwindcss" source("../../..");\n:root {\n  --app-color-canvas: #fff;\n}',
        'fsd/shared/lib/animation/index.ts': "export { gsap, useGSAP } from './animation'\n",
        'fsd/shared/lib/animation/animation.ts': [
            "import { useGSAP } from '@gsap/react'",
            "import { gsap } from 'gsap'",
            'gsap.registerPlugin(useGSAP)',
            'export { gsap, useGSAP }',
        ].join('\n'),
        'fsd/pages/course/ui/CoursePage.tsx': [
            "import { gsap } from '../../../shared/lib/animation'",
            "import { ScrollTrigger } from 'gsap/ScrollTrigger'",
            'export function CoursePage(): JSX.Element {',
            '  return <main data-gsap={String(gsap.version)} data-plugin={String(ScrollTrigger.version)} />',
            '}',
        ].join('\n'),
    })

    try {
        const errors = validateSourceContracts({ sourceRoot: fixture.sourceRoot })
        assert.equal(errors.filter((error) => error.includes('shared/lib/animation')).length, 1)
        assert.ok(errors.some((error) => error.includes('gsap/ScrollTrigger')))
    } finally {
        rmSync(fixture.fixtureRoot, { recursive: true, force: true })
    }
})

test('Next adapters may consume root enumerators, but FSD cannot import adapter code', () => {
    const fixture = createFixture({
        'fsd/app/styles/index.css': '@import "tailwindcss" source("../../..");',
        'app/example/page.tsx':
            "import { enumerate } from '../../fsd/pages/example'\nexport default function Page() { return null }",
        'fsd/pages/example/index.ts': "export { enumerate } from './model/params'",
        'fsd/pages/example/model/params.ts': 'export function enumerate() { return [] }',
    })
    try {
        assert.deepEqual(validateSourceContracts({ sourceRoot: fixture.sourceRoot }), [])
        writeFileSync(
            resolve(fixture.sourceRoot, 'fsd/pages/example/model/params.ts'),
            "import Page from '../../../../app/example/page'\nexport function enumerate() { return [] }",
        )
        assert.ok(
            validateSourceContracts({ sourceRoot: fixture.sourceRoot }).some((error) =>
                error.includes('Next adapter'),
            ),
        )
    } finally {
        rmSync(fixture.fixtureRoot, { recursive: true, force: true })
    }
})
test('rejects old directories, Router imports, client barrels and dynamic public environment access', () => {
    const fixture = createFixture({
        'fsd/app/styles/index.css': '@import "tailwindcss" source("../../..");',
        'app/api/example/route.ts':
            "import { cookies } from 'next/headers'\nconst fs = require('node:fs')",
        'pages/old/index.ts': "import { Link } from 'react-router-dom'",
        'fsd/pages/example/index.ts':
            "'use client'\nexport const value = process.env['NEXT_PUBLIC_APP_NAME']",
        'fsd/shared/config/old.ts': 'export const value = import.meta.env.VITE_APP_NAME',
    })
    try {
        const errors = validateSourceContracts({ sourceRoot: fixture.sourceRoot })
        for (const message of [
            'source must belong',
            'obsolete renderer framework',
            'Next server APIs',
            'CommonJS require',
            'API Route handlers',
            'public barrel',
            'static member',
            'obsolete environment',
        ])
            assert.ok(
                errors.some((error) => error.includes(message)),
                message,
            )
    } finally {
        rmSync(fixture.fixtureRoot, { recursive: true, force: true })
    }
})

test('仅整词输入 owner 可直接调用固定 insertText 并保留原生撤销历史', () => {
    const fixture = createFixture({
        'fsd/app/styles/index.css': '@import "tailwindcss" source("../../..");',
        'fsd/pages/practice/ui/PracticeWordSlotsInput.tsx': [
            'export function insertPadding(document: Document, padding: string): void {',
            '    try {',
            "        document.execCommand('insertText', false, padding)",
            '    } catch {',
            '        return',
            '    }',
            '}',
        ].join('\n'),
    })

    try {
        assert.deepEqual(validateSourceContracts({ sourceRoot: fixture.sourceRoot }), [])
    } finally {
        rmSync(fixture.fixtureRoot, { recursive: true, force: true })
    }
})

test('oxlint 仅对整词输入精确 owner 覆盖属性规则且继续限制日期与剪贴板', () => {
    const config = JSON.parse(readFileSync(new URL('../.oxlintrc.json', import.meta.url), 'utf8'))
    const ownerOverride = config.overrides.find((override) =>
        override.files.includes('src/fsd/pages/practice/ui/PracticeWordSlotsInput.tsx'),
    )
    assert.deepEqual(ownerOverride?.files, ['src/fsd/pages/practice/ui/PracticeWordSlotsInput.tsx'])
    const ownerRestrictions = ownerOverride.rules['no-restricted-properties']
    assert.equal(ownerRestrictions[0], 'error')
    assert.deepEqual(
        ownerRestrictions.slice(1).map(({ object, property }) => ({ object, property })),
        [
            { object: 'Intl', property: 'DateTimeFormat' },
            { object: undefined, property: 'clipboard' },
        ],
    )
    assert.ok(
        config.rules['no-restricted-properties'].some(
            (restriction) => restriction.property === 'execCommand',
        ),
    )
})

test('整词输入 owner 仍拒绝剪贴板命令、动态命令、属性引用和非直接调用', () => {
    const calls = [
        "document.execCommand('copy', false, padding)",
        "document.execCommand('cut', false, padding)",
        "document.execCommand('paste', false, padding)",
        "const command = 'insertText'; document.execCommand(command, false, padding)",
        'const execute = document.execCommand',
        "if (typeof document.execCommand === 'function') {}",
        "document.execCommand.bind(document)('insertText', false, padding)",
        "document['execCommand']('insertText', false, padding)",
        "document[`execCommand`]('insertText', false, padding)",
        'const { execCommand: execute } = document',
        'const { execCommand } = document',
        "const { ['execCommand']: execute } = document",
        '({ execCommand: execute } = document)',
        '({ execCommand } = document)',
        "(document.execCommand)('insertText', false, padding)",
        "document?.execCommand('insertText', false, padding)",
        "document.execCommand?.('insertText', false, padding)",
        "document.execCommand('insertText', true, padding)",
        "document.execCommand('insertText', false)",
        "document.execCommand('insertText', false, ...padding)",
        "document.execCommand('insertText', false, padding, 'extra')",
    ]
    const fixture = createFixture({
        'fsd/app/styles/index.css': '@import "tailwindcss" source("../../..");',
        'fsd/pages/practice/ui/PracticeWordSlotsInput.tsx': '',
    })

    try {
        for (const call of calls) {
            writeFileSync(
                resolve(fixture.sourceRoot, 'fsd/pages/practice/ui/PracticeWordSlotsInput.tsx'),
                call,
            )
            const errors = validateSourceContracts({ sourceRoot: fixture.sourceRoot })
            assert.ok(
                errors.some((error) => error.includes('execCommand is restricted')),
                call,
            )
        }
    } finally {
        rmSync(fixture.fixtureRoot, { recursive: true, force: true })
    }
})

test('其他 renderer owner 不允许调用相同 insertText 或读取 execCommand 属性', () => {
    const fixture = createFixture({
        'fsd/app/styles/index.css': '@import "tailwindcss" source("../../..");',
        'fsd/pages/practice/ui/OtherInput.tsx':
            "document.execCommand('insertText', false, padding)",
        'fsd/shared/lib/clipboard/command.ts': 'const execute = document.execCommand',
        'app/example/page.tsx': "document['execCommand']('insertText', false, padding)",
    })

    try {
        const errors = validateSourceContracts({ sourceRoot: fixture.sourceRoot })
        assert.equal(
            errors.filter((error) => error.includes('execCommand is restricted')).length,
            3,
        )
    } finally {
        rmSync(fixture.fixtureRoot, { recursive: true, force: true })
    }
})
