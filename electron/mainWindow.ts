import { BrowserWindow } from 'electron'
import windowStateKeeper from 'electron-window-state'
import { appLongName } from './main'
import BrowserWinHandler from './BrowserWinHandler'


let win: BrowserWindow
let winHandler: BrowserWinHandler

interface Pos {
  x?: number
  y?: number
  width?: number
  height?: number
  manage?: (win: BrowserWindow) => void
}

function createMainWindow(
  pos: Pos = { width: 700, height: 700 }
): BrowserWinHandler {
  const winHandler = new BrowserWinHandler({
    x: pos.x,
    y: pos.y,
    height: pos.height,
    width: pos.width,
    minWidth: 675,
    minHeight: 475,
    title: appLongName,
  })

  winHandler.onCreated((win) => {
    if (pos.manage) {
      pos.manage(win)
    }
  })

  winHandler.loadPage('/')
  return winHandler
}

export function sendToMain(channel: string, ...args: any[]) {
  winHandler.send(channel, ...args)
}

export function getMainWindow() {
  return win
}

export function getMainWinHandler() {
  return winHandler
}

export async function initMainWindow() {
  winHandler = createMainWindow(
    windowStateKeeper({
      defaultWidth: 700,
      defaultHeight: 700,
    })
  )
  win = await winHandler.created()
  return winHandler
}