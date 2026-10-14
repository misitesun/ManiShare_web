import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parseEnv } from 'node:util'

export const managedEnvironmentKeys = [
    'NEXT_PUBLIC_APP_NAME',
    'NEXT_PUBLIC_APP_DESCRIPTION',
    'NEXT_PUBLIC_DEPLOY_ENV',
    'NEXT_PUBLIC_DEFAULT_LANGUAGE',
    'NEXT_PUBLIC_API_BASE_URL',
    'NEXT_PUBLIC_API_TIMEOUT',
    'ROBOTS_POLICY',
    'SITE_URL',
    'API_PROXY_TARGET',
    'NEXT_DEV_ALLOWED_HOST',
]

export function loadEnvironment(
    target,
    { directory = process.cwd(), inherited = process.env, ci = inherited.CI === 'true' } = {},
) {
    if (!['development', 'staging', 'production'].includes(target))
        throw new Error('Unsupported deployment environment')
    const files = ['.env', `.env.${target}`]
    if (target === 'development') files.push('.env.local', '.env.development.local')
    else if (
        ci &&
        (existsSync(resolve(directory, '.env.local')) ||
            existsSync(resolve(directory, `.env.${target}.local`)))
    )
        throw new Error('CI forbids local environment overrides')
    const values = Object.fromEntries(managedEnvironmentKeys.map((key) => [key, '']))
    for (const file of files) {
        const absolute = resolve(directory, file)
        if (!existsSync(absolute)) continue
        const parsed = parseEnv(readFileSync(absolute, 'utf8'))
        for (const key of managedEnvironmentKeys) if (key in parsed) values[key] = parsed[key]
    }
    for (const key of managedEnvironmentKeys)
        if (inherited[key] !== undefined) values[key] = inherited[key]
    // Expand references only against the explicit project environment, never arbitrary shell variables.
    for (let pass = 0; pass < managedEnvironmentKeys.length; pass++) {
        let changed = false
        for (const key of managedEnvironmentKeys) {
            const next = values[key].replace(
                /\$\{([A-Z_][A-Z0-9_]*)\}|\$([A-Z_][A-Z0-9_]*)/g,
                (match, braced, bare) => {
                    const reference = braced ?? bare
                    if (!managedEnvironmentKeys.includes(reference))
                        throw new Error(`Unknown environment reference in ${key}`)
                    changed = true
                    return values[reference]
                },
            )
            values[key] = next
        }
        if (!changed) break
    }
    if (Object.values(values).some((value) => /\$\{|\$[A-Z_]/.test(value)))
        throw new Error('Cyclic environment reference')
    if (values.NEXT_PUBLIC_DEPLOY_ENV !== target)
        throw new Error('Deployment environment must match requested target')
    if (!values.NEXT_PUBLIC_APP_NAME || !values.NEXT_PUBLIC_APP_DESCRIPTION)
        throw new Error('Application metadata is required')
    if (values.NEXT_PUBLIC_DEFAULT_LANGUAGE !== 'zh-CN')
        throw new Error('Default language must be zh-CN')
    if (
        !/^\d+$/.test(values.NEXT_PUBLIC_API_TIMEOUT) ||
        Number(values.NEXT_PUBLIC_API_TIMEOUT) <= 0
    )
        throw new Error('API timeout must be a positive integer')
    const api = values.NEXT_PUBLIC_API_BASE_URL
    if (!(api.startsWith('/') && !api.startsWith('//')) && !/^https?:\/\//.test(api))
        throw new Error('API base URL must be a path or HTTP URL')
    if (values.ROBOTS_POLICY !== 'noindex,nofollow,noarchive')
        throw new Error('Public indexing is not approved; keep the default robots policy')
    if (values.SITE_URL) {
        const site = new URL(values.SITE_URL)
        if (
            site.protocol !== 'https:' ||
            site.username ||
            site.password ||
            site.pathname !== '/' ||
            site.search ||
            site.hash
        )
            throw new Error('SITE_URL must be a clean HTTPS origin')
    }
    if (values.API_PROXY_TARGET) {
        const proxy = new URL(values.API_PROXY_TARGET)
        if (!['http:', 'https:'].includes(proxy.protocol) || proxy.username || proxy.password)
            throw new Error('Invalid API proxy target')
    }
    if (values.NEXT_DEV_ALLOWED_HOST) {
        const host = values.NEXT_DEV_ALLOWED_HOST
        if (
            target !== 'development' ||
            !/^(?:[a-z\d](?:[a-z\d-]*[a-z\d])?\.)*[a-z\d](?:[a-z\d-]*[a-z\d])?$/i.test(host)
        )
            throw new Error('NEXT_DEV_ALLOWED_HOST must be one development hostname or IP')
    }
    const environment = {
        ...inherited,
        ...values,
        NODE_ENV: target === 'development' ? 'development' : 'production',
    }
    // Next will automatically read other dotenv files, but every managed key is already pinned (including empty values).
    for (const key of Object.keys(environment)) if (key.startsWith('VITE_')) delete environment[key]
    return environment
}
