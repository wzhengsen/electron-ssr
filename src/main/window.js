import { app, BrowserWindow } from 'electron'
import { isQuiting } from './data'
import logger from './logger'
import {
  createProtocol
} from 'vue-cli-plugin-electron-builder/lib'

let mainWindow
let readyPromise
/**
 * 创建主视图
 */
export function createWindow () {
  mainWindow = new BrowserWindow({
    height: 500,
    width: 800,
    center: true,
    resizable: false,
    minimizable: false,
    maximizable: false,
    show: false,
    webPreferences: { webSecurity: process.env.NODE_ENV === 'production', nodeIntegration: true }
  })
  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    mainWindow.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    if (!process.env.IS_TEST) mainWindow.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    mainWindow.loadURL(`file://${__dirname}/index.html`)
  }
  // hide to tray when window closed
  mainWindow.on('close', (e) => {
    // 当前不是退出APP的时候才去隐藏窗口
    // hide the windows if not quiting
    if (!isQuiting()) {
      e.preventDefault()
      mainWindow.hide()
      if (process.platform === 'darwin') {
        app.dock.hide()
      }
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  readyPromise = new Promise(resolve => {
    mainWindow.webContents.once('did-finish-load', resolve)
  })
}

/**
 * 返回主视图
 */
export function getWindow () {
  return mainWindow
}

/**
 * 显示主视图
 */
export function showWindow () {
  if (mainWindow) {
    mainWindow.show()
    if (process.platform === 'darwin') {
      app.dock.show()
    }
  }
}

/**
 * 隐藏主视图
 */
export function hideWindow () {
  isQuiting(false)
  if (mainWindow) {
    mainWindow.hide()
  }
}

/**
 * 切换窗体显隐
 */
export function toggleWindow () {
  if (mainWindow) {
    if (mainWindow.isVisible()) {
      mainWindow.hide()
    } else {
      mainWindow.show()
    }
  }
}

/**
 * 销毁主视图
 */
export function destroyWindow () {
  if (mainWindow) {
    mainWindow.destroy()
    mainWindow = null
  }
}

/**
 * 向主窗口发送消息
 */
export async function sendData (channel, ...args) {
  if (mainWindow) {
    await readyPromise
    mainWindow.webContents.send(channel, ...args)
  } else {
    logger.debug('not ready')
  }
}

/**
 * 打开开发者工具
 */
export async function openDevtool () {
  if (mainWindow) {
    await readyPromise
    mainWindow.webContents.openDevTools()
  } else {
    logger.debug('not ready')
  }
}
