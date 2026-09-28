import { readFile } from 'node:fs/promises'
export async function load(url, context, nextLoad) {
    if (/\.(png|webp|jpe?g|gif|svg)$/.test(new URL(url).pathname)) {
        // Enumerators do not render assets. Verify the source exists, then supply the same URL-shaped import boundary.
        await readFile(new URL(url))
        return {
            format: 'module',
            shortCircuit: true,
            source: `export default ${JSON.stringify({ src: url, width: 1, height: 1 })}`,
        }
    }
    return nextLoad(url, context)
}
