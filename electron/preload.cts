import type * as Electron from 'electron'

const electron: typeof Electron = require('electron')
const { contextBridge, ipcRenderer } = electron

contextBridge.exposeInMainWorld('learningDesktop', {
    getAppVersion: (): Promise<string> => ipcRenderer.invoke('desktop:get-app-version'),
})
