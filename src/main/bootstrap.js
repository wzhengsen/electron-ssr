import path from 'path'
import { app, dialog } from 'electron'
import { ensureDir, pathExists, outputJson } from 'fs-extra'
import logger from './logger'
import sudo from 'sudo-prompt'
import defaultConfig from '../shared/config'
import { isWin, isMac, isLinux, isOldMacVersion, isPythonInstalled } from '../shared/env'
import { init as initIcon } from '../shared/icon'
import * as i18n from './locales'
const $t = i18n.default
// app ready事件
export const readyPromise = new Promise(resolve => {
  if (app.isReady()) {
    resolve()
  } else {
    app.once('ready', resolve)
  }
})
isPythonInstalled.then(async (value) => {
  // 检查python是否安装
  if (!value) {
    await readyPromise
    dialog.showErrorBox($t('NOTI_PYTHON_MISSING_TITLE'), $t('NOTI_PYTHON_MISSING_DETAIL'))
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
  }
}
export const winToolPath = _winToolPath
export const winKillPath = _winKillPath
export const s2hPath = _s2hPath
// mac proxy_conf_helper工具目录
export const macToolPath = path.resolve(appConfigDir, 'proxy_conf_helper')
export const libsodiumDir = _libsodiumDir

// 在mac上执行sudo命令
async function sudoMacCommand (command) {
  return new Promise((resolve, reject) => {
    sudo.exec(command, { name: 'ShadowsocksR Client' }, (error, stdout, stderr) => {
      if (error || stderr) {
        reject(error || stderr)
      } else {
        resolve(stdout)
      }
    })
  })
}
/**
 * 确保文件存在，目录正常
 */
async function init () {
  initIcon()
  await ensureDir(appConfigDir)
  // 判断配置文件是否存在，不存在用默认数据写入
  const configFileExists = await pathExists(appConfigPath)
  if (!configFileExists) {
    await outputJson(appConfigPath, defaultConfig, { spaces: '\t' })
  }
  await ensureDir(path.join(appConfigDir, 'logs'))

  // 初始化确保文件存在, 10.11版本以下不支持该功能
  if (isMac && !isOldMacVersion && !await pathExists(macToolPath)) {
    const helperPath = process.env.NODE_ENV === 'development'
      ? path.join(__dirname, '../lib/proxy_conf_helper')
      : path.join(exePath, '../../../Contents/proxy_conf_helper')
    await sudoMacCommand(`cp ${helperPath} "${macToolPath}" && chown root:admin "${macToolPath}" && chmod a+rx "${macToolPath}" && chmod +s "${macToolPath}"`)
  }
  return readyPromise
}
export default init()
