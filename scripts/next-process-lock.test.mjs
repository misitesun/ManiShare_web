import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { acquireNextProcessLock } from './next-process-lock.mjs'

function fixture() {
    const directory = mkdtempSync(join(tmpdir(), 'learning-next-lock-'))
    return { directory, lockPath: join(directory, 'next-process.lock') }
}

test('an active owner prevents a second Next process and release allows a new one', () => {
    const { directory, lockPath } = fixture()
    try {
        const release = acquireNextProcessLock(lockPath)
        assert.equal(JSON.parse(readFileSync(lockPath, 'utf8')).pid, process.pid)
        assert.throws(() => acquireNextProcessLock(lockPath), /already running/)
        release()
        assert.equal(existsSync(lockPath), false)
        acquireNextProcessLock(lockPath)()
    } finally {
        rmSync(directory, { recursive: true, force: true })
    }
})

test('a stopped owner is recovered without deleting a new owner lock', () => {
    const { directory, lockPath } = fixture()
    try {
        const stopped = spawnSync(process.execPath, ['-e', ''])
        assert.equal(stopped.status, 0)
        writeFileSync(lockPath, JSON.stringify({ pid: stopped.pid, token: 'stale' }))
        const release = acquireNextProcessLock(lockPath)
        const current = JSON.parse(readFileSync(lockPath, 'utf8'))
        assert.equal(current.pid, process.pid)
        assert.notEqual(current.token, 'stale')
        writeFileSync(lockPath, JSON.stringify({ pid: process.pid, token: 'another-owner' }))
        release()
        assert.equal(existsSync(lockPath), true)
    } finally {
        rmSync(directory, { recursive: true, force: true })
    }
})

test('an ownerless legacy lock requires process inspection before removal', () => {
    const { directory, lockPath } = fixture()
    try {
        writeFileSync(lockPath, '')
        assert.throws(() => acquireNextProcessLock(lockPath), /Check for a running Next process/)
        assert.equal(existsSync(lockPath), true)
    } finally {
        rmSync(directory, { recursive: true, force: true })
    }
})
