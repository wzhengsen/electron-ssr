/**
 * pac文件下载更新等
 */
import http from 'http'
import httpShutdown from 'http-shutdown'
import { dialog } from 'electron'
import { readFile, writeFile, pathExists, createReadStream } from 'fs-extra'
import logger from './logger'
import { request } from '../shared/utils'
import bootstrapPromise, { pacPath, pacRawPath } from './bootstrap'
import { showNotification } from './notification'
import { currentConfig, appConfig$ } from './data'
import { ensureHostPortValid } from './port'
import * as i18n from './locales'
const $t = i18n.default
let pacServer

httpShutdown.extend()
const replacePac = (str) => str.replace(/__PROXY__/g,
  `SOCKS5 127.0.0.1:${currentConfig.localPort}; SOCKS 127.0.0.1:${currentConfig.localPort}; PROXY 127.0.0.1:${currentConfig.localPort}; PROXY 127.0.0.1:${currentConfig.httpProxyPort}; DIRECT`)
export async function downloadPac (force = false) {
  await bootstrapPromise
  const pacExisted = await pathExists(pacRawPath)
  logger.debug(`${pacRawPath} pacExisted: ${pacExisted}`)
  let pac = ''
  if (force || !pacExisted) {
    logger.debug('start download pac')
    pac = await request('https://cdn.jsdelivr.net/gh/shadowsocksrr/pac.txt@pac/pac.txt')
    await writeFile(pacRawPath, pac) // save raw pac file
  } else {
    // always gen pac from raw
    pac = (await readFile(pacRawPath)).toString()
  }
  pac = replacePac(pac)
  await writeFile(pacPath, pac)
}
async function updatePacProxy () {
  let content = (await readFile(pacRawPath)).toString()
  content = replacePac(content)
  await writeFile(pacPath, content)
}
let ensurePacPromise = null
let notified = false
/**
 * pac server
 */
async function serverPac (appConfig, isProxyStarted) {
  if (isProxyStarted) {
    const host = currentConfig.shareOverLan ? '0.0.0.0' : '127.0.0.1'
    const port = appConfig.pacPort !== undefined ? appConfig.pacPort : currentConfig.pacPort || 1240
    try {
      await ensureHostPortValid(host, port)
      pacServer = http.createServer(async (req, res) => {
        if (req.url && req.url.startsWith('/proxy.pac')) {
          if (ensurePacPromise == null) {
            ensurePacPromise = downloadPac()
          }
          ensurePacPromise.then(() => {
            res.writeHead(200, {
              'Content-Type': 'application/x-ns-proxy-autoconfig',
              'Connection': 'close'
            })
            createReadStream(pacPath).pipe(res)
          }).catch((error) => {
            logger.error(`Failed to download pac.txt`)
            logger.error(error)
            if (!notified) {
              notified = true
              showNotification($t('NOTI_PAC_UPDATE_FAILED'))
            }
          })
        } else {
          res.writeHead(200)
          res.write('Go /proxy.pac')
          res.end()
        }
      }).withShutdown().listen(port, host)
        .on('listening', () => {
          logger.info(`pac server listen at: ${host}:${port}`)
        })
        .once('error', err => {
          logger.error(`pac server error: ${err}`)
          pacServer.shutdown()
        })
    } catch (err) {
      logger.error('PAC Server Port Check failed, with error: ')
      logger.error(err)
      dialog.showErrorBox($t('NOTI_PORT_TAKEN', { 'port': port }), $t('NOTI_CHECK_PORT'))
    }
  }
}

/**
 * 关闭pac服务
 */
export async function stopPacServer () {
  if (pacServer && pacServer.listening) {
    return new Promise((resolve, reject) => {
      pacServer.shutdown(err => {
        if (err) {
          logger.warn(`close pac server error: ${err}`)
          reject(new Error(`close pac server error: ${err}`))
        } else {
          logger.info('pac server closed.')
          resolve()
        }
      })
    })
  }
  return Promise.resolve()
}

// 监听配置变化
appConfig$.subscribe(data => {
  const [appConfig, changed, , isProxyStarted, isOldProxyStarted] = data
  // 初始化
  if (changed.length === 0) {
    serverPac(appConfig, isProxyStarted)
  } else {
    if (changed.indexOf('pacPort') > -1 || isProxyStarted !== isOldProxyStarted) {
      stopPacServer().then(() => {
        serverPac(appConfig, isProxyStarted)
      })
    }
    if (['localPort', 'httpProxyPort'].some(key => changed.indexOf(key) > -1)) {
      console.log('Ported UPdated')
      updatePacProxy()
    }
  }
})
