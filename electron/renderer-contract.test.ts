import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
    contentSecurityPolicy,
    htmlIntegrity,
    isTrustedRenderer,
    parseCspManifest,
    resolveRendererFile,
    verifyHtmlIntegrity,
} from './renderer-contract'

test('static resolver separates directory pages, query-bearing RSC and missing resources', (): void => {
    const root = mkdtempSync(join(tmpdir(), 'learning-renderer-'))
    try {
        mkdirSync(join(root, 'notes'))
        mkdirSync(join(root, '_next/static'), { recursive: true })
        for (const file of [
            'index.html',
            '404.html',
            'notes/index.html',
            'notes/index.txt',
            'notes/__next._tree.txt',
            '_next/static/hash.js',
            'favicon.svg',
        ])
            writeFileSync(join(root, file), file)
        for (const route of ['/notes/', '/notes'])
            assert.equal(
                resolveRendererFile(root, 'englishlearning://app' + route).key,
                'notes/index.html',
            )
        const rsc = resolveRendererFile(
            root,
            'englishlearning://app/notes/__next._tree.txt?view=courses&_rsc=token',
        )
        assert.equal(rsc.status, 200)
        assert.equal(rsc.contentType, 'text/x-component')
        assert.ok(!rsc.cacheControl.includes('immutable'))
        const unknownPage = resolveRendererFile(root, 'englishlearning://app/unknown/')
        assert.equal(unknownPage.status, 404)
        assert.equal(unknownPage.key, '404.html')
        for (const route of [
            '/api',
            '/api/example',
            '/missing.js',
            '/notes/__next.missing.txt?_rsc=token',
            '/_next/missing',
            '/missing.webp',
            '/.csp-manifest.json',
        ]) {
            const result = resolveRendererFile(root, 'englishlearning://app' + route)
            assert.equal(result.status, 404)
            assert.equal(result.file, null)
        }
        assert.ok(
            resolveRendererFile(
                root,
                'englishlearning://app/_next/static/hash.js',
            ).cacheControl.includes('immutable'),
        )
        assert.ok(
            !resolveRendererFile(root, 'englishlearning://app/favicon.svg').cacheControl.includes(
                'immutable',
            ),
        )
        for (const route of ['/notes/%2e%2e%2fsecret', '/%00', '/%5csecret', '/%zz'])
            assert.equal(resolveRendererFile(root, 'englishlearning://app' + route).status, 400)
        if (process.platform !== 'win32') {
            symlinkSync(tmpdir(), join(root, 'escape'))
            assert.equal(resolveRendererFile(root, 'englishlearning://app/escape/').status, 404)
        }
    } finally {
        rmSync(root, { recursive: true, force: true })
    }
})
test('HTML content and inline script hashes must stay in the same version', (): void => {
    const root = mkdtempSync(join(tmpdir(), 'learning-csp-'))
    try {
        const html = '<script>window.ready = true</script><script src="/external.js"></script>'
        writeFileSync(join(root, 'index.html'), html)
        const entry = htmlIntegrity(html)
        const manifest = parseCspManifest({ 'index.html': entry })
        assert.equal(entry.scriptHashes.length, 1)
        assert.ok(
            !contentSecurityPolicy(entry)
                .split('script-src')[1]
                ?.split(';')[0]
                ?.includes('unsafe-inline'),
        )
        verifyHtmlIntegrity(root, manifest)
        writeFileSync(join(root, 'index.html'), html + '<p>changed</p>')
        assert.throws(() => verifyHtmlIntegrity(root, manifest), /mismatch/)
        assert.throws(
            () =>
                parseCspManifest({
                    'index.html': { digest: 'x', scriptHashes: ["'unsafe-inline'"] },
                }),
            /Invalid/,
        )
        assert.throws(() => verifyHtmlIntegrity(root, { '../outside.html': entry }), /path/)
        assert.throws(() => verifyHtmlIntegrity(root, { '..\\outside.html': entry }), /path/)
    } finally {
        rmSync(root, { recursive: true, force: true })
    }
})
test('renderer trust requires the exact production host or assigned loopback development origin', (): void => {
    assert.equal(isTrustedRenderer('englishlearning://app/profile/'), true)
    for (const url of [
        'englishlearning://other/',
        'englishlearning://app:42/',
        'englishlearning://user@app/',
        'file:///tmp/page.html',
        'https://app/',
        'bad-url',
    ])
        assert.equal(isTrustedRenderer(url), false)
    assert.equal(
        isTrustedRenderer('http://127.0.0.1:4123/profile/', 'http://127.0.0.1:4123/'),
        true,
    )
    assert.equal(isTrustedRenderer('http://127.0.0.1:4124/', 'http://127.0.0.1:4123/'), false)
    assert.equal(isTrustedRenderer('https://evil.test/', 'https://evil.test/'), false)
})
