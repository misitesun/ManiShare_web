import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { loadEnvironment, managedEnvironmentKeys } from './environment.mjs'

function fixture() {
    const directory = mkdtempSync(join(tmpdir(), 'learning-env-'))
    writeFileSync(
        join(directory, '.env'),
        'NEXT_PUBLIC_APP_NAME=Learning\nNEXT_PUBLIC_APP_DESCRIPTION=Test metadata\nNEXT_PUBLIC_API_BASE_URL=/api\nNEXT_PUBLIC_API_TIMEOUT=15000\nROBOTS_POLICY=noindex,nofollow,noarchive\n',
    )
    writeFileSync(
        join(directory, '.env.staging'),
        'NEXT_PUBLIC_DEPLOY_ENV=staging\nNEXT_PUBLIC_DEFAULT_LANGUAGE=zh-CN\n',
    )
    writeFileSync(
        join(directory, '.env.production'),
        'NEXT_PUBLIC_DEPLOY_ENV=production\nNEXT_PUBLIC_DEFAULT_LANGUAGE=en-US\n',
    )
    return directory
}
test('staging pins every managed key before Next dotenv and does not consume production/local values', () => {
    const directory = fixture()
    try {
        writeFileSync(
            join(directory, '.env.production.local'),
            'NEXT_PUBLIC_API_BASE_URL=https://wrong.test\nSITE_URL=https://wrong.test\n',
        )
        const env = loadEnvironment('staging', {
            directory,
            inherited: { PATH: 'retained', VITE_OLD: 'obsolete' },
        })
        assert.equal(env.NEXT_PUBLIC_DEFAULT_LANGUAGE, 'zh-CN')
        assert.equal(env.NEXT_PUBLIC_DEPLOY_ENV, 'staging')
        assert.equal(env.SITE_URL, '')
        assert.equal(env.NEXT_PUBLIC_API_BASE_URL, '/api')
        assert.equal(env.PATH, 'retained')
        assert.equal(env.VITE_OLD, undefined)
        for (const key of managedEnvironmentKeys) assert.equal(typeof env[key], 'string')
        assert.throws(
            () => loadEnvironment('production', { directory, inherited: {}, ci: true }),
            /local/,
        )
    } finally {
        rmSync(directory, { recursive: true, force: true })
    }
})
test('validation rejects mismatched deployment, invalid metadata, language, timeout, URL and unapproved indexing', () => {
    const directory = fixture()
    try {
        for (const inherited of [
            { NEXT_PUBLIC_DEPLOY_ENV: 'production' },
            { NEXT_PUBLIC_APP_NAME: '' },
            { NEXT_PUBLIC_DEFAULT_LANGUAGE: 'unsupported' },
            { NEXT_PUBLIC_API_TIMEOUT: 'zero' },
            { NEXT_PUBLIC_API_BASE_URL: 'javascript:bad' },
            { ROBOTS_POLICY: 'index,follow' },
            { SITE_URL: 'http://example.test/' },
            { API_PROXY_TARGET: 'file:///tmp/' },
        ])
            assert.throws(() => loadEnvironment('staging', { directory, inherited }))
        const override = loadEnvironment('staging', {
            directory,
            inherited: { NEXT_PUBLIC_API_BASE_URL: 'https://api.example.test' },
        })
        assert.equal(override.NEXT_PUBLIC_API_BASE_URL, 'https://api.example.test')
        assert.throws(() => loadEnvironment('unknown', { directory, inherited: {} }))
    } finally {
        rmSync(directory, { recursive: true, force: true })
    }
})
test('reference expansion follows the managed environment and rejects unknown or cyclic references', () => {
    const directory = fixture()
    try {
        const env = loadEnvironment('staging', {
            directory,
            inherited: { NEXT_PUBLIC_APP_DESCRIPTION: '${NEXT_PUBLIC_APP_NAME} description' },
        })
        assert.equal(env.NEXT_PUBLIC_APP_DESCRIPTION, 'Learning description')
        assert.throws(
            () =>
                loadEnvironment('staging', {
                    directory,
                    inherited: { NEXT_PUBLIC_APP_NAME: '$SECRET' },
                }),
            /Unknown/,
        )
        assert.throws(
            () =>
                loadEnvironment('staging', {
                    directory,
                    inherited: {
                        NEXT_PUBLIC_APP_NAME: '$NEXT_PUBLIC_APP_DESCRIPTION',
                        NEXT_PUBLIC_APP_DESCRIPTION: '$NEXT_PUBLIC_APP_NAME',
                    },
                }),
            /Cyclic/,
        )
    } finally {
        rmSync(directory, { recursive: true, force: true })
    }
})
