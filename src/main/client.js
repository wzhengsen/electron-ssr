import path from 'path'
import { execFile, exec } from 'child_process'
import { libsodiumDir, winKillPath } from './bootstrap'
import { dialog } from 'electron'
import { appConfig$ } from './data'
import { ensureHostPortValid } from './port'
import logger from './logger'
import { isConfigEqual } from '../shared/utils'
import { showNotification } from './notification'
import { toggleEnable } from './tray-handler'
import * as i18n from './locales'
import { isWin, pythonName } from '@/shared/env'
const $t = i18n.default
let quitByCommand = false
/**
 * @type {import('child_process').ChildProcess|null}
 */
let pythonSSRInstance

/**
 * 运行shell命令并写入到日志中
 * @param {string[]} params 待执行的shell命令
 */
function runPythonSSR (params) {
  let command = pythonName
  const commandStr = `${command} ${params.join(' ')}`
  logger.info('run command: %s', commandStr.replace(/-k [\d\w]* /, '-k ****** '))
  if (isWin) {
    let _env = process.env
    logger.debug(`adding libsodiumDir: ${libsodiumDir} to PATH`)
    let _path = ''
    if (_env.path) {
      _path = `${_env.path};${libsodiumDir}`
    } else {
      _path = libsodiumDir
    }
    logger.debug(`Current PATH: ${_path}`)
    pythonSSRInstance = execFile(command, params, {
      env: {
        path: _path
      }
    })
  } else {
    pythonSSRInstance = execFile(command, params)
  }
  logger.debug(`Python SSR start with pid: ${pythonSSRInstance.pid}`)
  pythonSSRInstance.stdout.on('data', logger.info)
  pythonSSRInstance.stderr.on('data', (error) => {
    error.split('\n').forEach(msg => {
      if (msg.indexOf('INFO') >= 0) {
        logger.info(msg)
      } else if (msg.indexOf('ERROR') >= 0) {
        logger.error(msg)
      } else if (msg.indexOf('WARNING') >= 0) {
        logger.warn(msg)
      } else {
        logger.info(msg)
      }
    })
  })
  pythonSSRInstance.once('exit', (code) => {
    if (!quitByCommand) {
      // todo: notify user python quit
      logger.error(`Python SSR quit with code: ${code}`)
      pythonSSRInstance = null
    }
  })
}

/**
 * 运行ssr
 * @param {Object} appConfig ssr配置
 */
export async function run (appConfig) {
  const listenHost = appConfig.shareOverLan ? '0.0.0.0' : '127.0.0.1'
  // 先结束之前的
  await stop()
  try {
    await ensureHostPortValid(listenHost, appConfig.localPort || 1080)
    const config = appConfig.configs[appConfig.index]
    // 参数
    const params = [path.join(appConfig.ssrPath, 'local.py')]
    params.push('-s')
    params.push(config.server)
    params.push('-p')
    params.push(config.server_port)
    params.push('-k')
    params.push(config.password)
    params.push('-m')
    params.push(config.method)
    params.push('-O')
    params.push(config.protocol)
    if (config.protocolparam) {
      params.push('-G')
      params.push(config.protocolparam)
    }
    if (config.obfs) {
      params.push('-o')
      params.push(config.obfs)
    }
    if (config.obfsparam) {
      params.push('-g')
      params.push(config.obfsparam)
    }
    params.push('-b')
    params.push(listenHost)
    params.push('-l')
    params.push(appConfig.localPort || 1080)
    if (config.timeout) {
      params.push('-t')
      params.push(config.timeout)
    }
    runPythonSSR(params)
  } catch (e) {
    logger.error('SSR Client Port Check failed, with error: ')
    logger.error(e)
    toggleEnable()
    dialog.showErrorBox($t('NOTI_PORT_TAKEN', { 'port': appConfig.localPort }), $t('NOTI_CHECK_PORT'))
  }
}

/**
 * 结束command的后台运行
 * @returns {Promise<void>}
 */
export function stop (force = false) {
  if (pythonSSRInstance && !pythonSSRInstance.killed) {
    logger.log('Kill client')
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        // 5m内如果还没有关掉仍然resolve
        if (pythonSSRInstance && !pythonSSRInstance.killed) {
          logger.error(`Process ${pythonSSRInstance.pid} may not shut down`)
          !force && showNotification($t('NOTI_PROCESS_CANT_KILL', { pid: pythonSSRInstance.pid }))
        }
        resolve()
      }, 5000)
      pythonSSRInstance.once('exit', (code) => {
        logger.debug(`Python SSR exit with code: ${code}`)
        pythonSSRInstance = null
        clearTimeout(timeout)
        resolve()
      })
      if (process.platform === 'win32') {
        logger.info('Killing Python SSR')
        exec([winKillPath, '-2', pythonSSRInstance.pid].join(' '))
      } else {
        pythonSSRInstance.kill('SIGINT')
      }
      quitByCommand = true
    })
  }
  return Promise.resolve()
}

/**
 * 根据配置运行SSR命令
 * @param {Object} appConfig 应用配置
 */
export function runWithConfig (appConfig) {
  if (appConfig.ssrPath && appConfig.enable && appConfig.configs && appConfig.index >= 0 && appConfig.configs[appConfig.index]) {
    run(appConfig)
  }
}

// 监听配置变化
appConfig$.subscribe(data => {
  const [appConfig, changed, oldConfig] = data
  // 初始化
  if (changed.length === 0) {
    runWithConfig(appConfig)
  } else {
    if (changed.indexOf('enable') > -1) {
      if (appConfig.enable) {
        runWithConfig(appConfig)
      } else {
        stop()
      }
    } else if (appConfig.enable) {
      if (['ssrPath', 'index', 'localPort', 'shareOverLan'].some(key => changed.indexOf(key) > -1)) {
        runWithConfig(appConfig)
      }
      if (changed.indexOf('configs') > -1) {
        // configs被清空
        if (!appConfig.configs.length) {
          stop()
        } else if (!oldConfig.configs.length) {
          // configs由空到有
          runWithConfig(appConfig)
        } else if (!isConfigEqual(appConfig.configs[appConfig.index], oldConfig.configs[oldConfig.index])) {
          // 只有选中的配置发生改变时才重新运行
          runWithConfig(appConfig)
        }
      }
    }
  }
})
