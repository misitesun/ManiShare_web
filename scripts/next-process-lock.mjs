import { randomUUID } from 'node:crypto'
import { closeSync, linkSync, openSync, readFileSync, rmSync, writeSync } from 'node:fs'

function readOwner(lockPath) {
    let value
    try {
        value = JSON.parse(readFileSync(lockPath, 'utf8'))
    } catch (error) {
        if (error.code === 'ENOENT') throw error
        throw new Error(
            `Cannot identify the Next lock owner: ${lockPath}. Check for a running Next process before removing this lock.`,
        )
    }
    if (
        typeof value !== 'object' ||
        value === null ||
        !Number.isSafeInteger(value.pid) ||
        value.pid <= 0 ||
        typeof value.token !== 'string' ||
        value.token.length === 0
    )
        throw new Error(`Invalid Next lock owner: ${lockPath}`)
    return value
}

function isRunning(pid) {
    try {
        process.kill(pid, 0)
        return true
    } catch (error) {
        if (error.code === 'ESRCH') return false
        if (error.code === 'EPERM') return true
        throw error
    }
}

export function acquireNextProcessLock(lockPath) {
    const token = randomUUID()
    for (let attempt = 0; attempt < 3; attempt++) {
        let descriptor
        const candidate = `${lockPath}.${token}`
        try {
            descriptor = openSync(candidate, 'wx')
            writeSync(descriptor, JSON.stringify({ pid: process.pid, token }))
            closeSync(descriptor)
            descriptor = undefined
            linkSync(candidate, lockPath)
            return () => {
                try {
                    if (readOwner(lockPath).token === token) rmSync(lockPath)
                } catch (error) {
                    if (error.code !== 'ENOENT') throw error
                }
            }
        } catch (error) {
            if (descriptor !== undefined) closeSync(descriptor)
            if (error.code !== 'EEXIST') throw error
        } finally {
            rmSync(candidate, { force: true })
        }
        const owner = readOwner(lockPath)
        if (isRunning(owner.pid))
            throw new Error(`A Next process is already running (PID ${owner.pid}): ${lockPath}`)
        // Only remove the stale owner observed above. A different owner may have acquired it meanwhile.
        if (readOwner(lockPath).token === owner.token) rmSync(lockPath)
    }
    throw new Error(`Unable to claim the Next process lock: ${lockPath}`)
}
