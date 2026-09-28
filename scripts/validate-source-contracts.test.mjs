import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
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
