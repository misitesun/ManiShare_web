import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'

const port = await new Promise((resolvePort, reject) => {
    const probe = createServer()
    probe.once('error', reject)
    probe.listen(0, '127.0.0.1', () => {
        const address = probe.address()
        if (address === null || typeof address === 'string') {
            probe.close()
            reject(new Error('Port allocation failed'))
            return
        }
        probe.close((error) => (error ? reject(error) : resolvePort(address.port)))
    })
})
const url = `http://127.0.0.1:${port}/`
let electron
let stopped = false
const renderer = spawn(
    process.execPath,
    [
        'scripts/run-next.mjs',
        'dev',
        'development',
        '--hostname',
        '127.0.0.1',
        '--port',
        String(port),
    ],
    {
        env: process.env,
        stdio: 'inherit',
    },
)
function stop() {
    if (stopped) return
    stopped = true
    renderer.kill('SIGTERM')
    electron?.kill('SIGTERM')
}
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, stop)
renderer.once('error', (error) => {
    console.error(error)
    stop()
    process.exitCode = 1
})
renderer.once('exit', (code) => {
    if (stopped) return
    stop()
    process.exitCode = code ?? 1
})
try {
    let ready = false
    for (let attempt = 0; attempt < 120 && !stopped; attempt++) {
        try {
            const response = await fetch(url, { signal: AbortSignal.timeout(1000) })
            if (response.ok) {
                ready = true
                break
            }
        } catch {
            /* Server is still starting. */
        }
        await delay(500)
    }
    if (!ready) throw new Error('Next dev readiness timed out')
    console.log(`Desktop renderer ready: ${url}`)
    electron = spawn(process.execPath, [resolve('node_modules/electron/cli.js'), '.'], {
        env: { ...process.env, DESKTOP_RENDERER_URL: url },
        stdio: 'inherit',
    })
    electron.once('error', (error) => {
        console.error(error)
        stop()
        process.exitCode = 1
    })
    electron.once('exit', (code) => {
        stop()
        process.exitCode = code ?? 0
    })
} catch (error) {
    console.error(error)
    stop()
    process.exitCode = 1
}
