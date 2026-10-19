import type SiriWave from 'siriwave'

export async function loadSiriWave(): Promise<typeof SiriWave> {
    const module = await import('siriwave')
    return module.default
}
