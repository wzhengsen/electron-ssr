
import { dialog } from 'electron'
import { appConfig$ } from './data'
import { ensureHostPortValid } from './port'
import { s2hPath, winKillPath } from './bootstrap'
import { spawn, exec } from 'child_process'
import logger from './logger'
import * as i18n from './locales'
const $t = i18n.default
let quitByCommand = false
/**
 * @type {import('child_process').ChildProcess|null|undefined}
 */
let socks2httpInstance

/**
 * 开启HTTP代理服务
 * @param {Object} appConfig 应用配置
 */
async function startHttpProxyServer (appConfig, isProxyStarted) {
  if (isProxyStarted) {
    const host = appConfig.shareOverLan ? '0.0.0.0' : '127.0.0.1'
    try {
      await ensureHostPortValid(host, appConfig.httpProxyPort)
      socks2httpInstance = spawn(s2hPath, ['-s', `127.0.0.1:${appConfig.localPort}`, '-l', `${host}:${appConfig.httpProxyPort}`], {
        env: {
          'RUST_LOG': 'info'
        }
      })
      quitByCommand = false
      logger.debug(`s2h Instance is running at pid: ${socks2httpInstance.pid}`)
      socks2httpInstance.stderr.on('data', (info) => {
        logger.info(`s2h: ${info}`)
      })
      socks2httpInstance.stdout.on('data', (info) => {
        logger.info(`s2h: ${info}`)
      })
      socks2httpInstance.on('exit', (code, signal) => {
        if (!quitByCommand) {
          logger.info(`s2h quit unexpected with code/signal: ${code == null ? signal : code}`)
          socks2httpInstance = null
        }
      })
    } catch (error) {
      logger.info(error)
      dialog.showErrorBox($t('NOTI_PORT_TAKEN', { 'port': appConfig.httpProxyPort }), $t('NOTI_CHECK_PORT'))
    }
  }
}

/**
 * 关闭HTTP代理服务
 * @returns {Promise<void>}
 */
export function stopHttpProxyServer () {
  if (socks2httpInstance && !socks2httpInstance.killed) {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        if (socks2httpInstance && !socks2httpInstance.killed) {
          logger.warn('s2h can\'t be closed. Ignoring!')
        }
        resolve()
      }, 3000)
      socks2httpInstance.on('exit', (code, signal) => {
        logger.info(`s2h exited with code/signal: ${code == null ? signal : code}`)
        clearTimeout(timeout)
        socks2httpInstance = null
        resolve()
      })
      quitByCommand = true
      if (process.platform === 'win32') {
        logger.info('Killing Socks2Http')
        exec([winKillPath, '-2', socks2httpInstance.pid].join(' '))
      } else {
        socks2httpInstance.kill('SIGINT')
      }
    })
  }
  return Promise.resolve()
}

// 监听配置变化
appConfig$.subscribe(data => {
  const [appConfig, changed, , isProxyStarted, isOldProxyStarted] = data
  // 初始化
  if (changed.length === 0) {
    startHttpProxyServer(appConfig, isProxyStarted)
  } else {
    // 数据变更
    if (['shareOverLan', 'httpProxyPort'].some(key => changed.indexOf(key) > -1) || isProxyStarted !== isOldProxyStarted) {
      stopHttpProxyServer().then(() => {
        startHttpProxyServer(appConfig, isProxyStarted)
      })
    }
  }
})
