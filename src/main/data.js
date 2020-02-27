import events from 'events'
import fse from 'fs-extra'
import bootstrapPromise, { appConfigPath } from './bootstrap'
import { sendData } from './window'
import { EVENT_RX_SYNC_MAIN } from '@/shared/events'
import defaultConfig, { mergeConfig } from '@/shared/config'
import { isArray, getUpdatedKeys, configMerge, clone } from '@/shared/utils'
import logger from './logger'
let currentConfig = null
let _isQuiting = false
let _isFromRenderer = false
class Data {
  constructor () {
    this.emitter = new events.EventEmitter()
  }
  async init () {
    logger.debug('RX DATA Init')
    await bootstrapPromise
    const stored = await read()
    mergeConfig(stored)
    currentConfig = stored
    this.next([stored, [], null, isProxyStarted(stored), false])
  }
  next (data) {
    this.emitter.emit('data', data)
  }
  subscribe (fn) {
    this.emitter.on('data', fn)
  }
}

let appConfig$ = new Data()
function isProxyStarted (appConfig) {
  return !!(appConfig.enable && appConfig.configs && appConfig.configs[appConfig.index])
}
async function read () {
  let exist = await fse.pathExists(appConfigPath)
  if (exist) {
    try {
      return fse.readJson(appConfigPath)
    } catch (error) {
      logger.error(`The config: ${appConfigPath} is corrupted, using the default config now!`)
      return Promise.resolve(defaultConfig)
    }
  } else {
    return Promise.resolve(defaultConfig)
  }
}

// appConfig$.init()
export {
  currentConfig,
  appConfig$
}
export function updateAppConfig (targetConfig, fromRenderer = false, forceAppendArray = false) {
  const changedKeys = getUpdatedKeys(currentConfig, targetConfig)
  // // 只有有数据变更才更新配置
  if (changedKeys.length) {
    const oldConfig = clone(currentConfig, true)
    configMerge(currentConfig, targetConfig, forceAppendArray)
    _isFromRenderer = fromRenderer
    appConfig$.next([currentConfig, changedKeys, oldConfig, isProxyStarted(currentConfig), isProxyStarted(oldConfig)])
  }
}
export function addConfigs (configs) {
  updateAppConfig({ configs: currentConfig.configs.concat(isArray(configs) ? configs : [configs]) }, false, true)
}
export function isQuiting (target) {
  if (target !== undefined) {
    _isQuiting = target
  } else {
    return _isQuiting
  }
}
appConfig$.subscribe((data) => {
  const [appConfig, changed] = data
  if (changed.length) {
    fse.writeJson(appConfigPath, appConfig, { spaces: '\t' })
    // 如果是从renderer同步过来的数据则不再同步回去，避免重复同步
    // ignore if it came from Renderer
    if (!_isFromRenderer) {
      sendData(EVENT_RX_SYNC_MAIN, appConfig)
    }
  }
})
