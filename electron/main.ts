import { app, BrowserWindow, ipcMain, net, protocol } from 'electron'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import {
    contentSecurityPolicy,
    digest,
    isTrustedRenderer as trustedRenderer,
    parseCspManifest,
    resolveRendererFile,
    verifyHtmlIntegrity,
} from './renderer-contract.js'
import type { CspManifest } from './renderer-contract.js'

const appProtocol = 'englishlearning'
const developmentRendererUrl = process.env.DESKTOP_RENDERER_URL
if (
    developmentRendererUrl !== undefined &&
    !trustedRenderer(developmentRendererUrl, developmentRendererUrl)
)
    throw new Error('Development renderer must use the assigned loopback HTTP origin')
const electronDirectory = dirname(fileURLToPath(import.meta.url))
const preloadPath = join(electronDirectory, 'preload.cjs')
let mainWindow: BrowserWindow | null = null

protocol.registerSchemesAsPrivileged([
    {
        scheme: appProtocol,
        privileges: {
            standard: true,
            secure: true,
            supportFetchAPI: true,
            corsEnabled: true,
        },
    },
])

function rendererDirectory(): string {
    return join(app.getAppPath(), 'dist', 'production')
}

let cspManifest: CspManifest = {}
async function registerRendererProtocol(): Promise<void> {
    if (developmentRendererUrl === undefined) {
        cspManifest = parseCspManifest(
            JSON.parse(
                readFileSync(join(rendererDirectory(), '.csp-manifest.json'), 'utf8'),
            ) as unknown,
        )
        verifyHtmlIntegrity(rendererDirectory(), cspManifest)
    }
    await protocol.handle(appProtocol, async (request): Promise<Response> => {
        if (!trustedRenderer(request.url)) return new Response('Forbidden', { status: 403 })
        const result = resolveRendererFile(rendererDirectory(), request.url)
        if (result.file === null || result.key === null)
            return new Response('Not found', { status: result.status })
        const headers = new Headers({
            'Content-Type': result.contentType,
            'Cache-Control': result.cacheControl,
            'X-Content-Type-Options': 'nosniff',
        })
        const integrity = cspManifest[result.key]
        if (result.contentType.startsWith('text/html')) {
            if (integrity === undefined || digest(readFileSync(result.file)) !== integrity.digest)
                return new Response('HTML integrity failure', { status: 500 })
            headers.set('Content-Security-Policy', contentSecurityPolicy(integrity))
        }
        const response = await net.fetch(pathToFileURL(result.file).toString())
        return new Response(response.body, { headers, status: result.status })
    })
}

function rendererUrl(): string {
    return developmentRendererUrl ?? `${appProtocol}://app/`
}

function isTrustedRenderer(url: string): boolean {
    return trustedRenderer(url, developmentRendererUrl)
}

async function createMainWindow(): Promise<BrowserWindow> {
    const window = new BrowserWindow({
        width: 1440,
        height: 900,
        minWidth: 360,
        minHeight: 640,
        show: false,
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
            preload: preloadPath,
        },
    })

    window.once('ready-to-show', (): void => {
        if (process.env.DESKTOP_SMOKE !== '1') window.show()
    })
    window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
    window.webContents.on('will-redirect', (event, url): void => {
        if (!isTrustedRenderer(url)) event.preventDefault()
    })
    window.webContents.on('will-navigate', (event, url): void => {
        if (!isTrustedRenderer(url)) event.preventDefault()
    })
    window.on('closed', (): void => {
        mainWindow = null
    })

    await window.loadURL(rendererUrl())
    return window
}

function registerIpcHandlers(): void {
    ipcMain.handle('desktop:get-app-version', (event): string => {
        const senderFrame = event.senderFrame

        if (senderFrame === null || !isTrustedRenderer(senderFrame.url)) {
            throw new Error('Rejected an IPC request from an untrusted renderer.')
        }

        return app.getVersion()
    })
}

app.whenReady().then(async (): Promise<void> => {
    await registerRendererProtocol()
    registerIpcHandlers()
    mainWindow = await createMainWindow()

    app.on('activate', async (): Promise<void> => {
        if (mainWindow === null) mainWindow = await createMainWindow()
    })
})

app.on('window-all-closed', (): void => {
    if (process.platform !== 'darwin') app.quit()
})
