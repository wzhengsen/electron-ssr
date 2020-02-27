/* eslint-disable no-unused-vars */
import path from 'path'
import { app, dialog } from 'electron'
import { ensureDir, pathExists, outputJson, readJson } from 'fs-extra'
import logger from './logger'
import defaultConfig from '../shared/config'
import { isWin, isMac, isLinux, isOldMacVersion, isPythonInstalled } from '../shared/env'
import { init as initIcon } from '../shared/icon'
import * as i18n from './locales'
import { installMacHelpTool } from './tray-handler'
const $t = i18n.default
// app ready事件
export const readyPromise = new Promise(resolve => {
  if (app.isReady()) {
    resolve()
  } else {
    app.once('ready', resolve)
  }
})

// 未捕获的rejections
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection, reason: ', reason)
})

// 应用配置存储目录
export const appConfigDir = app.getPath('userData')
// 应用配置存储路径
export const appConfigPath = path.join(appConfigDir, 'gui-config.json')
// 默认的ssr下载目录
export const defaultSSRDownloadDir = path.join(appConfigDir, 'shadowsocksr')
// pac文件下载目录
export const pacPath = path.join(appConfigDir, 'pac.txt')
export const pacRawPath = path.join(appConfigDir, 'pac.raw.txt')

export const privoxyCfgPath = path.join(appConfigDir, 'privoxy.cfg')
// 记录上次订阅更新时间的文件
export const subscribeUpdateFile = path.join(appConfigDir, '.subscribe.update.last')
// 当前可执行程序的路径
export const exePath = app.getPath('exe')
// windows sysproxy.exe文件的路径
let _winToolPath
let _winKillPath
let _s2hPath
let _libsodiumDir
if (isWin) {
  if (process.env.NODE_ENV === 'development') {
    _winToolPath = path.resolve(__dirname, '../src/lib/sysproxy.exe')
    _winKillPath = path.resolve(__dirname, '../src/lib/windows-kill.exe')
    _s2hPath = path.resolve(__dirname, '../src/lib/socks2http.exe')
    _libsodiumDir = path.resolve(__dirname, '../src/lib/')
  } else {
    _winToolPath = path.join(path.dirname(exePath), './3rdparty/sysproxy.exe')
    _winKillPath = path.join(path.dirname(exePath), './3rdparty/windows-kill.exe')
    _s2hPath = path.join(path.dirname(exePath), './3rdparty/socks2http.exe')
    _libsodiumDir = path.join(path.dirname(exePath), './3rdparty')
  }
} else if (isLinux || isMac) {
  if (process.env.NODE_ENV === 'development') {
    _s2hPath = path.resolve(__dirname, '../src/lib/socks2http')
  } else {
    _s2hPath = path.join(path.dirname(exePath), './3rdparty/socks2http')
    if (isMac) {
      _s2hPath = path.join(path.dirname(exePath), '../3rdparty/socks2http')
    }
  }
}
export const winToolPath = _winToolPath
export const winKillPath = _winKillPath
export const s2hPath = _s2hPath
// mac proxy_conf_helper工具目录
export const macToolPath = path.resolve(appConfigDir, 'proxy_conf_helper')
export const libsodiumDir = _libsodiumDir
// 在mac上执行sudo命令
/**
 * 确保文件存在，目录正常
 */
async function init () {
  initIcon()
  await ensureDir(appConfigDir)
  // 判断配置文件是否存在，不存在用默认数据写入
  const configFileExists = await pathExists(appConfigPath)
  await ensureDir(path.join(appConfigDir, 'logs'))
  await readyPromise
  isPythonInstalled.then(async (value) => {
    // Check Python existence
    if (!value) {
      dialog.showErrorBox($t('NOTI_PYTHON_MISSING_TITLE'), $t('NOTI_PYTHON_MISSING_DETAIL'))
    }
  })
  if (!configFileExists) {
    // todo better locale detect
    let config = null
    let locale = app.getLocale()
    if (locale.startsWith('zh')) {
      config = Object.assign({}, { lang: 'zh-CN' }, defaultConfig)
    } else {
      config = Object.assign({}, { lang: 'en-US' }, defaultConfig)
    }
    await outputJson(appConfigPath, config, { spaces: 4 })
  }
  if (isMac) {
    let msg = 'Installing macOS Proxy Conf Helper.\n\nWe need install an extra tool to help configuring system proxy.\nYou can always choose to install it in tray menu.'
    let config = await readJson(appConfigPath)
    if (!await isOldMacVersion) {
      if (!await pathExists(macToolPath)) {
        if (!config.noMacToolInstall) {
          let result = await dialog.showMessageBox(null, {
            type: 'question',
            buttons: ['Continue', 'No'],
            defaultId: 0,
            title: 'Installing macOS Proxy Conf Helper.',
            message: msg
          })
          if (result.response === 0) {
            try {
              await installMacHelpTool()
              config['isMacToolInstalled'] = true
            } catch (error) {
              console.log(error)
              logger.error('Failed to install mac proxy_conf_helper')
            }
          } else {
            config['noMacToolInstall'] = true
            config['isMacToolInstalled'] = false
          }
        }
      } else {
        config['isMacToolInstalled'] = true
      }
      await outputJson(appConfigPath, config, { spaces: 4 })
    }
  }
}
export default init()
