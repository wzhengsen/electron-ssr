import { app, ipcMain, dialog } from 'electron'
import { readJson } from 'fs-extra'
import downloadGitRepo from 'download-git-repo'
import * as events from '@/shared/events'
import { appConfigPath, defaultSSRDownloadDir } from './bootstrap'
import { saveUpdateTime } from './subscribe'
import { updateAppConfig } from './data'
import { hideWindow, sendData } from './window'
import { importConfigFromClipboard } from './tray-handler'
import defaultConfig, { mergeConfig } from '@/shared/config'
import { showNotification } from './notification'
import logger from './logger'

/**
 * ipc-main事件
 */
ipcMain.on(events.EVENT_APP_HIDE_WINDOW, () => {
  // 隐藏窗口
  hideWindow()
}).on(events.EVENT_APP_WEB_INIT, async (e) => {
  // 页面初始化
  let stored
  try {
    stored = await readJson(appConfigPath)
    mergeConfig(stored)
  } catch (error) {
    stored = defaultConfig
  }
  e.reply(events.EVENT_APP_WEB_INIT, {
    config: stored,
    meta: {
      version: app.getVersion(),
      defaultSSRDownloadDir
    }
  })
}).on(events.EVENT_RX_SYNC_RENDERER, (_, data) => {
  // 同步数据
  logger.debug(`received sync data: ${JSON.stringify(data, undefined, 4)}`)
  updateAppConfig(data, true)
}).on(events.EVENT_SSR_DOWNLOAD_RENDERER, e => {
  // 下载ssr
  logger.info('start download ssrr')
  // 自动下载ssr项目
  downloadGitRepo(`shadowsocksrr/shadowsocksr#akkariiin/master`, defaultSSRDownloadDir, err => {
    logger[err ? 'error' : 'info'](`ssrr download ${err ? 'error' : 'success'}`)
    e.sender.send(events.EVENT_SSR_DOWNLOAD_MAIN, err ? err.message : null)
  })
}).on(events.EVENT_CONFIG_COPY_CLIPBOARD, () => {
  logger.info('import config from clipboard')
  // 从剪切板导入
  importConfigFromClipboard()
}).on(events.EVENT_APP_NOTIFY_RENDERER, (_, body, title) => {
  // 显示来自renderer进程的通知
  showNotification(body, title)
}).on(events.EVENT_APP_OPEN_DIALOG, async (e, params) => {
  const ret = await dialog.showOpenDialog(params)
  e.reply(events.EVENT_APP_OPEN_DIALOG, ret.filePaths)
}).on(events.EVENT_SUBSCRIBE_SAVE_TIME, () => {
  logger.debug('Saving Subsciption Update Time')
  saveUpdateTime()
})

/**
 * 将main进程的错误在renderer进程显示出来
 * @param {String|Object} err 错误内容
 */
export function showMainError (err) {
  sendData(events.EVENT_APP_ERROR_MAIN, err)
}
