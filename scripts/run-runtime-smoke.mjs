import { spawn } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { createServer } from 'node:net'
import { setTimeout as delay } from 'node:timers/promises'
import { join, resolve } from 'node:path'
const smokeProfile = mkdtempSync(join(tmpdir(), 'english-learning-runtime-smoke-'))
const smokeEntry = process.argv[2] ?? 'runtime-smoke.cjs'
if (!['runtime-smoke.cjs', 'settings-effects-runtime-smoke.cjs'].includes(smokeEntry)) {
    throw new Error('Unknown runtime smoke entry')
}
const port = await new Promise((resolvePort, reject) => {
    const probe = createServer()
    probe.once('error', reject)
    probe.listen(0, '127.0.0.1', () => {
        const address = probe.address()
        if (!address || typeof address === 'string') {
            reject(new Error('Unable to allocate preview port'))
            probe.close()
            return
        }
        probe.close(() => resolvePort(address.port))
    })
})
const origin = `http://127.0.0.1:${port}`
const preview = spawn(
    process.execPath,
    ['--import', 'tsx', 'scripts/preview-export.ts', 'production'],
    { env: { ...process.env, PREVIEW_PORT: String(port) }, stdio: 'inherit' },
)
let electron
let stopped = false
function stop() {
    if (stopped) return
    stopped = true
    preview.kill('SIGTERM')
    electron?.kill('SIGTERM')
}
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, stop)
try {
    let ready = false
    for (let attempt = 0; attempt < 40 && !stopped; attempt++) {
        try {
            const response = await fetch(origin, { signal: AbortSignal.timeout(1000) })
            if (response.ok) {
                ready = true
                break
            }
        } catch {
            /* Wait for local preview. */
        }
        await delay(100)
    }
    if (!ready) throw new Error('Static preview readiness timed out')
    const result = await new Promise((resolveRun, reject) => {
        electron = spawn(
            process.execPath,
            [resolve('node_modules/electron/cli.js'), `scripts/${smokeEntry}`],
            {
                env: {
                    ...process.env,
                    DESKTOP_SMOKE: '1',
                    SMOKE_WEB_ORIGIN: origin,
                    DESKTOP_SMOKE_USER_DATA: smokeProfile,
                },
                stdio: 'inherit',
            },
        )
        electron.once('error', reject)
        electron.once('exit', (code) => resolveRun(code ?? 1))
    })
    process.exitCode = result
} finally {
    stop()
    rmSync(smokeProfile, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 })
}
