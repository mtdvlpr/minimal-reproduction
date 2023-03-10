/* eslint-disable import/named */
import { platform } from 'os'
import { join } from 'path'
import { existsSync } from 'fs'
import {
  app,
  BrowserWindow,
  session,
} from 'electron'
import { init } from '@sentry/electron'
import { initRenderer } from 'electron-store'
import installExtension from 'electron-devtools-installer'
import BrowserWinHandler from './BrowserWinHandler'
import { initMainWindow } from './mainWindow'

// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config()
const isDev = process.env.NODE_ENV === 'development'
export const appShortName = 'M³'
export const appLongName = 'Meeting Media Manager'
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
    release: `meeting-media-manager@${
      isDev || !process.env.CI ? 'dev' : app.getVersion()
    }`,
    dsn: process.env.SENTRY_DSN,
  })
}

// Initialize the store
initRenderer()

// Disable hardware acceleration if the user turned it off
try {
  if (existsSync(join(app.getPath('userData'), 'disableHardwareAcceleration')))
    app.disableHardwareAcceleration()
} catch (err) {}

let win: BrowserWindow
let winHandler: BrowserWinHandler

async function boot() {
  winHandler = await initMainWindow()
  win = await winHandler.created()

  if (process.env.VITE_DEV_SERVER_URL) {
    installExtension('nhdogjmejiglipccpnnnanhbledajbpd')
    win.webContents.openDevTools({ mode: 'detach' })
  }

  session.defaultSession.webRequest.onBeforeSendHeaders(
    { urls: ['*://*.jw.org/*'] },
    (details, resolve) => {
      let cookies = 'ckLang=E;'
      if (details.requestHeaders.cookie) {
        cookies += ' ' + details.requestHeaders.cookie
      } else if (details.requestHeaders.Cookie) {
        cookies += ' ' + details.requestHeaders.Cookie
      }
      details.requestHeaders = {
        ...details.requestHeaders,
        Cookie: cookies,
        'User-Agent': details.requestHeaders['User-Agent'].replace(
          /Electron\/\d+\.\d+\.\d+ /,
          ''
        ),
      }
      resolve({ requestHeaders: details.requestHeaders })
    }
  )

  session.defaultSession.webRequest.onHeadersReceived(
    { urls: ['*://*.jw.org/*'] },
    (details, resolve) => {
      if (!details.responseHeaders) details.responseHeaders = {}
      details.responseHeaders['x-frame-options'] = ['ALLOWALL']
      details.responseHeaders['content-security-policy'] = []
      const setCookie = details.responseHeaders['set-cookie']
      if (setCookie) {
        details.responseHeaders['set-cookie'] = setCookie.map((c) =>
          c
            .replace('HttpOnly', 'Secure')
            .replace('Secure', 'SameSite=None; Secure')
        )
      }
      resolve({ responseHeaders: details.responseHeaders })
    }
  )

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
