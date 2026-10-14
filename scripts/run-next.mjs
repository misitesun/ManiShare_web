import { spawn } from 'node:child_process'
import { mkdirSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'
import { loadEnvironment } from './environment.mjs'
import { acquireNextProcessLock } from './next-process-lock.mjs'

const [command, target = 'development', ...args] = process.argv.slice(2)
if (!['dev', 'build', 'typecheck'].includes(command)) throw new Error('Unsupported Next command')
if (command === 'build' && target === 'development')
    throw new Error('Development is dev-server only')
const environment = loadEnvironment(target)
if (command === 'dev') environment.NODE_ENV = 'development'
const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
let child
let stopping = false
function run(parameters) {
    return new Promise((resolveRun, reject) => {
        child = spawn(pnpm, parameters, {
            env: environment,
            stdio: 'inherit',
            detached: process.platform !== 'win32',
            shell: process.platform === 'win32',
        })
        child.once('error', reject)
        child.once('exit', (code, signal) =>
            code === 0
                ? resolveRun()
                : reject(new Error(`Command failed (${signal ?? code}): ${parameters.join(' ')}`)),
        )
    })
}
for (const signal of ['SIGINT', 'SIGTERM'])
    process.on(signal, () => {
        stopping = true
        if (child?.pid === undefined) return
        if (process.platform === 'win32') {
            spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' })
        } else {
            try {
                process.kill(-child.pid, signal)
            } catch (error) {
                if (error.code !== 'ESRCH') throw error
            }
        }
    })
mkdirSync('node_modules/.tmp', { recursive: true })
const lockPath = resolve('node_modules/.tmp/next-process.lock')
let releaseLock
try {
    releaseLock = acquireNextProcessLock(lockPath)
    if (command === 'dev') await run(['exec', 'next', 'dev', ...args])
    else {
        // Remove generated route types first: typecheck must succeed in a clean checkout.
        const cleanup = { recursive: true, force: true, maxRetries: 3, retryDelay: 100 }
        rmSync('.next/types', cleanup)
        rmSync('.next/dev/types', cleanup)
        await run(['exec', 'next', 'typegen'])
        await run(['exec', 'tsc', '--noEmit'])
        if (command === 'build') {
            rmSync('out', cleanup)
            await run(['exec', 'next', 'build'])
            await run([
                'exec',
                'node',
                '--import',
                'tsx',
                '--import',
                './scripts/register-static-assets.mjs',
                'scripts/finalize-export.ts',
                target,
            ])
        }
    }
} catch (error) {
    if (!stopping) throw error
} finally {
    releaseLock?.()
}
