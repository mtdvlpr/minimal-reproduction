/* eslint-disable import/named */
import { platform } from 'os'
import { join } from 'path'
import {
  app,
  BrowserWindow,
} from 'electron'
import { init } from '@sentry/electron'
import { initRenderer } from 'electron-store'
import installExtension from 'electron-devtools-installer'
import BrowserWinHandler from './BrowserWinHandler'
import { initMainWindow } from './mainWindow'

// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config()
const isDev = process.env.NODE_ENV === 'development'
export const appShortName = 'name'
export const appLongName = 'product long name'
export const AR_WIDTH = 16
export const AR_HEIGHT = 9

if (isDev) {
  app.setPath(
    'userData',
    join(
      app.getPath('appData'),
      appLongName.toLowerCase().replace(' ', '-') + '-dev'
    )
  )
}

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true'

// Allow listeners to work in iFrames
app.commandLine.appendSwitch('disable-site-isolation-trials')

const initSentry =
  !!process.env.SENTRY_DSN &&
  !!process.env.SENTRY_ORG &&
  !!process.env.SENTRY_PROJECT &&
  !!process.env.SENTRY_AUTH_TOKEN

if (initSentry) {
  init({
    environment: isDev ? 'development' : 'production',
    dist: platform().replace('32', ''),
    enabled: !process.env.SENTRY_DISABLE,
    release: `mproduct@${
      isDev || !process.env.CI ? 'dev' : app.getVersion()
    }`,
    dsn: process.env.SENTRY_DSN,
  })
}

// Initialize the store
initRenderer()

let win: BrowserWindow
let winHandler: BrowserWinHandler

async function boot() {
  winHandler = await initMainWindow()
  win = await winHandler.created()

  if (process.env.VITE_DEV_SERVER_URL) {
    installExtension('nhdogjmejiglipccpnnnanhbledajbpd')
    win.webContents.openDevTools({ mode: 'detach' })
  }

  app.on('window-all-closed', () => {
    app.exit()
  })
}

// Prevent opening the app multiple times
const gotTheLock = app.requestSingleInstanceLock()
if (gotTheLock) {
  app.on('second-instance', () => {
    if (!win) return
    if (win.isMinimized()) win.restore()
    win.focus()
  })

  app.whenReady().then(boot)
} else {
  app.quit()
}
