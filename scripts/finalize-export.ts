import {
    cpSync,
    existsSync,
    mkdirSync,
    readFileSync,
    readdirSync,
    renameSync,
    rmSync,
    writeFileSync,
} from 'node:fs'
import { dirname, join, resolve, sep } from 'node:path'
import { htmlIntegrity, verifyHtmlIntegrity } from '../electron/renderer-contract'
import type { HtmlIntegrity } from '../electron/renderer-contract'
import { getAiTutorChatParams } from '../src/fsd/pages/ai-tutor'
import { getAwakeningCourseParams } from '../src/fsd/pages/awakening'
import { getForeignLanguageCourseParams } from '../src/fsd/pages/foreign-language-course'
import { getNotebookChapterParams, getNotebookCourseParams } from '../src/fsd/entities/notebook'
import {
    routePaths,
    aiTutorChatPath,
    awakeningCoursePath,
    foreignLanguageCoursePath,
    notebookCoursePath,
    notebookChapterPath,
} from '../src/fsd/app/config/routes'

function files(directory: string): string[] {
    return readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
        entry.isDirectory() ? files(join(directory, entry.name)) : [join(directory, entry.name)],
    )
}
const target = process.argv[2]
if (target !== 'staging' && target !== 'production') throw new Error('Invalid export environment')
const prerender: unknown = JSON.parse(readFileSync('.next/prerender-manifest.json', 'utf8'))
if (
    typeof prerender !== 'object' ||
    prerender === null ||
    !('routes' in prerender) ||
    typeof prerender.routes !== 'object' ||
    prerender.routes === null
)
    throw new Error('Invalid Next prerender manifest')
const routes = Object.keys(prerender.routes)
    .filter((route) => !['/_not-found', '/_global-error'].includes(route))
    .map((route) => (route === '/' ? route : route.replace(/\/+$/, '') + '/'))
for (const route of Object.values(routePaths).filter((value) => !value.includes('[')))
    if (!routes.includes(route)) throw new Error(`Missing fixed route: ${route}`)
const dynamicGroups: readonly [RegExp, number][] = [
    [/^\/ai-tutor\/mentors\/[^/]+\/scenes\/[^/]+\/$/, 32],
    [/^\/awakening\/courses\/[^/]+\/$/, 2],
    [/^\/foreign-language-guide\/courses\/[^/]+\/$/, 1],
    [/^\/profile\/notes\/courses\/[^/]+\/$/, 24],
    [/^\/profile\/notes\/courses\/[^/]+\/chapters\/[^/]+\/$/, 192],
]
for (const [pattern, count] of dynamicGroups)
    if (routes.filter((route) => pattern.test(route)).length !== count)
        throw new Error('Dynamic route group differs from approved baseline')
const expectedRoutes = [
    ...Object.values(routePaths).filter((route) => !route.includes('[')),
    ...getAiTutorChatParams().map(({ mentorId, sceneId }) => aiTutorChatPath(mentorId, sceneId)),
    ...getAwakeningCourseParams().map(({ courseId }) => awakeningCoursePath(courseId)),
    ...getForeignLanguageCourseParams().map(({ courseId }) => foreignLanguageCoursePath(courseId)),
    ...getNotebookCourseParams().map(({ coursePackageId }) => notebookCoursePath(coursePackageId)),
    ...getNotebookChapterParams().map(({ coursePackageId, chapterId }) =>
        notebookChapterPath(coursePackageId, chapterId),
    ),
]
if (JSON.stringify([...routes].sort()) !== JSON.stringify([...expectedRoutes].sort()))
    throw new Error('Next route set differs from the owner model enumerators')
if (routes.length !== 269 || new Set(routes).size !== routes.length)
    throw new Error('Unexpected business route set')
const root = resolve('out')
for (const route of routes) {
    const directory = join(root, route.slice(1))
    for (const name of ['index.html', 'index.txt', '__next._tree.txt', '__next._full.txt'])
        if (!existsSync(join(directory, name)))
            throw new Error(`Incomplete route export: ${route}${name}`)
}
writeFileSync(join(root, 'robots.txt'), 'User-agent: *\nDisallow: /\n')
writeFileSync(
    join(root, 'sitemap.xml'),
    '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>',
)
const exported = files(root)
const expectedHtml = new Set(routes.map((route) => join(root, route.slice(1), 'index.html')))
const actualHtml = exported.filter(
    (file) =>
        file.endsWith('.html') &&
        !file.startsWith(join(root, '_not-found') + sep) &&
        file !== join(root, '404.html') &&
        file !== join(root, '404/index.html'),
)
if (actualHtml.some((file) => !expectedHtml.has(file)) || actualHtml.length !== expectedHtml.size)
    throw new Error('Exported HTML set differs from route contract')
const manifest: Record<string, HtmlIntegrity> = {}
for (const file of exported.filter((file) => file.endsWith('.html'))) {
    const html = readFileSync(file, 'utf8')
    for (const match of html.matchAll(/(?:src|href)="([^"?#]+)(?:[^"]*)"/g)) {
        const asset = match[1]
        if (asset?.startsWith('/_next/') && !existsSync(join(root, asset.slice(1))))
            throw new Error(`Missing exported asset: ${asset}`)
    }
    manifest[
        file
            .slice(root.length + 1)
            .split('\\')
            .join('/')
    ] = htmlIntegrity(html)
}
writeFileSync(join(root, '.csp-manifest.json'), JSON.stringify(manifest))
writeFileSync(
    join(root, '.export-manifest.json'),
    JSON.stringify({
        environment: target,
        routes,
        htmlCount: routes.length,
        files: [
            ...exported.map((file) =>
                file
                    .slice(root.length + 1)
                    .split(sep)
                    .join('/'),
            ),
            '.csp-manifest.json',
            '.export-manifest.json',
        ],
    }),
)
verifyHtmlIntegrity(root, manifest)
// Validate completely before replacing either environment. A failed export never removes the previous artifact.
const destination = resolve('dist', target)
const temporary = destination + '.next'
const backup = destination + '.previous'
mkdirSync(dirname(destination), { recursive: true })
rmSync(temporary, { recursive: true, force: true })
cpSync(root, temporary, { recursive: true })
rmSync(backup, { recursive: true, force: true })
if (existsSync(destination)) renameSync(destination, backup)
try {
    renameSync(temporary, destination)
} catch (error) {
    if (existsSync(backup)) renameSync(backup, destination)
    throw error
}
rmSync(backup, { recursive: true, force: true })
console.log(
    `Validated ${routes.length} business HTML and complete RSC/assets; published dist/${target}`,
)
