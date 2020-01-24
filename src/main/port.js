import { createServer } from 'net'
import logger from './logger'

/**
 * 判断要监听的host和port是否可用
 * @param {String} host 要监听的地址
 * @param {Number|String} port 要监听的端口
 */
export function ensureHostPortValid (host, port) {
  return new Promise((resolve, reject) => {
    const tester = createServer().listen(port, host)
      .once('error', err => {
        logger.debug(err)
        reject(err)
      })
      .once('listening', () => {
        let closed = false
        tester.close(() => {
          closed = true
          if (timeout) {
            clearTimeout(timeout)
          }
          resolve()
        })
        const timeout = setTimeout(() => {
          if (!closed) {
            reject(new Error('Timeout when release port.'))
          }
        }, 5000)
      })
  })
}

/**
 * 判断端口是否可使用
 * @param {Number|String} port 要判断的端口
 */
export function isPortValid (port) {
  return Promise.all([ensureHostPortValid('0.0.0.0', port), ensureHostPortValid('127.0.0.1', port)])
}
