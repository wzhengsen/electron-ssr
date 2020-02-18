
import { dialog } from 'electron'
import { appConfig$ } from './data'
import { ensureHostPortValid } from './port'
import { privoxyPath, privoxyCfgPath } from './bootstrap'
import { spawn } from 'child_process'
import logger from './logger'
import * as fse from 'fs-extra'
import * as i18n from './locales'
import { isWin } from '@/shared/env'
const $t = i18n.default
/**
 * @type {import('child_process').ChildProcess|null|undefined}
 */
let privoxyInstance

async function ensurePrivoxyCfg (ssrport, listenPort, shareOverLan) {
  let config = []
  config.push(`listen-address ${shareOverLan ? '0.0.0.0' : '127.0.0.1'}:${listenPort}`)
  config.push('forward         192.168.*.*/     .')
  config.push('forward         10.*.*.*/        .')
  config.push('forward         127.*.*.*/       .')
  config.push(`forward-socks5 / 127.0.0.1:${ssrport} .`)
  await fse.writeFile(privoxyCfgPath, config.join('\n'))
}

/**
 * 开启HTTP代理服务
 * @param {Object} appConfig 应用配置
 */
async function startHttpProxyServer (appConfig, isProxyStarted) {
  if (isProxyStarted && appConfig.httpProxyEnable) {
    const host = appConfig.shareOverLan ? '0.0.0.0' : '127.0.0.1'
    try {
      await ensureHostPortValid(host, appConfig.httpProxyPort)
      await ensurePrivoxyCfg(appConfig.localPort, appConfig.httpProxyPort, appConfig.shareOverLan)
      if (isWin) {
        console.log(privoxyCfgPath)
        privoxyInstance = spawn(privoxyPath, [privoxyCfgPath], {
          windowsHide: true
        })
      } else {
        privoxyInstance = spawn(privoxyPath, ['--no-daemon', privoxyCfgPath])
      }
      logger.debug(`privoxyInstance is running at pid: ${privoxyInstance.pid}`)
      privoxyInstance.stderr.on('data', (info) => {
        logger.info(`privoxy: ${info}`)
      })
      privoxyInstance.stdout.on('data', (info) => {
        logger.info(`privoxy: ${info}`)
      })
      privoxyInstance.on('exit', (code) => {
        logger.info(`Privoxy quit with code: ${code}`)
        privoxyInstance = null
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
  if (privoxyInstance && !privoxyInstance.killed) {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        if (privoxyInstance && !privoxyInstance.killed) {
          logger.warn('Privoxy can\'t be closed. Ignoring!')
        }
        resolve()
      }, 3000)
      privoxyInstance.on('exit', (code) => {
        logger.info(`Privoxy exited with code ${code}`)
        clearTimeout(timeout)
        privoxyInstance = null
        resolve()
      })
      privoxyInstance.kill()
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
    if (['shareOverLan', 'httpProxyEnable', 'httpProxyPort'].some(key => changed.indexOf(key) > -1) || isProxyStarted !== isOldProxyStarted) {
      stopHttpProxyServer().then(() => {
        startHttpProxyServer(appConfig, isProxyStarted)
      })
    }
  }
})
